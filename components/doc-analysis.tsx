/* eslint-disable @next/next/no-img-element */
'use client';
import React, { useMemo, useState } from 'react';
import type { UIToolInvocation, DataUIPart } from 'ai';
import type { ChatTools, CustomUIDataTypes } from '@/lib/types';
import { Button } from '@/components/ui/button';

type DocAnalysisProps = {
  toolInvocation: UIToolInvocation<ChatTools, 'doc_analysis', any>;
  annotations: DataUIPart<CustomUIDataTypes>[];
};

export default function DocAnalysis({ toolInvocation, annotations }: DocAnalysisProps) {
  const steps = useMemo(() => {
    return (annotations || [])
      .filter(a => a.type === 'data-doc_analysis')
      .map(a => (a as any).data);
  }, [annotations]);

  const reportUrl = useMemo(() => {
    const r = steps.find(s => s.kind === 'report');
    return r?.htmlUrl as string | undefined;
  }, [steps]);

  const charts = useMemo(() => steps.filter(s => s.kind === 'chart').map(s => s.artifact), [steps]);

  const [downloading, setDownloading] = useState(false);
  const exportPdf = async () => {
    if (!reportUrl) return;
    setDownloading(true);
    try {
      const html = await fetch(reportUrl).then(r => r.text());
      const res = await fetch('/api/report/pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ html }) });
      if (res.headers.get('Content-Type')?.includes('application/pdf')) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'rapport.pdf';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const j = await res.json().catch(() => null);
        if (j?.html) {
          const blob = new Blob([j.html], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
        }
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="w-full my-4 space-y-4">
      <div className="rounded-xl border border-border p-4 bg-card">
        <h3 className="text-sm font-semibold mb-2">Analyse documentaire</h3>
        <ol className="text-xs space-y-1">
          {steps.map((s, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="inline-block size-2 rounded-full bg-primary" />
              <span>
                {s.kind === 'plan' && 'Planification'}
                {s.kind === 'file_ingested' && `Fichier chargé: ${s.file?.name || ''}`}
                {s.kind === 'extraction' && `Extraction: ${s.tables?.length || 0} table(s)`}
                {s.kind === 'compute' && `Statistiques: ${Object.keys(s.stats||{}).length} colonne(s)`}
                {s.kind === 'chart' && `Graphique généré`}
                {s.kind === 'report' && 'Rapport prêt'}
                {s.kind === 'done' && 'Terminé'}
                {s.kind === 'error' && `Erreur: ${s.message || ''}`}
              </span>
            </li>
          ))}
        </ol>
        {reportUrl && (
          <div className="mt-3 flex items-center gap-2">
            <a href={reportUrl} target="_blank" rel="noreferrer" className="text-xs underline">Ouvrir le rapport (HTML)</a>
            <Button size="sm" onClick={exportPdf} disabled={downloading}>
              {downloading ? 'Export…' : 'Exporter le rapport (PDF)'}
            </Button>
          </div>
        )}
      </div>

      {charts.length > 0 && (
        <div className="rounded-xl border border-border p-4 bg-card">
          <h4 className="text-sm font-semibold mb-2">Galerie de graphiques</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {charts.map((c: any, idx: number) => (
              <div key={idx} className="border border-border rounded-lg overflow-hidden">
                <div className="p-2 text-xs font-medium">{c.title || 'Graphique'}</div>
                <img src={c.url} alt={c.title || ''} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
