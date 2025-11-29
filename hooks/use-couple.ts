import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Couple } from '@/lib/db/schema';

export function useCouple() {
  const queryClient = useQueryClient();

  const { data: couple, isLoading, error } = useQuery<Couple | null>({
    queryKey: ['couple'],
    queryFn: async () => {
      const res = await fetch('/api/datespot/couple');
      if (res.status === 401) throw new Error('Unauthorized');
      const data = await res.json();
      // API returns { couple: null } logic is inconsistent in my impl vs usage here.
      // My GET route returns direct object or null.
      return data;
    },
    retry: false,
  });

  const createCouple = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/datespot/couple', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to create couple');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['couple'] });
    },
  });

  const joinCouple = useMutation({
    mutationFn: async (code: string) => {
      const res = await fetch('/api/datespot/couple/join', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to join');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['couple'] });
    },
  });

  return { couple, isLoading, createCouple, joinCouple, error };
}
