import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocalSession } from './use-local-session';

export function useAgentMask(userId?: string) {
  const { data: session } = useLocalSession();
  const targetUserId = userId || session?.user?.id;

  return useQuery({
    queryKey: ['agent-mask', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      
      const res = await fetch(`/api/user/agent-mask`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) {
        if (res.status === 401) return [];
        throw new Error('Failed to fetch agent masks');
      }
      return res.json();
    },
    enabled: !!targetUserId,
    staleTime: 5000,
    gcTime: 1000 * 60 * 10,
  });
}

export function useToggleAgentMask() {
  return useMutation({
    mutationFn: async ({
      agentId,
      masked,
    }: {
      agentId: string;
      masked: boolean;
    }) => {
      const res = await fetch(`/api/user/agent-mask`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, masked }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to update agent mask');
      return res.json();
    },
  });
}
