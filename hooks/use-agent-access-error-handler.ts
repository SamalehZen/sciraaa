'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';

export function useAgentAccessErrorHandler() {
  const handleFetchError = useCallback((error: unknown, context: string) => {
    console.error(`[AGENT-ERROR] ${context}:`, error);

    if (error instanceof Response) {
      if (error.status === 401) {
        toast.error('Votre session a expiré. Veuillez vous reconnecter.');
        // Optionally redirect to login
        window.location.href = '/sign-in';
      } else if (error.status === 403) {
        toast.error('Vous n\'avez pas les permissions pour cette action.');
      } else if (error.status === 404) {
        toast.error('Utilisateur ou ressource non trouvé.');
      } else if (error.status >= 500) {
        toast.error('Erreur serveur. Veuillez réessayer plus tard.');
      } else {
        toast.error(`Erreur HTTP ${error.status}`);
      }
    } else if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        toast.error('Impossible de communiquer avec le serveur.');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.error('Une erreur inconnue s\'est produite.');
    }
  }, []);

  return { handleFetchError };
}
