'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AVAILABLE_AGENTS } from '@/lib/constants';
import { useMemo, useEffect } from 'react';

interface AgentAccessDialogProps {
  userId: string;
  open: boolean;
  onClose: () => void;
}

export function AgentAccessDialog({ userId, open, onClose }: AgentAccessDialogProps) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    console.log('[AGENT-DIALOG] Dialog opened with userId:', userId, 'open:', open);
  }, [open, userId]);
  
  const { data: access, refetch, isLoading, error } = useQuery({
    queryKey: ['agent-access', userId],
    queryFn: async () => {
      console.log('[AGENT-DIALOG] Fetching agents for user:', userId);
      const encodedUserId = encodeURIComponent(userId);
      const url = `/api/admin/users/${encodedUserId}/agents`;
      console.log('[AGENT-DIALOG] Fetch URL:', url);
      
      try {
        const res = await fetch(url, {
          credentials: 'include',
          cache: 'no-store',
        });
        console.log('[AGENT-DIALOG] Response status:', res.status, res.statusText);
        
        if (!res.ok) {
          const errorText = await res.text().catch(() => 'No error details');
          console.error('[AGENT-DIALOG] API error response:', errorText);
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const json = await res.json();
        console.log('[AGENT-DIALOG] API response:', json);
        
        // Handle both new format { success, data } and direct array
        const accessData = json.data || json;
        console.log('[AGENT-DIALOG] Extracted access data:', accessData);
        return accessData;
      } catch (err) {
        console.error('[AGENT-DIALOG] Fetch error:', err);
        throw err;
      }
    },
    enabled: open,
    staleTime: 0,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
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
          <DialogTitle>Gestion Accès Agents - Utilisateur: {userId}</DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-sm">
            <div className="font-semibold text-red-700 dark:text-red-400 mb-1">Erreur lors du chargement</div>
            <div className="text-red-600 dark:text-red-300 font-mono text-xs break-words">
              {error instanceof Error ? error.message : String(error)}
            </div>
          </div>
        )}
        
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <div className="text-sm text-muted-foreground">Chargement des agents...</div>
            </div>
          </div>
        )}
        
        {!isLoading && !error && (
          <>
            {(!allAgentsWithAccess || allAgentsWithAccess.length === 0) ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun agent disponible
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-[500px] overflow-y-auto p-2 border rounded bg-muted/30">
                {allAgentsWithAccess?.map((a: any) => (
                  <div key={a.agentId} className="flex items-center space-x-2 p-2 border rounded hover:bg-accent transition-colors bg-background">
                    <Checkbox
                      checked={a.enabled}
                      onCheckedChange={(checked) => handleToggle(a.agentId, !!checked)}
                      disabled={isLoading}
                      id={`agent-${a.agentId}`}
                    />
                    <Label htmlFor={`agent-${a.agentId}`} className="cursor-pointer capitalize flex-1">
                      {a.agentId}
                    </Label>
                    {a.enabled ? (
                      <span className="text-xs text-green-600 dark:text-green-400">✓</span>
                    ) : (
                      <span className="text-xs text-gray-400">✗</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
