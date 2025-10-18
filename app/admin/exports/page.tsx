'use client';

import { Button } from '@/components/ui/button';

function ExportButtons({ resource }: { resource: 'users' | 'audit' | 'messages' | 'lookout' }) {
  async function exportCSV() {
    const r = await fetch('/api/admin/exports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'csv', resource }) });
    const b = await r.text();
    const blob = new Blob([b], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resource}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  async function exportPDF() {
    const r = await fetch('/api/admin/exports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'pdf', resource }) });
    const b = await r.arrayBuffer();
    const blob = new Blob([b], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resource}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={exportCSV}>Exporter CSV</Button>
      <Button variant="outline" onClick={exportPDF}>Exporter PDF</Button>
    </div>
  );
}

export default function AdminExportsPage() {
  return (
    <div className="space-y-6">
      <div className="text-lg font-semibold">Exports</div>
      <div className="space-y-4">
        <div>
          <div className="font-medium mb-2">Users</div>
          <ExportButtons resource="users" />
        </div>
        <div>
          <div className="font-medium mb-2">Audit</div>
          <ExportButtons resource="audit" />
        </div>
        <div>
          <div className="font-medium mb-2">Messages</div>
          <ExportButtons resource="messages" />
        </div>
        <div>
          <div className="font-medium mb-2">Lookout</div>
          <ExportButtons resource="lookout" />
        </div>
      </div>
    </div>
  );
}