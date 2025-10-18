'use client';

import { useEffect } from 'react';
import { pusherClientUser } from '@/lib/realtime/pusher-client-user';
import { useLocalSession } from '@/hooks/use-local-session';

export function UserPresenceConnector() {
  const { data: session, isLoading } = useLocalSession();
  useEffect(() => {
    if (isLoading) return;
    if (!session) return;
    let channel: any;
    try {
      channel = pusherClientUser.subscribe('presence-online-users');
    } catch {}
    return () => {
      try {
        if (channel) pusherClientUser.unsubscribe('presence-online-users');
      } catch {}
    };
  }, [isLoading, session]);
  return null;
}