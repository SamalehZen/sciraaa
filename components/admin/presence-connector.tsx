'use client';

import { useEffect } from 'react';
import { pusherClient } from '@/lib/realtime/pusher-client';

export function PresenceConnector() {
  useEffect(() => {
    let channel: any;
    try {
      channel = pusherClient.subscribe('presence-online-users');
    } catch {}
    return () => {
      try {
        if (channel) pusherClient.unsubscribe('presence-online-users');
      } catch {}
    };
  }, []);
  return null;
}