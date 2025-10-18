'use client';

import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export default function AdminAuditLogsPage() {
  const { data, refetch } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => {
      const r = await fetch('/api/admin/audit-logs');
      if (!r.ok) throw new Error('failed');
      return r.json();
    },
    refetchInterval: 15000,
  });
  const items = data?.items || [];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="text-lg font-semibold">Journal d’audit</div>
        <div className="ml-auto space-x-2">
          <Button asChild variant="outline"><a href="/api/admin/exports" onClick={(e) => { e.preventDefault(); fetch('/api/admin/exports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'csv', resource: 'audit' }) }).then(async (r) => { const b = await r.text(); const blob = new Blob([b], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'audit.csv'; a.click(); URL.revokeObjectURL(url); }); }}>Exporter CSV</a></Button>
          <Button asChild variant="outline"><a href="/api/admin/exports" onClick={(e) => { e.preventDefault(); fetch('/api/admin/exports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'pdf', resource: 'audit' }) }).then(async (r) => { const b = await r.arrayBuffer(); const blob = new Blob([b], { type: 'application/pdf' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'audit.pdf'; a.click(); URL.revokeObjectURL(url); }); }}>Exporter PDF</a></Button>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Ressource</TableHead>
            <TableHead>Resource ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((it: any) => (
            <TableRow key={it.id}>
              <TableCell>{it.createdAt ? new Date(it.createdAt).toLocaleString() : ''}</TableCell>
              <TableCell>{it.userId}</TableCell>
              <TableCell>{it.action}</TableCell>
              <TableCell>{it.resourceType}</TableCell>
              <TableCell>{it.resourceId}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}