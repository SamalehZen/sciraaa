import { customProvider } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// Z.ai backend: single provider mapping to GLM-4.6V-Flash (FREE tier)
// GLM-4.6V-Flash: 128K context, supports Video/Image/Text/File input, native function calling
// API is OpenAI-compatible, so we use createOpenAI with custom baseURL
const DEFAULT_ZAI_MODEL = 'glm-4.6v-flash';
const FALLBACK_ZAI_MODELS = ['glm-4.5-flash', 'glm-4.6v'];

const ZAI_API_KEY = process.env.ZAI_API_KEY || '';

const zai = createOpenAI({
  baseURL: 'https://api.z.ai/api/paas/v4',
  apiKey: ZAI_API_KEY,
  compatibility: 'compatible',
  fetch: async (url, options) => {
    const body = options?.body ? JSON.parse(options.body as string) : {};
    body.thinking = { type: 'enabled', clear_thinking: true };
    
    const response = await fetch(url, {
      ...options,
      body: JSON.stringify(body),
    });

    if (!body.stream) {
      return response;
    }

    const reader = response.body?.getReader();
    if (!reader) return response;

    const stream = new ReadableStream({
      async start(controller) {
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ') || line === 'data: [DONE]') {
              controller.enqueue(encoder.encode(line + '\n'));
              continue;
            }

            try {
              const json = JSON.parse(line.slice(6));
              const delta = json.choices?.[0]?.delta;
              
              if (delta?.reasoning_content) {
                delta.reasoning = delta.reasoning_content;
                delete delta.reasoning_content;
              }
              
              controller.enqueue(encoder.encode('data: ' + JSON.stringify(json) + '\n'));
            } catch {
              controller.enqueue(encoder.encode(line + '\n'));
            }
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: response.headers,
      status: response.status,
      statusText: response.statusText,
    });
  },
});

function getZaiProvider(model: string = DEFAULT_ZAI_MODEL) {
  if (!ZAI_API_KEY) {
    console.warn('ZAI_API_KEY not set, GLM models will not work');
  }
  return zai(model);
}

// Z.ai provider for all hyper-* model ids expected by the UI.
// All models route to GLM-4.6V-Flash (FREE, 128K context, multimodal, native function calling)
export const hyper = customProvider({
  languageModels: {
    'hyper-default': getZaiProvider(),
    'hyper-nano': getZaiProvider(),
    'hyper-name': getZaiProvider(),
    'hyper-grok-3': getZaiProvider(),
    'hyper-grok-4': getZaiProvider(),
    'hyper-grok-4-fast': getZaiProvider(),
    'hyper-grok-4-fast-think': getZaiProvider(),
    'hyper-code': getZaiProvider(),
    'hyper-enhance': getZaiProvider(),
    'hyper-qwen-4b': getZaiProvider(),
    'hyper-qwen-4b-thinking': getZaiProvider(),
    'hyper-gpt5': getZaiProvider(),
    'hyper-gpt5-mini': getZaiProvider(),
    'hyper-gpt5-nano': getZaiProvider(),
    'hyper-o3': getZaiProvider(),
    'hyper-qwen-32b': getZaiProvider(),
    'hyper-gpt-oss-20': getZaiProvider(),
    'hyper-gpt-oss-120': getZaiProvider(),
    'hyper-deepseek-chat': getZaiProvider(),
    'hyper-deepseek-chat-think': getZaiProvider(),
    'hyper-deepseek-r1': getZaiProvider(),
    'hyper-qwen-coder': getZaiProvider(),
    'hyper-qwen-30': getZaiProvider(),
    'hyper-qwen-30-think': getZaiProvider(),
    'hyper-qwen-3-next': getZaiProvider(),
    'hyper-qwen-3-next-think': getZaiProvider(),
    'hyper-qwen-3-max': getZaiProvider(),
    'hyper-qwen-3-max-preview': getZaiProvider(),
    'hyper-qwen-235': getZaiProvider(),
    'hyper-qwen-235-think': getZaiProvider(),
    'hyper-glm-air': getZaiProvider('glm-4.5-air'),
    'hyper-glm': getZaiProvider('glm-4.5'),
    'hyper-glm-4.6': getZaiProvider('glm-4.6'),
    'hyper-glm-4.6v-flash': getZaiProvider('glm-4.6v-flash'),
    'hyper-kimi-k2-v2': getZaiProvider(),
    'hyper-haiku': getZaiProvider(),
    'hyper-mistral-medium': getZaiProvider(),
    'hyper-magistral-small': getZaiProvider(),
    'hyper-magistral-medium': getZaiProvider(),
    'hyper-google-lite': getZaiProvider(),
    'hyper-google': getZaiProvider(),
    'hyper-google-think': getZaiProvider(),
    'hyper-google-think-v2': getZaiProvider(),
    'hyper-google-think-v3': getZaiProvider(),
    'hyper-anthropic': getZaiProvider(),
  },
});

interface ModelParameters {
  temperature?: number;
  topP?: number;
  topK?: number;
  minP?: number;
  frequencyPenalty?: number;
}

interface Model {
  value: string;
  label: string;
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
  // Tags
  fast?: boolean;
  isNew?: boolean;
  parameters?: ModelParameters;
}

export const models: Model[] = [
  // Models (xAI)
  {
    value: 'hyper-grok-3',
    label: 'Grok 3',
    description: "Le LLM le plus récent et le plus intelligent de xAI",
    vision: false,
    reasoning: false,
    experimental: false,
    category: 'Pro',
    pdf: false,
    pro: true,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 16000,
  },
  {
    value: 'hyper-grok-4',
    label: 'Grok 4',
    description: "Le LLM le plus intelligent de xAI",
    vision: true,
    reasoning: true,
    experimental: false,
    category: 'Pro',
    pdf: false,
    pro: true,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 16000,
  },
  {
    value: 'hyper-default',
    label: 'Grok 4 Fast',
    description: "LLM multimodèle le plus rapide de xAI",
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
  {
    value: 'hyper-grok-4-fast-think',
    label: 'Grok 4 Fast Thinking',
    description: "LLM multimodèle de raisonnement le plus rapide de xAI",
    vision: true,
    reasoning: true,
    experimental: false,
    category: 'Pro',
    pdf: false,
    pro: true,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 16000,
    fast: true,
    isNew: true,
  },
  {
    value: 'hyper-qwen-32b',
    label: 'Qwen 3 32B',
    description: "LLM de raisonnement avancé d'Alibaba",
    vision: false,
    reasoning: false,
    experimental: false,
    category: 'Free',
    pdf: false,
    pro: false,
    requiresAuth: false,
    freeUnlimited: false,
    maxOutputTokens: 40960,
    fast: true,
    parameters: {
      temperature: 0.7,
      topP: 0.8,
      topK: 20,
      minP: 0,
    },
  },
  {
    value: 'hyper-qwen-4b',
    label: 'Qwen 3 4B',
    description: "Petit LLM de base d'Alibaba",
    vision: false,
    reasoning: false,
    experimental: false,
    category: 'Free',
    pdf: false,
    pro: false,
    requiresAuth: false,
    maxOutputTokens: 16000,
    freeUnlimited: false,
    parameters: {
      temperature: 0.7,
      topP: 0.8,
      topK: 20,
      minP: 0,
    },
  },
  {
    value: 'hyper-qwen-4b-thinking',
    label: 'Qwen 3 4B Thinking',
    description: "Petit LLM de base d'Alibaba",
    vision: false,
    reasoning: true,
    experimental: false,
    category: 'Free',
    pdf: false,
    pro: false,
    requiresAuth: false,
    maxOutputTokens: 16000,
    freeUnlimited: true,
    parameters: {
      temperature: 0.6,
      topP: 0.95,
      topK: 20,
      minP: 0,
    },
  },
  {
    value: 'hyper-gpt-oss-20',
    label: 'GPT OSS 20B',
    description: "Petit LLM open source d'OpenAI",
    vision: false,
    reasoning: false,
    experimental: false,
    category: 'Free',
    pdf: false,
    pro: false,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 16000,
    fast: true,
  },
  {
    value: 'hyper-gpt5-nano',
    label: 'GPT 5 Nano',
    description: "Plus petit LLM phare d'OpenAI",
    vision: true,
    reasoning: true,
    experimental: false,
    category: 'Free',
    pdf: true,
    pro: false,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 16000,
    fast: true,
  },
  {
    value: 'hyper-google-lite',
    label: 'Gemini 2.5 Flash Lite',
    description: "Petit LLM avancé de Google",
    vision: true,
    reasoning: false,
    experimental: false,
    category: 'Free',
    pdf: true,
    pro: false,
    requiresAuth: false,
    freeUnlimited: true,
    maxOutputTokens: 10000,
    isNew: true,
  },
  {
    value: 'hyper-code',
    label: 'Grok Code',
    description: "LLM de codage avancé de xAI",
    vision: false,
    reasoning: true,
    experimental: false,
    category: 'Pro',
    pdf: false,
    pro: true,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 16000,
    fast: true,
  },
  {
    value: 'hyper-mistral-medium',
    label: 'Mistral Medium',
    description: "LLM multimodal moyen de Mistral",
    vision: true,
    reasoning: false,
    experimental: false,
    category: 'Pro',
    pdf: true,
    pro: true,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 16000,
    isNew: true,
  },
  {
    value: 'hyper-magistral-small',
    label: 'Magistral Small',
    description: "Petit LLM de raisonnement de Mistral",
    vision: true,
    reasoning: true,
    experimental: false,
    category: 'Pro',
    pdf: true,
    pro: true,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 16000,
    isNew: true,
  },
  {
    value: 'hyper-magistral-medium',
    label: 'Magistral Medium',
    description: "Mistral's medium reasoning LLM",
    vision: true,
    reasoning: true,
    experimental: false,
    category: 'Pro',
    pdf: true,
    pro: true,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 16000,
    isNew: true,
  },
  {
    value: 'hyper-gpt-oss-120',
    label: 'GPT OSS 120B',
    description: "LLM open source avancé d'OpenAI",
    vision: false,
    reasoning: false,
    experimental: false,
    category: 'Pro',
    pdf: false,
    pro: true,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 16000,
    fast: true,
  },
  {
    value: 'hyper-gpt5-mini',
    label: 'GPT 5 Mini',
    description: "Petit LLM phare d'OpenAI",
    vision: true,
    reasoning: true,
    experimental: false,
    category: 'Pro',
    pdf: true,
    pro: true,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 16000,
    fast: false,
    isNew: true,
  },
  {
    value: 'hyper-gpt5',
    label: 'GPT 5',
    description: "LLM phare d'OpenAI",
    vision: true,
    reasoning: true,
    experimental: false,
    category: 'Pro',
    pdf: true,
    pro: true,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 16000,
    fast: false,
    isNew: true,
  },
  {
    value: 'hyper-o3',
    label: 'o3',
    description: "LLM avancé d'OpenAI",
    vision: true,
    reasoning: true,
    experimental: false,
    category: 'Pro',
    pdf: true,
    pro: true,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 16000,
    fast: false,
    isNew: true,
  },
  {
    value: 'hyper-deepseek-chat',
    label: 'DeepSeek 3.2 Exp',
    description: "LLM de conversation avancé de DeepSeek",
    vision: false,
    reasoning: false,
    experimental: false,
    category: 'Pro',
    pdf: false,
    pro: true,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 16000,
    isNew: true,
  },
  {
    value: 'hyper-deepseek-chat-think',
    label: 'DeepSeek 3.2 Exp Thinking',
    description: "LLM de conversation avancé avec raisonnement de DeepSeek",
    vision: false,
    reasoning: true,
    experimental: false,
    category: 'Pro',
    pdf: false,
    pro: true,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 16000,
    isNew: true,
  },
  {
    value: 'hyper-deepseek-r1',
    label: 'DeepSeek R1',
    description: "LLM de raisonnement avancé de DeepSeek",
    vision: false,
    reasoning: true,
    experimental: false,
    category: 'Pro',
    pdf: false,
    pro: true,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 16000,
    isNew: true,
  },
  {
    value: 'hyper-qwen-coder',
    label: 'Qwen 3 Coder 480B-A35B',
    description: "Alibaba's advanced coding LLM",
    vision: false,
    reasoning: false,
    experimental: false,
    category: 'Pro',
    pdf: false,
    pro: true,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 130000,
    fast: true,
  },
  {
    value: 'hyper-qwen-3-next',
    label: 'Qwen 3 Next 80B A3B Instruct',
    description: "LLM d'instruction avancé de Qwen",
    vision: false,
    reasoning: false,
    experimental: false,
    category: 'Pro',
    pdf: false,
    pro: true,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 100000,
    fast: true,
    isNew: true,
    parameters: {
      temperature: 0.7,
      topP: 0.8,
      minP: 0,
    },
  },
  {
    value: 'hyper-qwen-3-next-think',
    label: 'Qwen 3 Next 80B A3B Thinking',
    description: "LLM de raisonnement avancé de Qwen",
    vision: false,
    reasoning: true,
    experimental: false,
    category: 'Pro',
    pdf: false,
    pro: true,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 100000,
    isNew: true,
    parameters: {
      temperature: 0.6,
      topP: 0.95,
      minP: 0,
    },
  },
  {
    value: 'hyper-qwen-3-max',
    label: 'Qwen 3 Max',
    description: "LLM d'instruction avancé de Qwen",
    vision: false,
    reasoning: false,
    experimental: false,
    category: 'Pro',
    pdf: false,
    pro: true,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 10000,
    isNew: true,
  },
  {
    value: 'hyper-qwen-3-max-preview',
    label: 'Qwen 3 Max Preview',
    description: "LLM d'instruction avancé de Qwen",
    vision: false,
    reasoning: false,
    experimental: false,
    category: 'Pro',
    pdf: false,
    pro: true,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 10000,
    isNew: true,
  },
  {
    value: 'hyper-qwen-235',
    label: 'Qwen 3 235B A22B',
    description: "LLM d'instruction avancé de Qwen",
    vision: false,
    reasoning: false,
    experimental: false,
    category: 'Pro',
    pdf: false,
    pro: true,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 100000,
    parameters: {
      temperature: 0.7,
      topP: 0.8,
      minP: 0,
    },
  },
  {
    value: 'hyper-qwen-235-think',
    label: 'Qwen 3 235B A22B Thinking',
    description: "LLM de raisonnement avancé de Qwen",
    vision: false,
    reasoning: true,
    experimental: false,
    category: 'Pro',
    pdf: false,
    pro: true,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 100000,
    parameters: {
      temperature: 0.6,
      topP: 0.95,
      minP: 0,
    },
  },
  {
    value: 'hyper-kimi-k2-v2',
    label: 'Kimi K2 Latest',
    description: "LLM de base avancé de MoonShot AI",
    vision: false,
    reasoning: false,
    experimental: false,
    category: 'Pro',
    pdf: false,
    pro: true,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 10000,
    fast: true,
    parameters: {
      temperature: 0.6,
    },
  },
  {
    value: 'hyper-glm-4.6',
    label: 'GLM 4.6',
    description: "LLM de raisonnement avancé de Zhipu AI",
    vision: false,
    reasoning: true,
    experimental: false,
    category: 'Pro',
    pdf: false,
    pro: true,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 130000,
    isNew: true,
  },
  {
    value: 'hyper-glm-4.6v-flash',
    label: 'GLM 4.6V Flash',
    description: "LLM multimodal gratuit de Zhipu AI - Vision, Video, PDF",
    vision: true,
    reasoning: false,
    experimental: false,
    category: 'Free',
    pdf: true,
    pro: false,
    requiresAuth: false,
    freeUnlimited: true,
    maxOutputTokens: 32000,
    isNew: true,
    fast: true,
  },
  {
    value: 'hyper-glm-air',
    label: 'GLM 4.5 Air',
    description: "LLM de base efficace de Zhipu AI",
    vision: false,
    reasoning: true,
    experimental: false,
    category: 'Pro',
    pdf: false,
    pro: true,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 130000,
  },
  {
    value: 'hyper-glm',
    label: 'GLM 4.5',
    description: "Ancien LLM avancé de Zhipu AI",
    vision: false,
    reasoning: true,
    experimental: false,
    category: 'Pro',
    pdf: false,
    pro: true,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 13000,
  },
  {
    value: 'hyper-google',
    label: 'Gemini 2.5 Flash',
    description: "Petit LLM avancé de Google",
    vision: true,
    reasoning: false,
    experimental: false,
    category: 'Pro',
    pdf: true,
    pro: true,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 10000,
    isNew: true,
  },
  {
    value: 'hyper-google-think',
    label: 'Hypermarché L’Hyper',
    description: "Petit LLM avancé de Google avec raisonnement",
    vision: true,
    reasoning: true,
    experimental: false,
    category: 'Pro',
    pdf: true,
    pro: false,
    requiresAuth: false,
    freeUnlimited: true,
    maxOutputTokens: 10000,
    isNew: true,
  },
  {
    value: 'hyper-google-think-v2',
    label: 'Plateforme — Bientôt disponible',
    description: "Petit LLM avancé de Google avec raisonnement",
    vision: true,
    reasoning: true,
    experimental: false,
    category: 'Pro',
    pdf: true,
    pro: false,
    requiresAuth: false,
    freeUnlimited: true,
    maxOutputTokens: 10000,
    isNew: true,
  },
  {
    value: 'hyper-google-think-v3',
    label: 'Direction — Bientôt disponible',
    description: "Petit LLM avancé de Google avec raisonnement",
    vision: true,
    reasoning: true,
    experimental: false,
    category: 'Pro',
    pdf: true,
    pro: false,
    requiresAuth: false,
    freeUnlimited: true,
    maxOutputTokens: 10000,
    isNew: true,
  },
  {
    value: 'hyper-anthropic',
    label: 'Claude 4.5 Sonnet',
    description: "Le LLM le plus avancé d'Anthropic",
    vision: true,
    reasoning: false,
    experimental: false,
    category: 'Pro',
    pdf: true,
    pro: true,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 8000,
    isNew: false,
  },
];

// Helper functions for model access checks
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

export function isFreeUnlimited(modelValue: string): boolean {
  const model = getModelConfig(modelValue);
  return model?.freeUnlimited || false;
}

export function hasVisionSupport(modelValue: string): boolean {
  const model = getModelConfig(modelValue);
  return model?.vision || false;
}

export function hasPdfSupport(modelValue: string): boolean {
  const model = getModelConfig(modelValue);
  return model?.pdf || false;
}

export function hasReasoningSupport(modelValue: string): boolean {
  const model = getModelConfig(modelValue);
  return model?.reasoning || false;
}

export function isExperimentalModel(modelValue: string): boolean {
  const model = getModelConfig(modelValue);
  return model?.experimental || false;
}

export function getMaxOutputTokens(modelValue: string): number {
  const model = getModelConfig(modelValue);
  return model?.maxOutputTokens || 8000;
}

export function getModelParameters(modelValue: string): ModelParameters {
  const model = getModelConfig(modelValue);
  return model?.parameters || {};
}

// Access control helper
export function canUseModel(modelValue: string, user: any, isProUser: boolean): { canUse: boolean; reason?: string } {
  const model = getModelConfig(modelValue);

  if (!model) {
    return { canUse: false, reason: 'Model not found' };
  }

  // Check if model requires authentication
  if (model.requiresAuth && !user) {
    return { canUse: false, reason: 'authentication_required' };
  }

  // Check if model requires Pro subscription
  if (model.pro && !isProUser) {
    return { canUse: false, reason: 'pro_subscription_required' };
  }

  return { canUse: true };
}

// Helper to check if user should bypass rate limits
export function shouldBypassRateLimits(modelValue: string, user: any): boolean {
  const model = getModelConfig(modelValue);
  return Boolean(user && model?.freeUnlimited);
}

// Get acceptable file types for a model
export function getAcceptedFileTypes(modelValue: string, isProUser: boolean): string {
  const model = getModelConfig(modelValue);
  if (model?.pdf && isProUser) {
    return 'image/*,.pdf';
  }
  return 'image/*';
}

// Legacy arrays for backward compatibility (deprecated - use helper functions instead)
export const authRequiredModels = models.filter((m) => m.requiresAuth).map((m) => m.value);
export const proRequiredModels = models.filter((m) => m.pro).map((m) => m.value);
export const freeUnlimitedModels = models.filter((m) => m.freeUnlimited).map((m) => m.value);
