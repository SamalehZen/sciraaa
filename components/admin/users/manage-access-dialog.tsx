"use client";

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { pusherClient } from '@/lib/pusher-client';
import { toast } from 'sonner';

export default function ManageAccessDialog({ open, onOpenChange, user }: { open: boolean; onOpenChange: (open: boolean) => void; user: any | null }) {
  const userId = user?.id as string | undefined;
  const [models, setModels] = useState<Array<{ id: string; key: string; name: string; status: string }>>([]);
  const [granted, setGranted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const grantedKeys = useMemo(() => new Set(granted), [granted]);

  async function load() {
    if (!open || !userId) return;
    setLoading(true);
    try {
      const [allRes, userRes] = await Promise.all([
        fetch('/api/admin/models', { cache: 'no-store' }),
        fetch(`/api/admin/users/${encodeURIComponent(userId)}/models`, { cache: 'no-store' }),
      ]);
      const all = await allRes.json();
      const u = await userRes.json();
      setModels(all.models || []);
      setGranted(new Set((u.models || []).map((m: any) => m.key)));
    } catch {
      toast.error('Chargement des modèles échoué');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [open, userId]);

  useEffect(() => {
    if (!pusherClient) return;
    const channel = pusherClient.subscribe('private-admin-users');
    const onChange = (evt: any) => {
      if (!userId) return;
      if (evt?.userId === userId) {
        load();
      }
    };
    channel.bind('modelAccessChanged', onChange);
    return () => {
      try {
        channel.unbind('modelAccessChanged', onChange);
        pusherClient.unsubscribe('private-admin-users');
      } catch {}
    };
  }, [userId]);

  async function toggle(key: string, checked: boolean) {
    if (!userId) return;
    try {
      if (checked) {
        const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/models`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ modelKey: key }) });
        if (!res.ok) throw new Error();
        setGranted(new Set(Array.from(grantedKeys).concat([key])));
      } else {
        const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/models`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ modelKey: key }) });
        if (!res.ok) throw new Error();
        const next = new Set(grantedKeys);
        next.delete(key);
        setGranted(next);
      }
    } catch {
      toast.error('Mise à jour échouée');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gérer l'accès — {user?.name || ''}</DialogTitle>
          <DialogDescription>Sélectionnez les modèles produits autorisés pour cet utilisateur.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <ScrollArea className="max-h-[320px] pr-2">
            <div className="grid gap-2">
              {models.map((m) => (
                <label key={m.key} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={grantedKeys.has(m.key)} onCheckedChange={(v) => toggle(m.key, Boolean(v))} />
                  <span className="font-medium">{m.name}</span>
                  <span className="text-muted-foreground">({m.key})</span>
                </label>
              ))}
              {models.length === 0 && <div className="text-xs text-muted-foreground">Aucun modèle</div>}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
