'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AuditRow {
  id: string;
  actorUsername: string;
  actorRole: string;
  targetUsername?: string | null;
  action: string;
  metadata?: any;
  ip?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export default function AuditPage() {
  const [actor, setActor] = useState('');
  const [target, setTarget] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['audit', actor, target, action, from, to],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (actor) params.set('actor', actor);
      if (target) params.set('target', target);
      if (action) params.set('action', action);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await fetch(`/api/admin/audit/index?${params.toString()}`);
      if (!res.ok) throw new Error('Erreur');
      return (await res.json()) as { data: AuditRow[] };
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Journal d’audit</h1>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
        <Input placeholder="Acteur" value={actor} onChange={(e) => setActor(e.target.value)} />
        <Input placeholder="Cible" value={target} onChange={(e) => setTarget(e.target.value)} />
        <Input placeholder="Action (e.g. LOGIN)" value={action} onChange={(e) => setAction(e.target.value)} />
        <Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <div>
        <Button onClick={() => refetch()}>Filtrer</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Acteur</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Cible</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Agent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7}>Chargement…</TableCell>
              </TableRow>
            ) : (data?.data ?? []).length ? (
              data!.data.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{r.action}</TableCell>
                  <TableCell>{r.actorUsername}</TableCell>
                  <TableCell>{r.actorRole}</TableCell>
                  <TableCell>{r.targetUsername || '—'}</TableCell>
                  <TableCell>{r.ip || '—'}</TableCell>
                  <TableCell className="max-w-[360px] truncate" title={r.userAgent || ''}>
                    {r.userAgent || '—'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Aucun événement
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
