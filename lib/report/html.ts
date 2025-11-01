import type { Table, StatSummary, ChartArtifact, Report } from '@/types/doc-analysis';

export function buildHtmlReport(params: {
  title: string;
  files: Array<{ name: string; url: string; type: string; size: number }>;
  tables: Table[];
  stats: Record<string, Record<string, StatSummary>>; // tableId -> column -> stats
  charts: ChartArtifact[];
  methodologyNote?: string;
  insights?: string[];
  limits?: string[];
}): string {
  const { title, files, tables, stats, charts, methodologyNote, insights = [], limits = [] } = params;

  const css = `
    :root { color-scheme: light dark; }
    html, body { margin:0; padding:0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }
    body { background: #0b0b0c; color: #e5e7eb; }
    @media (prefers-color-scheme: light) { body { background: #ffffff; color: #111827; } }
    .container { max-width: 960px; margin: 0 auto; padding: 24px; }
    .card { border: 1px solid rgba(128,128,128,0.2); border-radius: 12px; padding: 16px; background: rgba(255,255,255,0.02); }
    .grid { display: grid; gap: 16px; }
    .grid-2 { grid-template-columns: repeat(2, minmax(0,1fr)); }
    .muted { color: #9ca3af; }
    .badge { display:inline-block; padding:2px 8px; border-radius:999px; border:1px solid rgba(128,128,128,.3); font-size:12px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 8px; border-bottom: 1px solid rgba(128,128,128,.25); font-size: 13px; }
    h1{ font-size:32px; margin:0 0 12px; line-height:1.2 }
    h2{ font-size:22px; margin:18px 0 10px }
    h3{ font-size:16px; margin:12px 0 6px }
    img{ max-width:100%; border-radius:8px; border:1px solid rgba(128,128,128,.25) }
  `;

  const fileList = files.map(f => `<li>${f.name} <span class="badge">${f.type}</span> <span class="muted">${(f.size/1024/1024).toFixed(1)} Mo</span></li>`).join('');

  const tablesHtml = tables.map(t => {
    const header = `<tr>${t.columns.map(c => `<th>${escapeHtml(c.name)}<div class=\"muted\" style=\"font-size:11px\">${c.type}${c.unit?` · ${escapeHtml(c.unit)}`:''}</div></th>`).join('')}</tr>`;
    const rows = (t.rows || []).slice(0, 10).map(r => `<tr>${t.columns.map(c => `<td>${formatCell(r[c.name])}</td>`).join('')}</tr>`).join('');
    return `
      <div class="card">
        <h3>Table: ${escapeHtml(t.name)}</h3>
        <div class="muted" style="font-size:12px">Aperçu (10 premières lignes) — Colonnes: ${t.columns.length} · Lignes: ${t.rows.length}</div>
        <div style="overflow:auto; margin-top:8px">
          <table>
            ${header}
            ${rows}
          </table>
        </div>
      </div>
    `;
  }).join('');

  const chartsHtml = charts.map(c => `
    <div class="card">
      <h3>${escapeHtml(c.title || 'Graphique')}</h3>
      <img src="${c.url}" alt="${escapeHtml(c.title || c.id)}" />
    </div>
  `).join('');

  const statsHtml = Object.entries(stats).map(([tableId, cols]) => {
    const table = tables.find(t => t.id === tableId);
    return `
      <div class="card">
        <h3>Statistiques — ${escapeHtml(table?.name || tableId)}</h3>
        <div class="grid grid-2">
          ${Object.entries(cols).map(([col, s]) => `
            <div>
              <h4 style="margin:0 0 4px">${escapeHtml(col)}</h4>
              <div class="muted" style="font-size:12px">NA: ${s.naCount} · n=${s.count}</div>
              <table style="margin-top:6px">
                <tr><td>Moyenne</td><td>${fmt(s.mean)}</td></tr>
                <tr><td>Médiane</td><td>${fmt(s.median)}</td></tr>
                <tr><td>Écart-type</td><td>${fmt(s.std)}</td></tr>
                <tr><td>Min</td><td>${fmt(s.min)}</td></tr>
                <tr><td>Max</td><td>${fmt(s.max)}</td></tr>
              </table>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');

  return `<!doctype html>
  <html lang="fr">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(title)}</title>
      <style>${css}</style>
    </head>
    <body>
      <div class="container">
        <h1>${escapeHtml(title)}</h1>
        <div class="muted" style="margin-bottom:16px">Rapport généré automatiquement — FR</div>

        <div class="card">
          <h2>Résumé exécutif</h2>
          <p>${escapeHtml((insights && insights.length ? insights[0] : 'Synthèse des principaux résultats, tendances et points d’attention.'))}</p>
        </div>

        <div class="grid" style="margin-top:16px">
          <div class="card">
            <h2>Méthodologie</h2>
            <p>${escapeHtml(methodologyNote || 'Analyse documentaire multi-étapes (extraction de tableaux, statistiques descriptives et graphiques).')}</p>
          </div>
          <div class="card">
            <h2>Fichiers analysés</h2>
            <ul>${fileList}</ul>
          </div>
        </div>

        <h2 style="margin-top:20px">Tableaux clés (aperçu)</h2>
        <div class="grid">${tablesHtml || '<div class="muted">Aucun tableau détecté.</div>'}</div>

        <h2 style="margin-top:20px">Statistiques descriptives</h2>
        <div class="grid">${statsHtml || '<div class="card muted">Aucune statistique disponible.</div>'}</div>

        <h2 style="margin-top:20px">Galerie de graphiques</h2>
        <div class="grid grid-2">${chartsHtml || '<div class="card muted">Aucun graphique généré.</div>'}</div>

        <div class="card" style="margin-top:20px">
          <h2>Limites</h2>
          <ul>${(limits && limits.length ? limits : ['Extraction automatique susceptible d’erreurs.', 'Colonnes non numériques exclues des statistiques.']).map(li => `<li>${escapeHtml(li)}</li>`).join('')}</ul>
        </div>
      </div>
    </body>
  </html>`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"]+/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as any)[c]);
}
function formatCell(v: any) {
  if (v == null) return '<span class="muted">null</span>';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return escapeHtml(String(v));
}
function fmt(n: number | null) {
  return n == null || Number.isNaN(n) ? '<span class="muted">—</span>' : String(Number(n.toFixed(4)));
}
