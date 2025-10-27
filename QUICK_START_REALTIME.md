# Guide Rapide d'Intégration - Agents en Temps Réel

## 🚀 Intégration en 5 Minutes

### Étape 1: Wrapper du Layout
Dans votre fichier layout principal (ex: `app/layout.tsx`):

```typescript
import { AgentStatusMonitor } from '@/components/agent-status-monitor';
import { AgentDisablerGuard } from '@/components/agent-disabler-guard';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AgentStatusMonitor>
          <AgentDisablerGuard>
            {children}
          </AgentDisablerGuard>
        </AgentStatusMonitor>
      </body>
    </html>
  );
}
```

### Étape 2: Passer les Props au Guard
Dans votre composant Chat principal:

```typescript
<AgentDisablerGuard 
  selectedModel={selectedModel}
  onStopChat={() => {
    stop();  // Votre fonction d'arrêt du chat
  }}
>
  <YourChatComponent 
    selectedModel={selectedModel}
    // ... autres props
  />
</AgentDisablerGuard>
```

### Étape 3: C'est Fini! ✅

Le système fonctionne maintenant automatiquement. Voici ce qui se passe:

1. ✅ Monitore les changements en temps réel
2. ✅ Arrête le chat si l'agent devient indisponible
3. ✅ Affiche des notifications
4. ✅ Fallback au polling si Pusher échoue

## 📝 Exemple Complet

```typescript
// app/layout.tsx
import { AgentStatusMonitor } from '@/components/agent-status-monitor';
import { AgentDisablerGuard } from '@/components/agent-disabler-guard';

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <AgentStatusMonitor>
          <AgentDisablerGuard>
            <main>
              {children}
            </main>
          </AgentDisablerGuard>
        </AgentStatusMonitor>
      </body>
    </html>
  );
}

// app/(search)/page.tsx ou votre page du chat
'use client';

import { ChatInterface } from '@/components/chat-interface';
import { AgentDisablerGuard } from '@/components/agent-disabler-guard';
import { useState } from 'react';
import { useChat } from '@ai-sdk/react';

export default function SearchPage() {
  const [selectedModel, setSelectedModel] = useState('scira-default');
  const { stop } = useChat(); // Ou votre hook de chat

  return (
    <AgentDisablerGuard 
      selectedModel={selectedModel}
      onStopChat={() => stop()}
    >
      <ChatInterface 
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
      />
    </AgentDisablerGuard>
  );
}
```

## 🎯 Ce Qui Se Passe Automatiquement

### Quand l'Admin Désactive un Agent:

```
1. Admin clique: Désactiver "agent-web"
   ↓
2. API PATCH reçoit la demande
   ↓
3. Base de données mise à jour
   ↓
4. Événement Pusher envoyé
   ↓
5. Frontend reçoit l'événement (100-200ms)
   ↓
6. Agent disparaît du sélecteur
   ↓
7. Si c'est l'agent actuel: Chat s'arrête + notification
   ↓
8. Utilisateur voit tout en ~200ms ✅
```

## 🛠️ Configuration Optionnelle

### Personnaliser les Callbacks:

```typescript
import { useAgentAccessRealtime } from '@/hooks/use-agent-access-realtime';
import { useLocalSession } from '@/hooks/use-local-session';

export function MyComponent() {
  const { data: session } = useLocalSession();

  useAgentAccessRealtime({
    userId: session?.user?.id,
    currentAgent: 'mon-agent',
    onAgentDisabled: (agentId) => {
      console.log(`Agent ${agentId} désactivé!`);
      // Faire quelque chose de custom
    },
    onMultipleAgentsDisabled: (agentIds) => {
      console.log(`${agentIds.length} agents désactivés`);
      // Faire quelque chose d'autre
    }
  });

  return null;
}
```

### Écouter les Événements Personnalisés:

```typescript
useEffect(() => {
  // Quand un agent est désactivé
  window.addEventListener('agent-disabled', (e) => {
    console.log('Agent désactivé:', e.detail.agentId);
  });

  // Quand plusieurs agents sont désactivés
  window.addEventListener('agents-disabled', (e) => {
    console.log('Agents désactivés:', e.detail.agentIds);
  });

  return () => {
    window.removeEventListener('agent-disabled', ...);
    window.removeEventListener('agents-disabled', ...);
  };
}, []);
```

## 🧪 Tester la Fonctionnalité

### Scénario 1: Test Simple
1. Ouvrir deux onglets: Admin et Utilisateur
2. Connecter les deux
3. Admin: Désactiver un agent
4. Utilisateur: Voir l'agent disparaître

### Scénario 2: Test Actif
1. Utilisateur: Sélectionner un agent et commencer une conversation
2. Admin: Désactiver cet agent
3. Utilisateur: Voir la conversation s'arrêter + notification

### Scénario 3: Fallback
1. DevTools Network: Bloquer les WebSockets
2. Admin: Désactiver un agent
3. Utilisateur: Voir le changement dans ~5 secondes

## 📊 Vérifier que Tout Fonctionne

Ouvrir DevTools (F12) Console et chercher:

```
[REALTIME] Subscribing to channel: private-user-xxx
[REALTIME] Bound to agent-access-updated event
```

Lors d'un changement d'agent:

```
[REALTIME] Received agent update via WebSocket
[REALTIME] Agents disabled: ['web']
```

## ❌ Problèmes Courants

### Composants ne se chargent pas?
```
Vérifiez:
1. Chemin d'import correct
2. 'use client' directive présent si nécessaire
3. React Query provider configuré
```

### Pusher channel error?
```
Vérifiez:
1. NEXT_PUBLIC_PUSHER_KEY défini
2. NEXT_PUBLIC_PUSHER_CLUSTER défini
3. Endpoint /api/pusher/auth fonctionnelle
```

### Chat ne s'arrête pas?
```
Vérifiez:
1. onStopChat prop passed
2. Fonction stop est disponible
3. AgentDisablerGuard wraps le chat
```

## 📚 Lectures Complémentaires

- `README_REALTIME_AGENTS.md` - Vue d'ensemble complète
- `AGENT_REALTIME_INTEGRATION.md` - Documentation technique détaillée
- Code source avec commentaires: `[REALTIME]` prefix

## ✨ Résumé

| Aspect | Status |
|--------|--------|
| Installation | ✅ Plug & Play |
| Configuration | ✅ Automatique |
| WebSocket | ✅ Pusher |
| Fallback | ✅ Polling 5s |
| Notifications | ✅ Toast |
| Chat Stop | ✅ Automatique |
| Logging | ✅ Console |
| Production | ✅ Prêt |

## 🚀 C'est Prêt!

Il n'y a plus rien à faire. Juste wrappe tes composants et c'est bon! Le système gère tout le reste automatiquement.

Besoin d'aide? Tous les fichiers ont des commentaires détaillés en français.
