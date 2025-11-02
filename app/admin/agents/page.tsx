'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { HugeiconsIcon } from '@hugeicons/react';
import { getBaseSearchGroups } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

export default function AgentsManagementPage() {
  const queryClient = useQueryClient();

  // Récupérer les agents masqués globalement
  const { data, isLoading, error } = useQuery({
    queryKey: ['global-agents'],
    queryFn: async () => {
      const res = await fetch('/api/admin/agents', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to fetch agents');
      return res.json();
    },
    refetchInterval: 10000,
  });

  const hiddenAgents = data?.hiddenAgents || [];
  const allAgents = getBaseSearchGroups('parallel');

  // Mutation pour mettre à jour les agents
  const updateMutation = useMutation({
    mutationFn: async (newHiddenAgents: string[]) => {
      const res = await fetch('/api/admin/agents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ hiddenAgents: newHiddenAgents }),
      });
      if (!res.ok) throw new Error('Failed to update agents');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Configuration des agents mise à jour');
      queryClient.invalidateQueries({ queryKey: ['global-agents'] });
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });

  const handleToggle = (agentId: string) => {
    const newHidden = hiddenAgents.includes(agentId)
      ? hiddenAgents.filter((id: string) => id !== agentId)
      : [...hiddenAgents, agentId];
    updateMutation.mutate(newHidden);
  };

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>Erreur lors du chargement des agents</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion des Agents</h1>
        <p className="text-muted-foreground mt-2">
          Contrôlez les agents disponibles pour tous les utilisateurs. Les agents masqués ne seront visibles que par les administrateurs.
        </p>
      </div>

      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          Les agents masqués ici seront invisibles pour tous les utilisateurs (sauf les admins). Les utilisateurs peuvent ensuite masquer individuellement les agents visibles.
        </AlertDescription>
      </Alert>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allAgents
            .filter((agent) => agent.show && agent.id !== 'extreme')
            .map((agent) => {
              const isHidden = hiddenAgents.includes(agent.id);
              return (
                <Card key={agent.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center rounded-md bg-muted/50 p-2">
                      <HugeiconsIcon icon={agent.icon} size={24} strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm truncate">{agent.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {agent.description}
                          </p>
                        </div>
                        <Switch
                          checked={!isHidden}
                          onCheckedChange={() => handleToggle(agent.id)}
                          disabled={updateMutation.isPending}
                        />
                      </div>
                      <div className="mt-2">
                        {isHidden ? (
                          <Badge variant="secondary" className="text-xs">
                            Masqué globalement
                          </Badge>
                        ) : (
                          <Badge variant="default" className="text-xs">
                            Visible
                          </Badge>
                        )}
                        {'requirePro' in agent && agent.requirePro && (
                          <Badge variant="outline" className="text-xs ml-2">
                            Pro
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}
