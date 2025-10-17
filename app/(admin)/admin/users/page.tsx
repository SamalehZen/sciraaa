'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ColumnDef, getCoreRowModel, useReactTable, flexRender, getPaginationRowModel } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, RefreshCw, ShieldBan, ShieldCheck, KeyRound, Trash2 } from 'lucide-react';
import Pusher from 'pusher-js';
import { clientEnv } from '@/env/client';

interface UserRow {
  username: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastSeenAt?: string | null;
  lastIp?: string | null;
  city?: string | null;
  country?: string | null;
  activeSessions: number;
}

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [role, setRole] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-users', q, role, status, page, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (role) params.set('role', role);
      if (status) params.set('status', status);
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      const res = await fetch(`/api/admin/users/index?${params.toString()}`);
      if (!res.ok) throw new Error('Erreur de chargement');
      return (await res.json()) as { data: UserRow[]; total: number; page: number; pageSize: number };
    },
    keepPreviousData: true,
  });

  const columns = useMemo<ColumnDef<UserRow>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(val) => table.toggleAllPageRowsSelected(!!val)}
            aria-label="Sélectionner tout"
          />
        ),
        cell: ({ row }) => (
          <Checkbox checked={row.getIsSelected()} onCheckedChange={(val) => row.toggleSelected(!!val)} />
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'username',
        header: 'Utilisateur',
        cell: ({ getValue }) => (
          <a className="underline" href={`/admin/users/${getValue<string>()}`}>{getValue<string>()}</a>
        ),
      },
      { accessorKey: 'role', header: 'Rôle' },
      {
        accessorKey: 'isActive',
        header: 'Statut',
        cell: ({ getValue }) => (getValue<boolean>() ? 'Actif' : 'Suspendu'),
      },
      {
        accessorKey: 'lastSeenAt',
        header: 'Dernière activité',
        cell: ({ getValue }) => (getValue<string | null>() ? new Date(getValue<string>()).toLocaleString() : '—'),
      },
      {
        accessorKey: 'lastIp',
        header: 'IP / Localisation',
        cell: ({ row }) => {
          const ip = row.original.lastIp || '—';
          const loc = [row.original.city, row.original.country].filter(Boolean).join(', ');
          return (
            <span>
              {ip}
              {loc ? ` — ${loc}` : ''}
            </span>
          );
        },
      },
      { accessorKey: 'activeSessions', header: 'Sessions actives' },
      {
        accessorKey: 'createdAt',
        header: 'Créé le',
        cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString(),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    state: { pagination: { pageIndex: page - 1, pageSize } },
    onPaginationChange: (updater) => {
      // support only page size change from UI component; page handled via buttons below
    },
  });

  // Realtime presence updates: refetch on heartbeats
  useEffect(() => {
    if (!clientEnv.NEXT_PUBLIC_PUSHER_KEY || !clientEnv.NEXT_PUBLIC_PUSHER_CLUSTER) return;
    const p = new Pusher(clientEnv.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: clientEnv.NEXT_PUBLIC_PUSHER_CLUSTER,
      authEndpoint: '/api/pusher/auth',
    });
    const ch = p.subscribe('presence-users');
    const onBeat = () => {
      // Lightweight: only refetch current page, debounce can be added if needed
      refetch();
    };
    ch.bind('heartbeat', onBeat);
    return () => {
      try {
        ch.unbind('heartbeat', onBeat);
        p.unsubscribe('presence-users');
        p.disconnect();
      } catch {}
    };
  }, [q, role, status, page, pageSize]);

  const selected = table.getSelectedRowModel().flatRows.map((r) => r.original.username);

  async function bulkAction(action: 'suspend' | 'unsuspend' | 'reset' | 'delete') {
    if (selected.length === 0) return;
    if (action === 'delete' && !confirm('Supprimer définitivement les utilisateurs sélectionnés ?')) return;
    for (const uname of selected) {
      let method: 'POST' | 'DELETE' = action === 'delete' ? 'DELETE' : 'POST';
      const endpoint =
        action === 'suspend'
          ? `/api/admin/users/${uname}/suspend`
          : action === 'unsuspend'
          ? `/api/admin/users/${uname}/unsuspend`
          : action === 'reset'
          ? `/api/admin/users/${uname}/reset-password`
          : `/api/admin/users/${uname}`;
      await fetch(endpoint, { method, headers: { 'content-type': 'application/json' }, body: action === 'reset' ? JSON.stringify({ password: prompt(`Nouveau mot de passe pour ${uname}`) }) : undefined });
    }
    await refetch();
  }

  function exportCSV() {
    const rows = data?.data ?? [];
    const headers = ['username', 'role', 'statut', 'lastSeenAt', 'ip', 'ville', 'pays', 'sessions', 'createdAt'];
    const lines = [headers.join(',')].concat(
      rows.map((r) =>
        [
          r.username,
          r.role,
          r.isActive ? 'actif' : 'suspendu',
          r.lastSeenAt ?? '',
          r.lastIp ?? '',
          r.city ?? '',
          r.country ?? '',
          String(r.activeSessions ?? 0),
          r.createdAt,
        ].join(','),
      ),
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `utilisateurs.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="Recherche…" value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tous les rôles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous les rôles</SelectItem>
            <SelectItem value="user">user</SelectItem>
            <SelectItem value="admin">admin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous les statuts</SelectItem>
            <SelectItem value="active">Actifs</SelectItem>
            <SelectItem value="suspended">Suspendus</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className="mr-2 h-4 w-4" /> Actualiser
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button variant="secondary" onClick={() => bulkAction('suspend')} disabled={selected.length === 0}>
            <ShieldBan className="mr-2 h-4 w-4" /> Suspendre
          </Button>
          <Button variant="secondary" onClick={() => bulkAction('unsuspend')} disabled={selected.length === 0}>
            <ShieldCheck className="mr-2 h-4 w-4" /> Réactiver
          </Button>
          <Button variant="secondary" onClick={() => bulkAction('reset')} disabled={selected.length === 0}>
            <KeyRound className="mr-2 h-4 w-4" /> Réinitialiser
          </Button>
          <Button variant="destructive" onClick={() => bulkAction('delete')} disabled={selected.length === 0}>
            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length}>Chargement…</TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  Aucun résultat
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {data ? `Total: ${data.total}` : '—'}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Précédent
          </Button>
          <div>
            Page {page} / {data ? Math.max(1, Math.ceil(data.total / pageSize)) : '—'}
          </div>
          <Button
            variant="outline"
            disabled={!data || page >= Math.ceil(data.total / pageSize)}
            onClick={() => setPage((p) => p + 1)}
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
}
