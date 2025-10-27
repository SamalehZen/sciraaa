'use client';

import { useEffect, useCallback } from 'react';
import { useAgentAccessRealtime } from '@/hooks/use-agent-access-realtime';
import { useLocalSession } from '@/hooks/use-local-session';

interface AgentStatusMonitorProps {
  currentAgent?: string;
  onAgentDisabled?: (agentId: string) => void;
  children?: React.ReactNode;
}

/**
 * Component that monitors agent status in real-time
 * Handles agent disabling and stops active conversations if needed
 */
export function AgentStatusMonitor({
  currentAgent,
  onAgentDisabled,
  children,
}: AgentStatusMonitorProps) {
  const { data: session } = useLocalSession();

  // Handle agent being disabled
  const handleAgentDisabledCallback = useCallback(
    (agentId: string) => {
      console.log(`[AGENT-STATUS] Agent ${agentId} disabled - stopping interaction`);

      // Clear selected agent from localStorage or state
      localStorage.removeItem('scira-selected-model');
      localStorage.removeItem('scira-selected-agent');
      localStorage.removeItem('scira-selected-group');

      // Trigger external callback if provided
      if (onAgentDisabled) {
        onAgentDisabled(agentId);
      }

      // Dispatch custom event for other components to listen
      window.dispatchEvent(
        new CustomEvent('agent-disabled', {
          detail: { agentId, timestamp: new Date().toISOString() },
        })
      );
    },
    [onAgentDisabled]
  );

  // Handle multiple agents disabled
  const handleMultipleAgentsDisabled = useCallback((agentIds: string[]) => {
    console.log('[AGENT-STATUS] Multiple agents disabled:', agentIds);
    
    // Clear saved preferences if they include disabled agents
    const savedAgent = localStorage.getItem('scira-selected-model');
    if (savedAgent && agentIds.includes(savedAgent)) {
      localStorage.removeItem('scira-selected-model');
      localStorage.removeItem('scira-selected-agent');
      localStorage.removeItem('scira-selected-group');
    }

    // Dispatch event
    window.dispatchEvent(
      new CustomEvent('agents-disabled', {
        detail: { agentIds, timestamp: new Date().toISOString() },
      })
    );
  }, []);

  // Setup real-time monitoring
  useAgentAccessRealtime({
    userId: session?.user?.id,
    currentAgent,
    onAgentDisabled: handleAgentDisabledCallback,
    onMultipleAgentsDisabled: handleMultipleAgentsDisabled,
  });

  return <>{children}</>;
}
