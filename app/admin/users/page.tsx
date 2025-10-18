'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const r = await fetch('/api/admin/users');
      if (!r.ok) throw new Error('failed');
      return r.json();
    },
    refetchInterval: 10000,
  });
  const online = useQuery({
    queryKey: ['admin-online-users'],
    queryFn: async () => {
      const r = await fetch('/api/admin/realtime/online');
      if (!r.ok) return { users: [] };
      return r.json();
    },
    refetchInterval: 5000,
  });
  const items = data?.items || [];
  async function act(id: string, op: string, extra?: any) {
    const r = await fetch(`/api/admin/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op, ...extra }) });
    if (r.ok) qc.invalidateQueries({ queryKey: ['admin-users'] });
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="text-lg font-semibold">Utilisateurs</div>
        <div className="text-sm text-muted-foreground">En ligne: {online.data?.users?.length || 0}</div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Créé</TableHead>
            <TableHead>Dernière activité</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((u: any) => (
            <TableRow key={u.id}>
              <TableCell><Link href={`/admin/users/${u.id}`} className="underline">{u.id}</Link></TableCell>
              <TableCell>{u.name}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>{u.createdAt ? new Date(u.createdAt).toLocaleString() : ''}</TableCell>
              <TableCell>{u.lastActive ? new Date(u.lastActive).toLocaleString() : ''}</TableCell>
              <TableCell>{u.role}</TableCell>
              <TableCell className="capitalize">{u.status}</TableCell>
              <TableCell className="space-x-2">
                <Button size="sm" variant="outline" onClick={async () => { const p = window.prompt('Nouveau mot de passe'); if (p) await act(u.id, 'resetPassword', { password: p }); }}>Reset</Button>
                {u.status === 'suspended' ? (
                  <Button size="sm" variant="default" onClick={() => act(u.id, 'resume')}>Réactiver</Button>
                ) : (
                  <Button size="sm" variant="destructive" onClick={() => act(u.id, 'suspend')}>Suspendre</Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => act(u.id, 'softDelete')}>Supprimer</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}