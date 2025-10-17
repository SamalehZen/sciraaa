'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Pusher from 'pusher-js';
import { clientEnv } from '@/env/client';
import { useUser } from '@/contexts/user-context';

export function usePresence() {
  const { user } = useUser();
  const [banned, setBanned] = useState<string | null>(null);
  const pusherRef = useRef<Pusher | null>(null);

  const username = useMemo(() => {
    const id = user?.id || '';
    return id.startsWith('local:') ? id.slice('local:'.length) : null;
  }, [user?.id]);

  useEffect(() => {
    if (!username || !clientEnv.NEXT_PUBLIC_PUSHER_KEY || !clientEnv.NEXT_PUBLIC_PUSHER_CLUSTER) return;

    const p = new Pusher(clientEnv.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: clientEnv.NEXT_PUBLIC_PUSHER_CLUSTER,
      authEndpoint: '/api/pusher/auth',
      auth: { headers: {} },
    });
    pusherRef.current = p;

    const presence = p.subscribe('presence-users');
    const priv = p.subscribe(`private-user-${username}`);

    const bannedHandler = (data: any) => {
      setBanned(data?.reason || 'Compte suspendu');
    };
    const logoutHandler = async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/sign-in';
      } catch {}
    };

    priv.bind('banned', bannedHandler);
    priv.bind('force-logout', logoutHandler);

    let tid: any;
    const beat = async () => {
      try {
        await fetch('/api/presence/heartbeat', { method: 'POST' });
      } catch {}
      tid = setTimeout(beat, 20000);
    };
    beat();

    return () => {
      clearTimeout(tid);
      priv.unbind('banned', bannedHandler);
      priv.unbind('force-logout', logoutHandler);
      try {
        p.unsubscribe('presence-users');
        p.unsubscribe(`private-user-${username}`);
        p.disconnect();
      } catch {}
    };
  }, [username]);

  return { banned, clearBan: () => setBanned(null) };
}
