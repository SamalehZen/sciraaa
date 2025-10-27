import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { pusherClient } from '@/lib/pusher-client';
import { encodeChannelUserId } from '@/lib/pusher-utils';
import { toast } from 'sonner';

interface AgentDisabledEvent {
  userId: string;
  agents: Record<string, boolean>;
  timestamp: string;
}

interface UseAgentAccessRealtimeProps {
  userId?: string;
  currentAgent?: string;
  onAgentDisabled?: (agentId: string) => void;
  onMultipleAgentsDisabled?: (agentIds: string[]) => void;
}

/**
 * Hook for real-time agent access management
 * Handles WebSocket events and polling fallback
 */
export function useAgentAccessRealtime({
  userId,
  currentAgent,
  onAgentDisabled,
  onMultipleAgentsDisabled,
}: UseAgentAccessRealtimeProps) {
  const queryClient = useQueryClient();
  const pollingIntervalRef = useRef<NodeJS.Timeout>();
  const channelRef = useRef<any>(null);
  const lastUpdateRef = useRef<Record<string, boolean>>({});

  // Process agent disabling
  const handleAgentDisabling = useCallback(
    (disabledAgents: Record<string, boolean>) => {
      const disabledAgentIds = Object.entries(disabledAgents)
        .filter(([_, enabled]) => !enabled)
        .map(([agentId]) => agentId);

      if (disabledAgentIds.length === 0) return;

      console.log('[REALTIME] Agents disabled:', disabledAgentIds);

      // Check if current agent was disabled
      if (currentAgent && disabledAgentIds.includes(currentAgent)) {
        console.warn(`[REALTIME] Current agent "${currentAgent}" was disabled!`);
        
        // Notify user
        toast.error(
          `Agent ${currentAgent} n'est plus disponible. Conversation terminée.`,
          {
            duration: 5000,
          }
        );

        // Trigger callback for active agent
        if (onAgentDisabled) {
          onAgentDisabled(currentAgent);
        }
      }

      // Handle multiple agents disabled
      if (disabledAgentIds.length > 1 && onMultipleAgentsDisabled) {
        onMultipleAgentsDisabled(disabledAgentIds);
      }

      // Store last update
      lastUpdateRef.current = { ...lastUpdateRef.current, ...disabledAgents };
    },
    [currentAgent, onAgentDisabled, onMultipleAgentsDisabled]
  );

  // WebSocket subscription setup
  const setupWebSocketListener = useCallback(() => {
    if (!userId || !pusherClient) {
      console.warn('[REALTIME] Pusher unavailable, will use polling fallback');
      return false;
    }

    try {
      const channelName = `private-user-${encodeChannelUserId(userId)}`;
      console.log(`[REALTIME] Setting up WebSocket listener on: ${channelName}`);

      const channel = pusherClient.subscribe(channelName);
      channelRef.current = channel;

      // Handle real-time updates
      const handleRealtimeUpdate = (data: AgentDisabledEvent) => {
        console.log('[REALTIME] Received agent update via WebSocket:', data);
        
        // Process changes
        handleAgentDisabling(data.agents);

        // Invalidate and refetch
        queryClient.invalidateQueries({ queryKey: ['agent-access', userId] });
        queryClient.refetchQueries({ queryKey: ['agent-access', userId] }).then(() => {
          console.log('[REALTIME] Agent access data refreshed from WebSocket');
        });
      };

      channel.bind('agent-access-updated', handleRealtimeUpdate);
      console.log('[REALTIME] WebSocket listener bound successfully');

      return true;
    } catch (error) {
      console.error('[REALTIME] WebSocket setup error:', error);
      return false;
    }
  }, [userId, queryClient, handleAgentDisabling]);

  // Polling fallback setup
  const setupPollingFallback = useCallback(() => {
    if (!userId) return;

    console.log('[REALTIME] Setting up polling fallback (every 5 seconds)');

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch('/api/user/agent-access', {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          console.error('[REALTIME] Polling failed with status:', response.status);
          return;
        }

        const json = await response.json();
        const currentAccess: any[] = json.data || json;
        
        // Compare with last known state
        const currentState = Object.fromEntries(
          currentAccess.map((a) => [a.agentId, a.enabled])
        );

        // Detect changes
        const changes: Record<string, boolean> = {};
        let hasChanges = false;

        for (const [agentId, enabled] of Object.entries(currentState)) {
          if (lastUpdateRef.current[agentId] !== enabled) {
            changes[agentId] = enabled;
            hasChanges = true;
          }
        }

        if (hasChanges) {
          console.log('[REALTIME] Detected changes via polling:', changes);
          handleAgentDisabling(changes);
          
          // Invalidate cache
          queryClient.invalidateQueries({ queryKey: ['agent-access', userId] });
          queryClient
            .refetchQueries({ queryKey: ['agent-access', userId] })
            .then(() => {
              console.log('[REALTIME] Agent access data refreshed from polling');
            })
            .catch((err) => {
              console.error('[REALTIME] Failed to refetch after polling change:', err);
            });
        }

        // Update last known state regardless of changes to keep comparisons accurate
        lastUpdateRef.current = currentState;
      } catch (error) {
        console.error('[REALTIME] Polling error:', error);
      }
    }, 5000); // Poll every 5 seconds
  }, [userId, queryClient, handleAgentDisabling]);

  // Main effect
  useEffect(() => {
    if (!userId) return;

    // Try WebSocket first
    const wsSuccess = setupWebSocketListener();

    // Always setup polling as fallback
    setupPollingFallback();

    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (channelRef.current && pusherClient) {
        try {
          pusherClient.unsubscribe(`private-user-${encodeChannelUserId(userId)}`);
        } catch (error) {
          console.error('[REALTIME] Error unsubscribing:', error);
        }
      }
    };
  }, [userId, setupWebSocketListener, setupPollingFallback]);

  return {
    lastUpdate: lastUpdateRef.current,
  };
}
