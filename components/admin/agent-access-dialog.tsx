'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AVAILABLE_AGENTS } from '@/lib/constants';
import { useMemo } from 'react';

interface AgentAccessDialogProps {
  userId: string;
  open: boolean;
  onClose: () => void;
}

export function AgentAccessDialog({ userId, open, onClose }: AgentAccessDialogProps) {
  const queryClient = useQueryClient();
  const { data: access, refetch } = useQuery({
    queryKey: ['agent-access', userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}/agents`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to fetch agents');
      return res.json();
    },
    enabled: open,
    staleTime: 0,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const allAgentsWithAccess = useMemo(() => {
    if (!access) return AVAILABLE_AGENTS.map(agentId => ({ agentId, enabled: true }));
    
    // Create a map of existing access records
    const accessMap = new Map(access.map((a: any) => [a.agentId, a.enabled]));
    
    // Return all agents with their access status
    return AVAILABLE_AGENTS.map(agentId => ({
      agentId,
      enabled: accessMap.get(agentId) ?? true // Default to enabled if no record exists
    }));
  }, [access]);

  const handleToggle = async (agentId: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/agents`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({ agents: { [agentId]: enabled } }),
      });
      if (!res.ok) throw new Error('Failed to update agent access');
      toast.success('Accès agent mis à jour');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['agent-access', userId] });
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gestion Accès Agents</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2 max-h-[500px] overflow-y-auto">
          {allAgentsWithAccess?.map((a: any) => (
            <div key={a.agentId} className="flex items-center space-x-2 p-2 border rounded hover:bg-accent transition-colors">
              <Checkbox
                checked={a.enabled}
                onCheckedChange={(checked) => handleToggle(a.agentId, !!checked)}
              />
              <Label className="cursor-pointer capitalize">{a.agentId}</Label>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
