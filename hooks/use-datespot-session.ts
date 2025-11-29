import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DateSession } from '@/lib/db/schema';
import { useEffect, useState } from 'react';
import { pusherClient } from '@/lib/pusher-client';

export function useDateSpotSession(coupleId?: string) {
  const queryClient = useQueryClient();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  // Get active session
  const { data: session, isLoading } = useQuery<DateSession | null>({
    queryKey: ['dateSession', coupleId],
    queryFn: async () => {
      if (!coupleId) return null;
      const res = await fetch(`/api/datespot/session?coupleId=${coupleId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!coupleId,
    refetchInterval: 5000, // Polling fallback if pusher fails or for initial sync
  });

  useEffect(() => {
      if (session?.id) setActiveSessionId(session.id);
  }, [session]);

  // Subscribe to Session events
  useEffect(() => {
    if (!activeSessionId || !pusherClient) return;

    const channel = pusherClient.subscribe(`private-session-${activeSessionId}`);
    
    channel.bind('match', (data: any) => {
        queryClient.invalidateQueries({ queryKey: ['dateSession', coupleId] });
        // Could facilitate a toast or global state update here
    });

    return () => {
        pusherClient.unsubscribe(`private-session-${activeSessionId}`);
    }
  }, [activeSessionId, coupleId, queryClient]);

  const startSession = useMutation({
      mutationFn: async (params: { location: any, placeType: string, radius: number }) => {
          if (!coupleId) throw new Error('No couple ID');
          const res = await fetch('/api/datespot/session', {
              method: 'POST',
              body: JSON.stringify({ ...params, coupleId })
          });
          if (!res.ok) throw new Error('Failed to start session');
          return res.json();
      },
      onSuccess: (data) => {
          setActiveSessionId(data.id);
          queryClient.invalidateQueries({ queryKey: ['dateSession', coupleId] });
      }
  });

  const swipe = useMutation({
      mutationFn: async (params: { placeId: string, liked: boolean, placeData: any }) => {
          if (!activeSessionId) throw new Error('No active session');
          const res = await fetch('/api/datespot/swipe', {
              method: 'POST',
              body: JSON.stringify({ ...params, sessionId: activeSessionId })
          });
          return res.json();
      }
  });

  return { session, isLoading, startSession, swipe };
}
