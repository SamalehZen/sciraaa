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
  const { data: access, refetch, isLoading, error } = useQuery({
    queryKey: ['agent-access', userId],
    queryFn: async () => {
      console.log('[AGENT-DIALOG] Fetching agents for user:', userId);
      const encodedUserId = encodeURIComponent(userId);
      const res = await fetch(`/api/admin/users/${encodedUserId}/agents`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) {
        console.error('[AGENT-DIALOG] API error:', res.status);
        throw new Error('Failed to fetch agents');
      }
      const json = await res.json();
      console.log('[AGENT-DIALOG] API response:', json);
      
      // Handle both new format { success, data } and direct array
      return json.data || json;
    },
    enabled: open,
    staleTime: 0,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const allAgentsWithAccess = useMemo(() => {
    console.log('[AGENT-DIALOG] Building agents list, access:', access);
    
    if (!access || !Array.isArray(access)) {
      console.warn('[AGENT-DIALOG] Access is not an array, using defaults');
      return AVAILABLE_AGENTS.map(agentId => ({ agentId, enabled: true }));
    }
    
    // Create a map of existing access records
    const accessMap = new Map(access.map((a: any) => [a.agentId, a.enabled]));
    
    // Return all agents with their access status
    return AVAILABLE_AGENTS.map(agentId => ({
      agentId,
      enabled: accessMap.get(agentId) ?? true
    }));
  }, [access]);

  const handleToggle = async (agentId: string, enabled: boolean) => {
    try {
      console.log('[AGENT-DIALOG] Updating agent:', agentId, '-> enabled:', enabled, 'for userId:', userId);
      
      const payload = { agents: { [agentId]: enabled } };
      console.log('[AGENT-DIALOG] Request payload:', payload);
      
      const encodedUserId = encodeURIComponent(userId);
      const res = await fetch(`/api/admin/users/${encodedUserId}/agents`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify(payload),
      });
      
      console.log('[AGENT-DIALOG] Response status:', res.status);
      
      if (!res.ok) {
        let errorMessage = 'Unknown error';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorData.message || 'Unknown error';
          console.error('[AGENT-DIALOG] Error response:', errorData);
        } catch (e) {
          const errorText = await res.text();
          errorMessage = errorText || `HTTP ${res.status}`;
          console.error('[AGENT-DIALOG] Error text:', errorText);
        }
        throw new Error(`HTTP ${res.status}: ${errorMessage}`);
      }
      
      const result = await res.json();
      console.log('[AGENT-DIALOG] Update successful:', result);
      
      toast.success(result.message || 'Accès agent mis à jour');
      
      // Wait for refetch to complete
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['agent-access', userId] });
    } catch (error) {
      console.error('[AGENT-DIALOG] Detailed error:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      toast.error(`Erreur: ${errorMsg}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gestion Accès Agents</DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
            Erreur: {error instanceof Error ? error.message : 'Erreur inconnu'}
          </div>
        )}
        
        {isLoading && (
          <div className="text-center py-4">Chargement des agents...</div>
        )}
        
        {!isLoading && (
          <div className="grid grid-cols-3 gap-2 max-h-[500px] overflow-y-auto">
            {allAgentsWithAccess?.map((a: any) => (
              <div key={a.agentId} className="flex items-center space-x-2 p-2 border rounded hover:bg-accent transition-colors">
                <Checkbox
                  checked={a.enabled}
                  onCheckedChange={(checked) => handleToggle(a.agentId, !!checked)}
                  disabled={isLoading}
                />
                <Label className="cursor-pointer capitalize">{a.agentId}</Label>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
