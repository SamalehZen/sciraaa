import * as XLSX from 'xlsx';

export interface ExcelData {
  sheets: {
    name: string;
    headers: string[];
    rows: any[][];
    rowCount: number;
    columnCount: number;
  }[];
}

export async function parseExcelFile(fileUrl: string): Promise<ExcelData> {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch Excel file: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();

  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const sheets = workbook.SheetNames.map((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    const headers = (jsonData[0] || []).map((h) => (h == null || h === '' ? undefined : String(h))) as (string | undefined)[];

    // Normalize empty headers
    const normalizedHeaders: string[] = headers.map((h, i) => (h && h.trim().length > 0 ? h.trim() : `Colonne ${i + 1}`));

    return {
      name: sheetName,
      headers: normalizedHeaders,
      rows: (jsonData.slice(1) as any[][]) || [],
      rowCount: Math.max(0, (jsonData.length || 0) - 1),
      columnCount: normalizedHeaders.length,
    };
  });

  return { sheets };
}

export function excelDataToMarkdown(data: ExcelData): string {
  const lines: string[] = [];
  lines.push(`# 📊 Résumé des données Excel`);
  lines.push('');

  const totalSheets = data.sheets.length;
  const totalRows = data.sheets.reduce((acc, s) => acc + s.rowCount, 0);
  const maxCols = Math.max(0, ...data.sheets.map((s) => s.columnCount));

  lines.push(`- Feuilles détectées: ${totalSheets}`);
  lines.push(`- Lignes totales (hors en-têtes): ${totalRows}`);
  lines.push(`- Colonnes max: ${maxCols}`);
  lines.push('');

  data.sheets.forEach((s, idx) => {
    lines.push(`## Feuille ${idx + 1}: ${s.name}`);
    lines.push(`- Lignes: ${s.rowCount}`);
    lines.push(`- Colonnes: ${s.columnCount}`);
    lines.push(`- En-têtes: ${s.headers.join(' | ') || '—'}`);
    lines.push('');

    // Aperçu des 5 premières lignes
    const preview = s.rows.slice(0, 5);
    if (preview.length > 0) {
      lines.push(`### Aperçu (5 premières lignes)`);
      // Table markdown simple pour inspection (peut être transformée par l'agent en table interactive)
      lines.push(`| ${s.headers.join(' | ')} |`);
      lines.push(`| ${s.headers.map(() => '---').join(' | ')} |`);
      for (const r of preview) {
        const rowStr = s.headers.map((_, i) => (r[i] == null ? '' : String(r[i]))).join(' | ');
        lines.push(`| ${rowStr} |`);
      }
      lines.push('');
    }
  });

  return lines.join('\n');
}
