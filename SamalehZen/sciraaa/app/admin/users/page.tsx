"use client";

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { pusherClient } from '@/lib/pusher-client';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus } from 'lucide-react';

async function fetchUsers() {
  const res = await fetch('/api/admin/users', { cache: 'no-store' });
  if (!res.ok) throw new Error('failed');
  return res.json();
}

function RowActions({ u, onInvalidate }: { u: any; onInvalidate: () => void }) {
  const [resetOpen, setResetOpen] = useState(false);
  const [tempPwd, setTempPwd] = useState('');
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function doReset() {
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(u.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resetPassword', password: tempPwd }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Échec de la réinitialisation');
      toast.success('Mot de passe réinitialisé');
      setResetOpen(false);
      setTempPwd('');
      onInvalidate();
    } catch (e: any) {
      toast.error(e.message || 'Erreur');
    }
  }
  async function doSuspend() {
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(u.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suspend' }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Échec de la suspension');
      toast.success('Utilisateur suspendu');
      setSuspendOpen(false);
      onInvalidate();
    } catch (e: any) {
      toast.error(e.message || 'Erreur');
    }
  }
  async function doDelete() {
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(u.id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Échec de la suppression');
      toast.success('Utilisateur supprimé');
      setDeleteOpen(false);
      onInvalidate();
    } catch (e: any) {
      toast.error(e.message || 'Erreur');
    }
  }
  async function doChangeRole(role: 'user' | 'admin') {
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(u.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'changeRole', role }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Échec du changement de rôle');
      toast.success('Rôle mis à jour');
      onInvalidate();
    } catch (e: any) {
      toast.error(e.message || 'Erreur');
    }
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setResetOpen(true)}>Réinitialiser le mot de passe…</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSuspendOpen(true)}>Suspendre…</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Changer le rôle</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => doChangeRole('user')}>Utilisateur</DropdownMenuItem>
              <DropdownMenuItem onClick={() => doChangeRole('admin')}>Admin</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>Supprimer…</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>Définir un mot de passe temporaire pour {u.name}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor={`pwd-${u.id}`}>Mot de passe temporaire</Label>
            <Input id={`pwd-${u.id}`} type="text" value={tempPwd} onChange={(e) => setTempPwd(e.target.value)} placeholder="Ex: Azerty123!" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>Annuler</Button>
            <Button onClick={doReset} disabled={tempPwd.length < 3}>Valider</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suspension</AlertDialogTitle>
            <AlertDialogDescription>Le compte de {u.name} sera suspendu immédiatement.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={doSuspend}>Suspendre</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer définitivement ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible. Tous les éléments liés seront supprimés.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CreateUserDialog({ open, onClose, onInvalidate }: { open: boolean; onClose: () => void; onInvalidate: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    try {
      setLoading(true);
      const res = await fetch('/api/local-auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Échec de la création');
      }
      toast.success('Utilisateur créé avec succès');
      onClose();
      onInvalidate();
      setUsername('');
      setPassword('');
      setRole('user');
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
          <DialogDescription>Remplissez les informations ci-dessous pour créer un nouveau compte.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="username">Nom d'utilisateur</Label>
            <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Ex: john.doe" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ex: Password123!" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">Rôle</Label>
            <Select value={role} onValueChange={(v: 'user' | 'admin') => setRole(v)}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Utilisateur</SelectItem>
                <SelectItem value="admin">Administrateur</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleCreate} disabled={loading || !username || !password}>{loading ? 'Création...' : 'Créer'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AgentAccessDialog({ userId, open, onClose }: { userId: string; open: boolean; onClose: () => void }) {
  const { data: agentAccess, refetch } = useQuery({
    queryKey: ['user-agents', userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}/agents`);
      if (!res.ok) throw new Error('Failed to fetch agents');
      return res.json();
    },
    enabled: open,
  });

  const handleToggle = async (agentId: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/agents`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agents: { [agentId]: enabled } }),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast.success('Accès mis à jour');
      refetch();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gestion Accès Agents</DialogTitle>
          <DialogDescription>Cochez les agents auxquels l'utilisateur a accès.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
          {agentAccess?.map((access: any) => (
            <div key={access.agentId} className="flex items-center space-x-2 p-2 border rounded">
              <Checkbox id={`agent-${access.agentId}`} checked={access.enabled} onCheckedChange={(checked) => handleToggle(access.agentId, !!checked)} />
              <Label htmlFor={`agent-${access.agentId}`} className="cursor-pointer text-sm">{access.agentId}</Label>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['admin-users'], queryFn: fetchUsers, refetchOnWindowFocus: true });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [agentDialogUserId, setAgentDialogUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!pusherClient) return;
    const channel = pusherClient.subscribe('private-admin-users');
    const onUpdate = () => qc.invalidateQueries({ queryKey: ['admin-users'] });
    channel.bind('created', onUpdate);
    channel.bind('updated', onUpdate);
    return () => {
      try {
        channel.unbind('created', onUpdate);
        channel.unbind('updated', onUpdate);
        pusherClient.unsubscribe('private-admin-users');
      } catch {}
    };
  }, [qc]);

  const users = data?.users || [];

  return (
    <div className="px-4 lg:px-6">
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Utilisateurs</h2>
            <p className="text-xs text-muted-foreground">Gestion des comptes et accès</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Créer utilisateur
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>En ligne</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Dernière activité</TableHead>
                <TableHead>Accès Agents</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u: any) => {
                const online = u.lastSeen && new Date(u.lastSeen).getTime() > Date.now() - 60_000;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell>
                      <Badge variant={u.status === 'active' ? 'secondary' : u.status === 'suspended' ? 'outline' : 'destructive'}>{u.status}</Badge>
                    </TableCell>
                    <TableCell>{online ? <span className="text-green-600">En ligne</span> : <span className="text-muted-foreground">Hors ligne</span>}</TableCell>
                    <TableCell>{u.ipAddress || '—'}</TableCell>
                    <TableCell>{u.lastSeen ? new Date(u.lastSeen).toLocaleString('fr-FR') : '—'}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => setAgentDialogUserId(u.id)}>
                        Gérer Accès
                      </Button>
                    </TableCell>
                    <TableCell className="min-w-[170px]"><RowActions u={u} onInvalidate={() => qc.invalidateQueries({ queryKey: ['admin-users'] })} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <CreateUserDialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} onInvalidate={() => qc.invalidateQueries({ queryKey: ['admin-users'] })} />

      {agentDialogUserId && (
        <AgentAccessDialog userId={agentDialogUserId} open={!!agentDialogUserId} onClose={() => setAgentDialogUserId(null)} />
      )}
    </div>
  );
}
