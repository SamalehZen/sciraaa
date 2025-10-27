'use client';

import { useEffect } from 'react';
import { useAgentAccess } from '@/hooks/use-agent-access';
import { useLocalSession } from '@/hooks/use-local-session';
import { toast } from 'sonner';

interface AgentDisablerGuardProps {
  selectedModel?: string;
  onStopChat?: () => void;
  children?: React.ReactNode;
}

/**
 * Guard component that monitors if the selected agent becomes disabled
 * and automatically stops the chat if needed
 */
export function AgentDisablerGuard({
  selectedModel,
  onStopChat,
  children,
}: AgentDisablerGuardProps) {
  const { data: session } = useLocalSession();
  const { data: agentAccess } = useAgentAccess();

  useEffect(() => {
    if (!selectedModel || !agentAccess || agentAccess.length === 0) {
      return;
    }

    // Check if currently selected agent is disabled
    const agentAccess_item = agentAccess.find((a: any) => a.agentId === selectedModel);
    
    if (agentAccess_item && !agentAccess_item.enabled) {
      console.warn(`[AGENT-GUARD] Agent "${selectedModel}" is disabled!`);
      
      // Stop any active chat
      if (onStopChat) {
        console.log('[AGENT-GUARD] Stopping active chat...');
        onStopChat();
      }

      // Show notification
      toast.error(`Agent ${selectedModel} n'est plus disponible. Veuillez en sélectionner un autre.`, {
        duration: 5000,
      });

      // Clear saved model
      localStorage.removeItem('scira-selected-model');
      localStorage.removeItem('scira-selected-agent');
      localStorage.removeItem('scira-selected-group');

      // Dispatch event for UI to update
      window.dispatchEvent(
        new CustomEvent('agent-became-unavailable', {
          detail: { agentId: selectedModel },
        })
      );
    }
  }, [selectedModel, agentAccess, onStopChat]);

  // Listen for real-time disabling events
  useEffect(() => {
    const handleAgentDisabled = (event: Event) => {
      const customEvent = event as CustomEvent;
      const disabledAgentId = customEvent.detail?.agentId;

      if (selectedModel === disabledAgentId) {
        console.warn('[AGENT-GUARD] Current agent was disabled in real-time!');
        
        if (onStopChat) {
          onStopChat();
        }

        toast.error('Agent désactivé. Conversation terminée.', { duration: 4000 });
        
        localStorage.removeItem('scira-selected-model');
        localStorage.removeItem('scira-selected-group');
      }
    };

    const handleMultipleAgentsDisabled = (event: Event) => {
      const customEvent = event as CustomEvent;
      const disabledAgentIds = customEvent.detail?.agentIds || [];

      if (selectedModel && disabledAgentIds.includes(selectedModel)) {
        console.warn('[AGENT-GUARD] Current agent is among disabled agents!');
        
        if (onStopChat) {
          onStopChat();
        }

        toast.error('Un ou plusieurs agents ont été désactivés.', { duration: 4000 });
        
        localStorage.removeItem('scira-selected-model');
        localStorage.removeItem('scira-selected-group');
      }
    };

    window.addEventListener('agent-disabled', handleAgentDisabled);
    window.addEventListener('agents-disabled', handleMultipleAgentsDisabled);

    return () => {
      window.removeEventListener('agent-disabled', handleAgentDisabled);
      window.removeEventListener('agents-disabled', handleMultipleAgentsDisabled);
    };
  }, [selectedModel, onStopChat]);

  return <>{children}</>;
}
