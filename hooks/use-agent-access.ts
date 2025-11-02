import { useQuery } from '@tanstack/react-query';
import { useLocalSession } from './use-local-session';

export function useAgentAccess(userId?: string) {
  const { data: session } = useLocalSession();
  const targetUserId = userId || session?.user?.id;
  const isAdminContext = !!userId;

  return useQuery({
    queryKey: ['agent-access', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return { access: [], globalHidden: [], isAdmin: false };
      
      const endpoint = isAdminContext
        ? `/api/admin/users/${targetUserId}/agents`
        : `/api/user/agent-access`;
      
      const res = await fetch(endpoint, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) {
        if (res.status === 401) return { access: [], globalHidden: [], isAdmin: false };
        throw new Error('Failed to fetch agent access');
      }
      const data = await res.json();
      
      // Si c'est l'endpoint admin users, on récupère aussi les agents masqués globalement
      if (isAdminContext) {
        const globalRes = await fetch('/api/admin/agents', {
          credentials: 'include',
          cache: 'no-store',
        });
        const globalData = globalRes.ok ? await globalRes.json() : { hiddenAgents: [] };
        return {
          access: data,
          globalHidden: globalData.hiddenAgents || [],
          isAdmin: false, // On ne sait pas si cet utilisateur est admin
        };
      }
      
      // Endpoint user retourne déjà tout
      return {
        access: data.access || [],
        globalHidden: data.globalHidden || [],
        isAdmin: data.isAdmin || false,
      };
    },
    enabled: !!targetUserId,
    staleTime: 5000,
    gcTime: 1000 * 60 * 10,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 10000,
  });
}
