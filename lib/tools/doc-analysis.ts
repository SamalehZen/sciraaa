import { generateObject, tool } from 'ai';
import type { UIMessageStreamWriter } from 'ai';
import { z } from 'zod';
import { scira } from '@/ai/providers';
import type { ChatMessage } from '@/lib/types';
import { put } from '@vercel/blob';
import { runPython } from '@/lib/daytona';
import { buildHtmlReport } from '@/lib/report/html';
import type { Table, ChartArtifact, StatSummary } from '@/types/doc-analysis';
import { TableSchema } from '@/types/doc-analysis';

const FileMetaSchema = z.object({
  url: z.string().url(),
  name: z.string(),
  type: z.string(),
  size: z.number().max(25 * 1024 * 1024),
});

async function docAnalysis(
  input: { prompt: string; files: z.infer<typeof FileMetaSchema>[] },
  dataStream: UIMessageStreamWriter<ChatMessage> | undefined,
) {
  const { prompt, files } = input;

  const safeFiles = (files || []).slice(0, 10);

  if (dataStream) {
    dataStream.write({ type: 'data-doc_analysis', data: { kind: 'plan', status: { title: 'Planification de l’analyse...' } } });
  }

  const { object: planResult } = await generateObject({
    model: scira.languageModel('scira-google-think'),
    schema: z.object({
      plan: z.array(z.object({
        fileName: z.string(),
        steps: z.array(z.string()).min(3).max(8),
        expectedTables: z.array(z.string()).optional().default([]),
      })).min(1),
    }),
    prompt: `Tu es un analyste documentaire multi‑étapes. L’utilisateur fournit des fichiers et des consignes sous-jacentes: ${prompt}.
Fichiers: ${JSON.stringify(safeFiles.map(f => ({ name: f.name, type: f.type, sizeMB: (f.size/1024/1024).toFixed(1) })))}.
Produis un plan concis par fichier (FR).`,
  });

  if (dataStream) {
    dataStream.write({ type: 'data-doc_analysis', data: { kind: 'plan', status: { title: 'Plan généré' }, plan: planResult.plan } });
  }

  const extractedTables: Table[] = [];
  const perFileSummaries: Array<{ file: string; tables: number; confidence: number; note?: string }> = [];

  // Phase 2: Extraction structurée
  for (const f of safeFiles) {
    if (dataStream) {
      dataStream.write({ type: 'data-doc_analysis', data: { kind: 'file_ingested', file: f } as any });
    }
    try {
      let tablesForFile: Table[] = [];
      let confidence = 0.4;
      const ext = (f.name.split('.').pop() || '').toLowerCase();

      if (['pdf','docx'].includes(ext)) {
        // 1) Essayez extraction LLM (Gemini multimodal)
        try {
          const { object: llm } = await generateObject({
            model: scira.languageModel('scira-google-think'),
            schema: z.object({
              tables: z.array(TableSchema),
              confidence: z.number().min(0).max(1).optional().default(0.7),
            }),
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'file', url: f.url, mimeType: f.type } as any,
                  {
                    type: 'text',
                    text: [
                      'Tu es un extracteur de tableaux. Analyse le document joint et retourne un JSON strict:',
                      '{ tables: [ { id, name, columns: [ { name, type, unit?, description? } ], rows: [ { col: value|null } ] } ] }',
                      '- types normalisés: string | number | date | bool',
                      '- garde au plus 200 lignes par table',
                      '- valeurs vides → null',
                      '- units si présentes',
                      '- ne crée PAS de texte libre en dehors du JSON',
                    ].join('\n')
                  } as any,
                ],
              },
            ],
          });
          const candidate: Table[] = (llm.tables || []).map((t, i) => ({ ...t, id: t.id || `${f.name}-t${i+1}` }));
          if (candidate.length) {
            tablesForFile = candidate;
            confidence = llm.confidence ?? 0.7;
          }
        } catch {}
        // 2) Fallback Daytona pour DOCX (python-docx) si aucune table extraite
        if (!tablesForFile.length && ext === 'docx') {
          const code = `
import io, requests, json
from docx import Document

url = ${JSON.stringify(f.url)}
content = requests.get(url).content

try:
    doc = Document(io.BytesIO(content))
except Exception:
    print(json.dumps({"tables": []}))
    raise SystemExit

all_tables = []
idx = 1
for tbl in doc.tables:
    rows = []
    headers = [cell.text.strip() for cell in tbl.rows[0].cells] if len(tbl.rows)>0 else []
    for r in tbl.rows[1:201]:
        obj = {}
        for ci, cell in enumerate(r.cells):
            key = headers[ci] if ci < len(headers) and headers[ci] else f"col_{ci+1}"
            val = cell.text.strip() if cell.text.strip() else None
            obj[key] = val
        rows.append(obj)
    columns = []
    if headers:
        for h in headers:
            columns.append({"name": h or "col", "type": "string", "unit": None, "description": None})
    else:
        # infer from first row
        if rows:
            for k in rows[0].keys():
                columns.append({"name": k, "type": "string", "unit": None, "description": None})
    all_tables.append({"id": f"tbl_{idx}", "name": ${JSON.stringify(f.name)}+"_table_"+str(idx), "columns": columns, "rows": rows})
    idx += 1

print(json.dumps({"tables": all_tables}))
`;
          const { result } = await runPython(code, { install: ['python-docx','requests'] });
          try {
            const parsed = JSON.parse(String(result||'{}'));
            const candidate: Table[] = (parsed.tables || []).map((t: any, i: number) => ({ ...t, id: t.id || `${f.name}-t${i+1}` }));
            if (candidate.length) {
              tablesForFile = candidate;
              confidence = 0.6;
            }
          } catch {}
        }
      } else if (['csv', 'xlsx', 'xls', 'txt'].includes(ext)) {
        // Fallback Daytona parsing with pandas
        const code = `
import pandas as pd
import numpy as np
import io, requests, json

url = ${JSON.stringify(f.url)}
fmt = '${ext}'
if fmt == 'csv' or fmt == 'txt':
    df = pd.read_csv(url, sep=None, engine='python')
elif fmt in ['xlsx','xls']:
    df = pd.read_excel(url)
else:
    df = pd.DataFrame()

# Normalize types
schema = []
for col in df.columns:
    t = 'string'
    if pd.api.types.is_numeric_dtype(df[col]):
        t = 'number'
    elif pd.api.types.is_bool_dtype(df[col]):
        t = 'bool'
    elif pd.api.types.is_datetime64_any_dtype(df[col]):
        t = 'date'
    schema.append({'name': str(col), 'type': t, 'unit': None, 'description': None})

rows = df.head(200).where(pd.notnull(df), None).to_dict(orient='records')
obj = {'id': 'tbl-1', 'name': ${JSON.stringify(f.name)}, 'columns': schema, 'rows': rows}
print(json.dumps(obj))
`;
        const { result } = await runPython(code, { install: ['pandas', 'numpy', 'openpyxl'] });
        try {
          const table = JSON.parse(String(result || '{}')) as Table;
          if (table && table.columns && table.columns.length) {
            tablesForFile = [{ ...table, id: `${f.name}-t1` }];
            confidence = 0.9;
          }
        } catch {}
      } else {
        // For PDF/DOCX we currently skip to avoid OCR/externals; mark as no tables
        tablesForFile = [];
        confidence = 0.3;
      }

      extractedTables.push(...tablesForFile);
      perFileSummaries.push({ file: f.name, tables: tablesForFile.length, confidence, note: tablesForFile.length ? undefined : 'aucune table détectée' });

      if (dataStream) {
        dataStream.write({ type: 'data-doc_analysis', data: { kind: 'extraction', file: f, tables: tablesForFile.map(t => ({ id: t.id, name: t.name, columns: t.columns.length, rows: t.rows.length })), confidence } as any });
      }
    } catch (err) {
      if (dataStream) {
        dataStream.write({ type: 'data-doc_analysis', data: { kind: 'error', file: f, message: 'Échec extraction' } as any });
      }
    }
  }

  // Phase 3: Calculs/statistiques & graphiques via Daytona
  const stats: Record<string, Record<string, StatSummary>> = {};
  const charts: ChartArtifact[] = [];

  for (const t of extractedTables) {
    const code = `
import pandas as pd
import numpy as np
import json

table = json.loads('''${JSON.stringify({ columns: t.columns, rows: t.rows }).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}''')
df = pd.DataFrame(table['rows'])
num_cols = [c['name'] for c in table['columns'] if c['type'] == 'number']
summary = {}
for c in num_cols:
    s = df[c]
    na = int(s.isna().sum())
    cnt = int(s.count())
    summary[c] = {
        'count': cnt,
        'mean': float(s.mean()) if cnt>0 else None,
        'median': float(s.median()) if cnt>0 else None,
        'std': float(s.std()) if cnt>1 else None,
        'min': float(s.min()) if cnt>0 else None,
        'max': float(s.max()) if cnt>0 else None,
        'naCount': int(na)
    }
print(json.dumps({'summary': summary}))
`;
    const { result } = await runPython(code, { install: ['pandas','numpy'] });
    const parsed = (() => { try { return JSON.parse(String(result||'{}')); } catch { return { summary: {} }; } })();
    stats[t.id] = parsed.summary || {};

    // Basic charts (up to 3)
    const firstNumCols = Object.keys(stats[t.id]).slice(0, 3);
    if (firstNumCols.length) {
      const chartCode = `
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import io, base64, json

plt.switch_backend('Agg')

table = json.loads('''${JSON.stringify({ columns: t.columns, rows: t.rows }).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}''')
df = pd.DataFrame(table['rows'])
num_cols = ${JSON.stringify(firstNumCols)}
charts = []
for i, c in enumerate(num_cols):
    plt.figure(figsize=(6,3))
    try:
        sns.histplot(df[c].dropna(), bins=20, kde=False)
        plt.title(f"Distribution — {c}")
        buf = io.BytesIO()
        plt.tight_layout()
        plt.savefig(buf, format='png', dpi=180)
        data = base64.b64encode(buf.getvalue()).decode('utf-8')
        charts.append({'id': f'${t.id}-'+str(i), 'type': 'bar', 'title': f'Distribution — {c}', 'png': data})
    except Exception:
        pass
    finally:
        plt.close()
print(json.dumps({'charts': charts}))
`;
      const chartRes = await runPython(chartCode, { install: ['pandas','numpy','seaborn','matplotlib'] });
      try {
        const parsedCharts = JSON.parse(String(chartRes.result||'{}'));
        if (Array.isArray(parsedCharts.charts)) {
          charts.push(...parsedCharts.charts);
        }
      } catch {}
      if (dataStream) {
        for (const c of charts.slice(-firstNumCols.length)) {
          dataStream.write({ type: 'data-doc_analysis', data: { kind: 'chart', artifact: c } as any });
        }
      }
    }
    if (dataStream) {
      dataStream.write({ type: 'data-doc_analysis', data: { kind: 'compute', tableId: t.id, stats: stats[t.id] } as any });
    }
  }

  // Phase 4: Rapport
  const html = buildHtmlReport({
    title: 'Rapport d’analyse documentaire',
    files: safeFiles as any,
    tables: extractedTables,
    stats,
    charts,
    methodologyNote: 'Planification (LLM Gemini) → Extraction (fallback Daytona) → Statistiques & Graphiques (Daytona) → Rapport (HTML)'.replace('\n',' '),
    insights: [],
    limits: [],
  });

  // Save HTML to blob
  const htmlBlob = await put(`doc-analysis/report-${Date.now()}.html`, new Blob([html], { type: 'text/html' }) as any, { access: 'public', addRandomSuffix: true });

  if (dataStream) {
    dataStream.write({ type: 'data-doc_analysis', data: { kind: 'report', htmlUrl: htmlBlob.url } as any });
    dataStream.write({ type: 'data-doc_analysis', data: { kind: 'done' } as any });
  }

  return { report: { htmlUrl: htmlBlob.url }, tables: extractedTables, stats, charts };
}

export function docAnalysisTool(dataStream: UIMessageStreamWriter<ChatMessage> | undefined) {
  return tool({
    description: 'Analyse documentaire multi‑fichiers (PDF, DOCX, XLSX, CSV, TXT) avec statistiques et rapport HTML (FR).',
    inputSchema: z.object({
      prompt: z.string().describe("Instructions utilisateur en français, texte brut.").default(''),
      files: z.array(FileMetaSchema).min(1).max(10).describe('Liste des fichiers uploadés (URL publiques via Vercel Blob).'),
    }),
    execute: async ({ prompt, files }) => {
      const result = await docAnalysis({ prompt, files }, dataStream);
      return result as any;
    },
  });
}
