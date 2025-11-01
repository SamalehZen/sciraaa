import { Daytona } from '@daytonaio/sdk';
import { put } from '@vercel/blob';
import { serverEnv } from '@/env/server';
import { SNAPSHOT_NAME } from '@/lib/constants';

const PY_DEFAULT_LIBS = ['pandas','numpy','seaborn','matplotlib','openpyxl'];

const daytona = new Daytona({ apiKey: serverEnv.DAYTONA_API_KEY, target: 'us' });

export type DaytonaChart = { id?: string; type?: string; title?: string; png?: string };

export async function runPython(code: string, { install = PY_DEFAULT_LIBS, timeoutSec = 120 }: { install?: string[]; timeoutSec?: number } = {}) {
  const sandbox = await daytona.create({ snapshot: SNAPSHOT_NAME, timeoutSeconds: timeoutSec });
  try {
    if (install && install.length) {
      await sandbox.process.executeCommand(`pip install -q ${install.join(' ')}`);
    }
    const res = await sandbox.process.codeRun(code);

    let charts: Array<{ id: string; type: string; title?: string; url: string }> = [];
    const artCharts: DaytonaChart[] = (res as any)?.artifacts?.charts || [];
    for (const [idx, ch] of artCharts.entries()) {
      if (!ch.png) continue;
      const buf = Buffer.from(ch.png.split(',').pop() || ch.png, 'base64');
      const blob = await put(`doc-analysis/chart-${Date.now()}-${idx}.png`, buf, { access: 'public', addRandomSuffix: true, contentType: 'image/png' });
      charts.push({ id: ch.id || `chart-${idx}`, type: (ch.type as string) || 'bar', title: ch.title, url: blob.url });
    }

    return { result: (res as any)?.result ?? '', charts };
  } finally {
    try { await sandbox.delete(); } catch {}
  }
}
