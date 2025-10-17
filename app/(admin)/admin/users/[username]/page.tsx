'use client';

import { useParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState } from 'react';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('@/components/ui/chart').then((m) => m.Chart), { ssr: false });

export default function AdminUserDetailPage() {
  const params = useParams<{ username: string }>();
  const username = params.username;

  const { data: summary, refetch: refetchSummary } = useQuery({
    queryKey: ['user-summary', username],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/index?q=${encodeURIComponent(username)}&pageSize=1`);
      if (!res.ok) throw new Error('Erreur');
      const json = await res.json();
      return json.data?.[0];
    },
  });

  const { data: audits } = useQuery({
    queryKey: ['user-audit', username],
    queryFn: async () => {
      const res = await fetch(`/api/admin/audit/index?target=${encodeURIComponent(username)}`);
      if (!res.ok) throw new Error('Erreur');
      return (await res.json()).data as any[];
    },
  });

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ['user-messages', username, from, to],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      params.set('format', 'json');
      const res = await fetch(`/api/admin/users/${encodeURIComponent(username)}/messages?${params.toString()}`);
      if (!res.ok) throw new Error('Erreur');
      return (await res.json()).messages as any[];
    },
  });

  const { data: prefs, refetch: refetchPrefs } = useQuery({
    queryKey: ['user-prefs', username],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(username)}/preferences`);
      if (!res.ok) throw new Error('Erreur');
      return (await res.json()).preferences as { username: string; language: string; theme: string; prefs: any };
    },
  });

  const { data: usage } = useQuery({
    queryKey: ['user-usage', username],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(username)}/usage?period=30d`);
      if (!res.ok) throw new Error('Erreur');
      return (await res.json()) as { messages: { d: string; c: number }[]; extremeSearch: { d: string; c: number }[] };
    },
  });

  async function exportMessages(format: 'csv' | 'json') {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    params.set('format', format);
    const res = await fetch(`/api/admin/users/${encodeURIComponent(username)}/messages?${params.toString()}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `messages-${username}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function savePrefs(next: { language: string; theme: string }) {
    await fetch(`/api/admin/users/${encodeURIComponent(username)}/preferences`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...prefs, ...next }),
    });
    await refetchPrefs();
  }

  async function resetPassword() {
    const pwd = prompt('Nouveau mot de passe');
    if (!pwd) return;
    await fetch(`/api/admin/users/${encodeURIComponent(username)}/reset-password`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: pwd }),
    });
  }

  async function suspend() {
    await fetch(`/api/admin/users/${encodeURIComponent(username)}/suspend`, { method: 'POST' });
    await refetchSummary();
  }

  async function unsuspend() {
    await fetch(`/api/admin/users/${encodeURIComponent(username)}/unsuspend`, { method: 'POST' });
    await refetchSummary();
  }

  async function terminateSessions() {
    await fetch(`/api/admin/users/${encodeURIComponent(username)}/terminate-sessions`, { method: 'POST' });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{username}</h1>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Vue d’ensemble</TabsTrigger>
          <TabsTrigger value="activity">Activité</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-md border p-4">
              <div className="text-sm text-muted-foreground">Rôle</div>
              <div className="text-lg font-medium">{summary?.role}</div>
            </div>
            <div className="rounded-md border p-4">
              <div className="text-sm text-muted-foreground">Statut</div>
              <div className="text-lg font-medium">{summary?.isActive ? 'Actif' : 'Suspendu'}</div>
            </div>
            <div className="rounded-md border p-4">
              <div className="text-sm text-muted-foreground">Créé le</div>
              <div className="text-lg font-medium">{summary?.createdAt ? new Date(summary.createdAt).toLocaleString() : '—'}</div>
            </div>
            <div className="rounded-md border p-4">
              <div className="text-sm text-muted-foreground">Dernière activité</div>
              <div className="text-lg font-medium">{summary?.lastSeenAt ? new Date(summary.lastSeenAt).toLocaleString() : '—'}</div>
            </div>
            <div className="rounded-md border p-4">
              <div className="text-sm text-muted-foreground">IP</div>
              <div className="text-lg font-medium">{summary?.lastIp || '—'}</div>
            </div>
            <div className="rounded-md border p-4">
              <div className="text-sm text-muted-foreground">Localisation</div>
              <div className="text-lg font-medium">{[summary?.city, summary?.country].filter(Boolean).join(', ') || '—'}</div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Acteur</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(audits ?? []).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{r.action}</TableCell>
                    <TableCell>{r.actorUsername}</TableCell>
                    <TableCell>{r.actorRole}</TableCell>
                    <TableCell>{r.ip || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="messages">
          <div className="flex gap-2 items-end mb-2">
            <Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
            <Button onClick={() => refetchMessages()}>Filtrer</Button>
            <Button variant="outline" onClick={() => exportMessages('csv')}>Export CSV</Button>
            <Button variant="outline" onClick={() => exportMessages('json')}>Export JSON</Button>
          </div>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Contenu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(messages ?? []).map((m) => (
                  <TableRow key={m.messageId}>
                    <TableCell>{m.createdAt ? new Date(m.createdAt).toLocaleString() : '—'}</TableCell>
                    <TableCell>{m.role}</TableCell>
                    <TableCell className="max-w-[640px] truncate" title={JSON.stringify(m.parts)}>
                      {Array.isArray(m.parts)
                        ? m.parts
                            .filter((p: any) => p.type === 'text' && typeof p.text === 'string')
                            .map((p: any) => p.text)
                            .join(' ')
                        : ''}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm">Langue</label>
              <Select value={prefs?.language || 'fr'} onValueChange={(v) => savePrefs({ language: v, theme: prefs?.theme || 'system' })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm">Thème</label>
              <Select value={prefs?.theme || 'system'} onValueChange={(v) => savePrefs({ language: prefs?.language || 'fr', theme: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Clair</SelectItem>
                  <SelectItem value="dark">Sombre</SelectItem>
                  <SelectItem value="system">Système</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="flex flex-wrap gap-2">
            <Button onClick={resetPassword}>Réinitialiser le mot de passe</Button>
            {summary?.isActive ? (
              <Button variant="secondary" onClick={suspend}>Suspendre</Button>
            ) : (
              <Button variant="secondary" onClick={unsuspend}>Réactiver</Button>
            )}
            <Button variant="outline" onClick={terminateSessions}>Terminer toutes les sessions</Button>
          </div>
        </TabsContent>

        <TabsContent value="usage">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-md border p-4">
              <h3 className="font-medium mb-2">Messages (30j)</h3>
              <Chart type="line" data={{ labels: (usage?.messages ?? []).map((d) => d.d), datasets: [{ label: 'Messages', data: (usage?.messages ?? []).map((d) => d.c) }] }} />
            </div>
            <div className="rounded-md border p-4">
              <h3 className="font-medium mb-2">Extreme Search (30j)</h3>
              <Chart type="bar" data={{ labels: (usage?.extremeSearch ?? []).map((d) => d.d), datasets: [{ label: 'Recherches', data: (usage?.extremeSearch ?? []).map((d) => d.c) }] }} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
