'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePresence } from '@/hooks/use-presence';

export function BanOverlay() {
  const { banned } = usePresence();
  return (
    <Dialog open={!!banned}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Accès bloqué</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <p>{banned || 'Votre compte est suspendu.'}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
