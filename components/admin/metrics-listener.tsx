'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { pusherClient } from '@/lib/realtime/pusher-client';

export function AdminMetricsListener() {
  const qc = useQueryClient();
  useEffect(() => {
    let channel: any;
    try {
      channel = pusherClient.subscribe('presence-online-users');
      channel.bind('metrics:update', () => {
        qc.invalidateQueries({ queryKey: ['admin-metrics'] });
        qc.invalidateQueries({ queryKey: ['admin-users'] });
      });
    } catch {}
    return () => {
      try {
        if (!channel) return;
        channel.unbind('metrics:update');
        pusherClient.unsubscribe('presence-online-users');
      } catch {}
    };
  }, [qc]);
  return null;
}