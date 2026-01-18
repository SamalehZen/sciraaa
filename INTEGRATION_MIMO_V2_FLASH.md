# 🚀 Guide d'Intégration de Xiaomi MiMo-V2-Flash

## Introduction

Ce guide détaille **étape par étape** comment intégrer le modèle LLM **MiMo-V2-Flash** de Xiaomi dans un projet Next.js utilisant le **Vercel AI SDK**. Cette intégration remplace Google Gemini 2.5 Flash par MiMo-V2-Flash en utilisant l'API compatible OpenAI.

**Avantages de MiMo-V2-Flash :**
- ⚡ 2.6x plus rapide en inférence
- 💰 97.5% moins cher
- 🔄 Compatibilité totale avec l'API OpenAI

---

## Prérequis

- Node.js 18+ ou Bun
- Projet Next.js existant avec le Vercel AI SDK (`ai` package)
- Clé API Xiaomi MiMo (obtenue sur https://api.xiaomimimo.com)

---

## ÉTAPE 1 : Installer la dépendance requise

Installez le package `@ai-sdk/openai-compatible` qui permet de connecter n'importe quelle API compatible OpenAI :

```bash
# Avec pnpm
pnpm add @ai-sdk/openai-compatible

# Avec npm
npm install @ai-sdk/openai-compatible

# Avec bun
bun add @ai-sdk/openai-compatible

# Avec yarn
yarn add @ai-sdk/openai-compatible
```

**Résultat dans `package.json` :**
```json
{
  "dependencies": {
    "@ai-sdk/openai-compatible": "1.0.22",
    "ai": "5.0.60"
  }
}
```

---

## ÉTAPE 2 : Configurer les variables d'environnement

### 2.1 Créer/Modifier le fichier `.env.local`

Ajoutez les variables suivantes :

```env
# Xiaomi MiMo (OpenAI-compatible)
XIAOMI_MIMO_API_KEY=votre_cle_api_mimo_ici

# Optionnel - URL de base personnalisée (défaut: https://api.xiaomimimo.com/v1)
XIAOMI_MIMO_BASE_URL=https://api.xiaomimimo.com/v1
```

### 2.2 Mettre à jour `.env.example`

Documentez les nouvelles variables pour les autres développeurs :

```env
# Xiaomi MiMo (OpenAI-compatible)
XIAOMI_MIMO_API_KEY=your_xiaomi_mimo_api_key_here
# Optional override (default: https://api.xiaomimimo.com/v1)
XIAOMI_MIMO_BASE_URL=https://api.xiaomimimo.com/v1
```

---

## ÉTAPE 3 : Configurer la validation des variables d'environnement

Si vous utilisez `@t3-oss/env-nextjs` pour la validation, mettez à jour `env/server.ts` :

```typescript
// env/server.ts
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const serverEnv = createEnv({
  server: {
    // ✅ NOUVELLES VARIABLES MIMO
    XIAOMI_MIMO_API_KEY: z.string().min(1),
    XIAOMI_MIMO_BASE_URL: z.string().optional().default('https://api.xiaomimimo.com/v1'),

    // Autres variables existantes...
    DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().min(1),
    
    // ⚠️ Anciennes clés API (marquées comme deprecated)
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional().default('deprecated'),
    OPENAI_API_KEY: z.string().optional().default('deprecated'),
    // ...
  },
  experimental__runtimeEnv: process.env,
});
```

---

## ÉTAPE 4 : Créer le provider MiMo dans `ai/providers.ts`

C'est le **fichier clé** de l'intégration. Voici le code complet :

```typescript
// ai/providers.ts
import { customProvider } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

// ============================================
// CONFIGURATION MIMO
// ============================================
const DEFAULT_MIMO_MODEL = 'mimo-v2-flash';
const MIMO_BASE_URL = process.env.XIAOMI_MIMO_BASE_URL || 'https://api.xiaomimimo.com/v1';
const DEFAULT_API_KEY = process.env.XIAOMI_MIMO_API_KEY || '';

// ============================================
// CRÉATION DU CLIENT MIMO (OpenAI-Compatible)
// ============================================
const mimo = createOpenAICompatible({
  name: 'xiaomi-mimo',           // Nom du provider (pour les logs)
  baseURL: MIMO_BASE_URL,        // URL de l'API MiMo
  apiKey: DEFAULT_API_KEY || undefined,
});

// ============================================
// FONCTION HELPER POUR OBTENIR LE PROVIDER
// ============================================
function getMiMoProvider() {
  const apiKey = DEFAULT_API_KEY;
  if (!apiKey) {
    console.warn('XIAOMI_MIMO_API_KEY not set');
  }
  // Retourne le modèle mimo-v2-flash configuré
  return mimo(DEFAULT_MIMO_MODEL);
}

// ============================================
// CUSTOM PROVIDER UNIFIÉ
// ============================================
// Tous les identifiants de modèles de l'UI sont routés vers MiMo
// Cela permet de garder l'UI inchangée tout en changeant le backend
export const hyper = customProvider({
  languageModels: {
    // Modèle par défaut
    'hyper-default': getMiMoProvider(),
    
    // Tous les autres modèles routés vers MiMo
    'hyper-nano': getMiMoProvider(),
    'hyper-name': getMiMoProvider(),
    'hyper-grok-3': getMiMoProvider(),
    'hyper-grok-4': getMiMoProvider(),
    'hyper-grok-4-fast': getMiMoProvider(),
    'hyper-grok-4-fast-think': getMiMoProvider(),
    'hyper-code': getMiMoProvider(),
    'hyper-qwen-4b': getMiMoProvider(),
    'hyper-qwen-32b': getMiMoProvider(),
    'hyper-gpt5': getMiMoProvider(),
    'hyper-google': getMiMoProvider(),
    'hyper-anthropic': getMiMoProvider(),
    // ... ajoutez tous vos identifiants de modèles ici
  },
});
```

### Explication du code :

1. **`createOpenAICompatible`** : Crée un client compatible avec l'API OpenAI
2. **`customProvider`** : Permet de mapper plusieurs identifiants de modèles vers un seul provider
3. **`getMiMoProvider()`** : Factory function qui retourne le modèle configuré

---

## ÉTAPE 5 : Utiliser le provider dans les routes API

### 5.1 Exemple de route de streaming (`app/api/search/route.ts`)

```typescript
import { hyper } from '@/ai/providers';
import { streamText } from 'ai';

export async function POST(request: Request) {
  const { messages, modelId = 'hyper-default' } = await request.json();

  // Utiliser le provider hyper avec l'identifiant du modèle
  const result = await streamText({
    model: hyper.languageModel(modelId),
    messages,
    maxTokens: 4096,
  });

  return result.toDataStreamResponse();
}
```

### 5.2 Exemple avec generateText

```typescript
import { hyper } from '@/ai/providers';
import { generateText } from 'ai';

async function generateResponse(prompt: string) {
  const result = await generateText({
    model: hyper.languageModel('hyper-default'),
    prompt,
  });

  return result.text;
}
```

---

## ÉTAPE 6 : Configuration de la liste des modèles (UI)

La liste des modèles dans l'UI reste inchangée, seul le backend change :

```typescript
// ai/providers.ts (suite)

interface Model {
  value: string;      // Identifiant utilisé par le code
  label: string;      // Nom affiché dans l'UI
  description: string;
  vision: boolean;
  reasoning: boolean;
  experimental: boolean;
  category: string;
  pdf: boolean;
  pro: boolean;
  requiresAuth: boolean;
  freeUnlimited: boolean;
  maxOutputTokens: number;
  fast?: boolean;
  isNew?: boolean;
}

export const models: Model[] = [
  {
    value: 'hyper-default',
    label: 'Grok 4 Fast',
    description: "LLM multimodèle le plus rapide",
    vision: true,
    reasoning: false,
    experimental: false,
    category: 'Free',
    pdf: false,
    pro: false,
    requiresAuth: false,
    freeUnlimited: false,
    maxOutputTokens: 16000,
    fast: true,
    isNew: true,
  },
  // ... autres modèles
];
```

---

## ÉTAPE 7 : Fonctions utilitaires pour les modèles

```typescript
// ai/providers.ts (suite)

export function getModelConfig(modelValue: string) {
  return models.find((model) => model.value === modelValue);
}

export function requiresAuthentication(modelValue: string): boolean {
  const model = getModelConfig(modelValue);
  return model?.requiresAuth || false;
}

export function requiresProSubscription(modelValue: string): boolean {
  const model = getModelConfig(modelValue);
  return model?.pro || false;
}

export function hasVisionSupport(modelValue: string): boolean {
  const model = getModelConfig(modelValue);
  return model?.vision || false;
}

export function getMaxOutputTokens(modelValue: string): number {
  const model = getModelConfig(modelValue);
  return model?.maxOutputTokens || 8000;
}
```

---

## ÉTAPE 8 : Déploiement sur Vercel

### 8.1 Ajouter les variables d'environnement sur Vercel

Dans le dashboard Vercel :
1. Allez dans **Settings** → **Environment Variables**
2. Ajoutez :
   - `XIAOMI_MIMO_API_KEY` = votre clé API
   - `XIAOMI_MIMO_BASE_URL` = `https://api.xiaomimimo.com/v1` (optionnel)

### 8.2 Redéployer l'application

```bash
vercel --prod
```

---

## Résumé des fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `package.json` | Ajout de `@ai-sdk/openai-compatible` |
| `.env.local` | Ajout de `XIAOMI_MIMO_API_KEY` et `XIAOMI_MIMO_BASE_URL` |
| `.env.example` | Documentation des nouvelles variables |
| `env/server.ts` | Validation Zod des nouvelles variables |
| `ai/providers.ts` | Création du provider MiMo avec `createOpenAICompatible` |

---

## Commandes Git pour l'intégration complète

```bash
# 1. Installer la dépendance
pnpm add @ai-sdk/openai-compatible

# 2. Vérifier les modifications
git status
git diff

# 3. Commit
git add .
git commit -m "feat: switch default model from Gemini 2.5 Flash to Xiaomi MiMo v2-Flash

Migrate LLM provider from Google Gemini 2.5 Flash to Xiaomi MiMo v2-Flash using OpenAI-compatible API integration. MiMo v2-Flash delivers 2.6x faster inference at 97.5% lower cost while maintaining full API compatibility.

- Update ai/providers.ts to use createOpenAICompatible with mimo-v2-flash
- Add XIAOMI_MIMO_API_KEY and optional XIAOMI_MIMO_BASE_URL env vars
- Add @ai-sdk/openai-compatible dependency
- Update docs and deployment configs accordingly"

# 4. Push
git push origin main
```

---

## Dépannage

### Erreur : "XIAOMI_MIMO_API_KEY not set"

**Solution :** Vérifiez que la variable d'environnement est bien définie dans `.env.local` et que le fichier est chargé.

### Erreur : "Model not found"

**Solution :** Assurez-vous que l'identifiant du modèle dans l'UI correspond à une entrée dans `languageModels` du `customProvider`.

### Erreur de connexion à l'API

**Solution :** Vérifiez que `XIAOMI_MIMO_BASE_URL` pointe vers la bonne URL et que votre clé API est valide.

---

## Architecture finale

```
📦 Projet
├── 📁 ai/
│   └── 📄 providers.ts      ← Configuration MiMo
├── 📁 app/
│   └── 📁 api/
│       └── 📁 search/
│           └── 📄 route.ts  ← Utilise hyper provider
├── 📁 env/
│   └── 📄 server.ts         ← Validation des variables
├── 📄 .env.local            ← Clés API (non commit)
├── 📄 .env.example          ← Template des variables
└── 📄 package.json          ← Dépendances
```

---

## Prompt de référence pour d'autres intégrations similaires

```
Je souhaite intégrer le LLM [NOM_DU_MODELE] dans mon projet Next.js avec le Vercel AI SDK.

L'API du modèle est compatible OpenAI et disponible à l'URL : [URL_API]
Le nom du modèle à utiliser est : [NOM_MODELE]

Étapes :
1. Installer @ai-sdk/openai-compatible
2. Créer les variables d'environnement pour la clé API et l'URL
3. Configurer createOpenAICompatible dans ai/providers.ts
4. Créer une factory function pour le provider
5. Utiliser customProvider pour mapper les identifiants UI vers le modèle
6. Exporter le provider et l'utiliser dans les routes API avec streamText/generateText

Le provider doit être exporté comme `hyper` et supporter tous les identifiants de modèles existants dans l'UI pour une migration transparente.
```

---

**✅ Intégration terminée !** Votre projet utilise maintenant MiMo-V2-Flash pour toutes les requêtes LLM.
