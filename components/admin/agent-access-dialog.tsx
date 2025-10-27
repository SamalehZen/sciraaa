'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AVAILABLE_AGENTS } from '@/lib/constants';
import { useMemo, useEffect, useState } from 'react';
import { Power, PowerOff, Zap } from 'lucide-react';

interface AgentAccessDialogProps {
  userId: string;
  open: boolean;
  onClose: () => void;
}

export function AgentAccessDialog({ userId, open, onClose }: AgentAccessDialogProps) {
  const queryClient = useQueryClient();
  const [loadingAgents, setLoadingAgents] = useState<Set<string>>(new Set());
  const [disableAllLoading, setDisableAllLoading] = useState(false);
  
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
    try {
      console.log('[AGENT-DIALOG] Building agents list, access:', access);
      
      if (!access || !Array.isArray(access)) {
        console.warn('[AGENT-DIALOG] Access is not an array, using defaults');
        return AVAILABLE_AGENTS.map(agentId => ({ agentId, enabled: true }));
      }
      
      const accessMap = new Map();
      for (const item of access) {
        if (item && typeof item === 'object' && 'agentId' in item && 'enabled' in item) {
          accessMap.set(item.agentId, item.enabled);
        }
      }
      
      return AVAILABLE_AGENTS.map(agentId => ({
        agentId,
        enabled: accessMap.get(agentId) ?? true
      }));
    } catch (err) {
      console.error('[AGENT-DIALOG] Error building agents list:', err);
      return AVAILABLE_AGENTS.map(agentId => ({ agentId, enabled: true }));
    }
  }, [access]);

  const handleToggle = async (agentId: string, enabled: boolean) => {
    try {
      setLoadingAgents(prev => new Set(prev).add(agentId));
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
      
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['agent-access', userId] });
    } catch (error) {
      console.error('[AGENT-DIALOG] Detailed error:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      toast.error(`Erreur: ${errorMsg}`);
    } finally {
      setLoadingAgents(prev => {
        const next = new Set(prev);
        next.delete(agentId);
        return next;
      });
    }
  };

  const handleDisableAll = async () => {
    try {
      setDisableAllLoading(true);
      console.log('[AGENT-DIALOG] Disabling all agents for user:', userId);
      
      const agents: Record<string, boolean> = {};
      AVAILABLE_AGENTS.forEach(agentId => {
        agents[agentId] = false;
      });
      
      const payload = { agents };
      console.log('[AGENT-DIALOG] Disable all payload:', payload);
      
      const encodedUserId = encodeURIComponent(userId);
      const res = await fetch(`/api/admin/users/${encodedUserId}/agents`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        let errorMessage = 'Unknown error';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorData.message || 'Unknown error';
        } catch (e) {
          const errorText = await res.text();
          errorMessage = errorText || `HTTP ${res.status}`;
        }
        throw new Error(`HTTP ${res.status}: ${errorMessage}`);
      }
      
      const result = await res.json();
      console.log('[AGENT-DIALOG] Disable all successful:', result);
      
      toast.success('Tous les agents ont été désactivés');
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['agent-access', userId] });
    } catch (error) {
      console.error('[AGENT-DIALOG] Disable all error:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      toast.error(`Erreur: ${errorMsg}`);
    } finally {
      setDisableAllLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Gestion Accès Agents - {userId}</DialogTitle>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDisableAll}
              disabled={disableAllLoading || isLoading}
              className="gap-2"
            >
              <Zap className="size-4" />
              Désactiver tout
            </Button>
          </div>
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
              <div className="max-h-[500px] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-2">
                  {allAgentsWithAccess?.map((agent: any) => {
                    const isAgentLoading = loadingAgents.has(agent.agentId);
                    const isEnabled = agent.enabled;
                    
                    return (
                      <div
                        key={agent.agentId}
                        className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors bg-background"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium capitalize text-sm truncate">
                            {agent.agentId}
                          </div>
                          <div className={`text-xs ${isEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                            {isEnabled ? 'Activé' : 'Désactivé'}
                          </div>
                        </div>
                        
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant={isEnabled ? 'default' : 'outline'}
                            onClick={() => handleToggle(agent.agentId, true)}
                            disabled={isAgentLoading || isEnabled || disableAllLoading}
                            className="gap-1"
                            title="Activer cet agent"
                          >
                            <Power className="size-3" />
                            <span className="hidden sm:inline">On</span>
                          </Button>
                          
                          <Button
                            size="sm"
                            variant={!isEnabled ? 'destructive' : 'outline'}
                            onClick={() => handleToggle(agent.agentId, false)}
                            disabled={isAgentLoading || !isEnabled || disableAllLoading}
                            className="gap-1"
                            title="Désactiver cet agent"
                          >
                            <PowerOff className="size-3" />
                            <span className="hidden sm:inline">Off</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
