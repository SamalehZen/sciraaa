// /app/api/chat/route.ts
import {
  getGroupConfig,
  getUserMessageCount,
  getExtremeSearchUsageCount,
  getCurrentUser,
  getLightweightUser,
} from '@/app/actions';
import {
  convertToModelMessages,
  streamText,
  NoSuchToolError,
  createUIMessageStream,
  generateObject,
  stepCountIs,
  JsonToSseTransformStream,
} from 'ai';
import { hasPdfAttachments, convertMessagesForOpenRouterPdf } from '@/lib/openrouter-pdf-transform';
import {
  hyper,
  requiresAuthentication,
  requiresProSubscription,
  shouldBypassRateLimits,
  getModelParameters,
  hasReasoningSupport,
  getModelConfig,
} from '@/ai/providers';
import {
  createStreamId,
  getChatById,
  saveChat,
  saveMessages,
  incrementExtremeSearchUsage,
  incrementMessageUsage,
} from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { createResumableStreamContext, type ResumableStreamContext } from 'resumable-stream';
import { after } from 'next/server';
import { CustomInstructions } from '@/lib/db/schema';
import { v7 as uuidv7 } from 'uuid';
import { geolocation } from '@vercel/functions';
import { createStreamResponse } from '@/lib/streaming-heartbeat';

import {
  datetimeTool,
  greetingTool,
  eanSearchTool,
} from '@/lib/tools';
import { GroqProviderOptions } from '@ai-sdk/groq';
import { markdownJoinerTransform } from '@/lib/parser';
import { ChatMessage } from '@/lib/types';
import { OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import { AnthropicProviderOptions } from '@ai-sdk/anthropic';
import { getCachedCustomInstructionsByUserId } from '@/lib/user-data-server';
import { GoogleGenerativeAIProviderOptions } from '@ai-sdk/google';

import { CohereChatModelOptions } from '@ai-sdk/cohere';

let globalStreamContext: ResumableStreamContext | null = null;

let configPromise: Promise<any>;

export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
        keyPrefix: 'hyper-ai',
      });
    } catch (error: any) {
      if (error.message.includes('REDIS_URL')) {
        console.log(' > Resumable streams are disabled due to missing REDIS_URL');
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export async function POST(req: Request) {
  const requestStartTime = Date.now();
  const {
    messages,
    model,
    group,
    timezone,
    id,
    selectedVisibilityType,
    isCustomInstructionsEnabled,
    searchProvider,
    selectedConnectors,
  } = await req.json();
  const { latitude, longitude } = geolocation(req);
  const streamId = 'stream-' + uuidv7();

  const rawModel = typeof model === 'string' ? model.trim() : '';
  const resolvedModel = getModelConfig(rawModel) ? rawModel : 'hyper-default';

  console.log('🔍 Search API:', { model: resolvedModel, group, latitude, longitude });

  const lightweightUser = await getLightweightUser();


  if (!lightweightUser) {
    if (requiresAuthentication(resolvedModel)) {
      return new ChatSDKError('unauthorized:model', `${resolvedModel} requires authentication`).toResponse();
    }
  } else {
    if (requiresProSubscription(resolvedModel) && !lightweightUser.isProUser) {
      return new ChatSDKError('upgrade_required:model', `${resolvedModel} requires a Pro subscription`).toResponse();
    }
  }

  const isProUser = lightweightUser?.isProUser ?? false;

  configPromise = getGroupConfig(group);

  const fullUserPromise = lightweightUser ? getCurrentUser() : Promise.resolve(null);

  const customInstructionsPromise = lightweightUser && (isCustomInstructionsEnabled ?? true)
    ? fullUserPromise.then(user => user ? getCachedCustomInstructionsByUserId(user.id) : null)
    : Promise.resolve(null);

  let criticalChecksPromise: Promise<{
    canProceed: boolean;
    error?: any;
    isProUser: boolean;
    messageCount?: number;
    extremeSearchUsage?: number;
    subscriptionData?: any;
    shouldBypassLimits?: boolean;
  }>;

  if (lightweightUser) {
    const chatValidationPromise = getChatById({ id }).then(async (existingChat) => {
      if (existingChat && existingChat.userId !== lightweightUser.userId) {
        throw new ChatSDKError('forbidden:chat', 'This chat belongs to another user');
      }

      if (!existingChat) {
        await saveChat({
          id,
          userId: lightweightUser.userId,
          title: 'New Chat',
          visibility: selectedVisibilityType,
        });


      }

      await createStreamId({ streamId, chatId: id });

      return existingChat;
    });

    if (!isProUser) {
      criticalChecksPromise = Promise.all([
        fullUserPromise,
        chatValidationPromise,
      ]).then(async ([user]) => {
        if (!user) {
          throw new ChatSDKError('unauthorized:auth', 'User authentication failed');
        }

        const [messageCountResult, extremeSearchUsage] = await Promise.all([
          getUserMessageCount(user),
          getExtremeSearchUsageCount(user),
        ]);

        if (messageCountResult.error) {
          throw new ChatSDKError('bad_request:api', 'Failed to verify usage limits');
        }

        const shouldBypassLimits = shouldBypassRateLimits(resolvedModel, user);
        if (!shouldBypassLimits && messageCountResult.count !== undefined && messageCountResult.count >= 100) {
          throw new ChatSDKError('rate_limit:chat', 'Daily search limit reached');
        }

        return {
          canProceed: true,
          isProUser: false,
          messageCount: messageCountResult.count,
          extremeSearchUsage: extremeSearchUsage.count,
          subscriptionData: user.polarSubscription
            ? { hasSubscription: true, subscription: { ...user.polarSubscription, organizationId: null } }
            : { hasSubscription: false },
          shouldBypassLimits,
        };
      }).catch(error => {
        if (error instanceof ChatSDKError) throw error;
        throw new ChatSDKError('bad_request:api', 'Failed to verify user access');
      });
    } else {
      criticalChecksPromise = Promise.all([
        fullUserPromise,
        chatValidationPromise,
      ]).then(([user]) => ({
        canProceed: true,
        isProUser: true,
        messageCount: 0,
        extremeSearchUsage: 0,
        subscriptionData: user?.polarSubscription
          ? { hasSubscription: true, subscription: { ...user.polarSubscription, organizationId: null } }
          : { hasSubscription: false },
        shouldBypassLimits: true,
      }));
    }
  } else {
    criticalChecksPromise = Promise.resolve({
      canProceed: true,
      isProUser: false,
      messageCount: 0,
      extremeSearchUsage: 0,
      subscriptionData: null,
      shouldBypassLimits: false,
    });
  }

  let customInstructions: CustomInstructions | null = null;

  const stream = createUIMessageStream<ChatMessage>({
    execute: async ({ writer: dataStream }) => {
      const [criticalResult, { tools: activeTools, instructions }, customInstructionsResult, user] = await Promise.all([
        criticalChecksPromise,
        configPromise,
        customInstructionsPromise,
        fullUserPromise,
      ]);

      if (!criticalResult.canProceed) {
        throw criticalResult.error;
      }

      customInstructions = customInstructionsResult;

      if (user) {
        await saveMessages({
          messages: [{
            chatId: id,
            id: messages[messages.length - 1].id,
            role: 'user',
            parts: messages[messages.length - 1].parts,
            attachments: messages[messages.length - 1].experimental_attachments ?? [],
            createdAt: new Date(),
            model: resolvedModel,
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            completionTime: 0,
          }],
        });
      }

      const setupTime = (Date.now() - requestStartTime) / 1000;
      console.log(`🚀 Time to streamText: ${setupTime.toFixed(2)}s`);

      const streamStartTime = Date.now();

      const containsPdf = hasPdfAttachments(messages);
      
      if (containsPdf) {
        console.log('📄 PDF detected, using direct OpenRouter API with file-parser plugin');
        
        const openRouterMessages = convertMessagesForOpenRouterPdf(messages);
        const systemPrompt = instructions +
          (customInstructions && (isCustomInstructionsEnabled ?? true)
            ? `\n\nThe user's custom instructions are as follows and YOU MUST FOLLOW THEM AT ALL COSTS: ${customInstructions?.content}`
            : '') +
          (latitude && longitude ? `\n\nThe user's location is ${latitude}, ${longitude}.` : '');
        
        openRouterMessages.unshift({ role: 'system', content: systemPrompt });
        
        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
        const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
        
        const openRouterResponse = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': process.env.APP_URL || 'https://your-app.com',
            'X-Title': 'Hyper AI',
          },
          body: JSON.stringify({
            model: 'deepseek/deepseek-r1-0528:free',
            messages: openRouterMessages,
            stream: true,
            plugins: [
              {
                id: 'file-parser',
                pdf: {
                  engine: 'pdf-text',
                },
              },
            ],
          }),
        });
        
        if (!openRouterResponse.ok) {
          const errorText = await openRouterResponse.text();
          console.error('📄 OpenRouter API error:', openRouterResponse.status, errorText);
          throw new Error(`OpenRouter API error: ${openRouterResponse.status}`);
        }
        
        const reader = openRouterResponse.body?.getReader();
        if (!reader) {
          throw new Error('No response body from OpenRouter');
        }
        
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    fullText += content;
                    dataStream.write({ type: 'text', text: content });
                  }
                } catch {}
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
        
        const processingTime = (Date.now() - streamStartTime) / 1000;
        console.log(`✅ PDF Request completed: ${processingTime.toFixed(2)}s`);
        
        dataStream.write({
          type: 'finish',
          finishReason: 'stop',
          totalUsage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        } as any);
        
        if (user?.id) {
          after(async () => {
            try {
              if (!shouldBypassRateLimits(resolvedModel, user)) {
                await incrementMessageUsage({ userId: user.id });
              }
            } catch (error) {
              console.error('Failed to track usage:', error);
            }
          });
        }
        
        return;
      }

      const processedMessages = convertToModelMessages(messages);

      const result = streamText({
        model: hyper.languageModel(resolvedModel),
        messages: processedMessages,
        ...getModelParameters(resolvedModel),
        stopWhen: stepCountIs(5),
        onAbort: ({ steps }) => {
          console.log('Stream aborted after', steps.length, 'steps');
        },
        maxRetries: 10,
        activeTools: [...activeTools],
        experimental_transform: markdownJoinerTransform(),
        system:
          instructions +
          (customInstructions && (isCustomInstructionsEnabled ?? true)
            ? `\n\nThe user's custom instructions are as follows and YOU MUST FOLLOW THEM AT ALL COSTS: ${customInstructions?.content}`
            : '\n') +
          (latitude && longitude ? `\n\nThe user's location is ${latitude}, ${longitude}.` : ''),
        toolChoice: 'auto',
        providerOptions: {
          openrouter: {
            plugins: [
              {
                id: "file-parser",
                pdf: {
                  engine: "pdf-text"
                }
              }
            ]
          },
          google: {
            ...(resolvedModel === 'hyper-google-think' || resolvedModel === 'hyper-google-pro-think'
              ? {
                thinkingConfig: {
                  thinkingBudget: 400,
                  includeThoughts: true,
                },
              }
              : {}),
            threshold: "OFF",
          } satisfies GoogleGenerativeAIProviderOptions,
        },
        prepareStep: async ({ steps, messages }) => {
          const totalTokens = steps.reduce((sum, step) => sum + (step.usage?.totalTokens ?? 0), 0);

          const shouldPrune = messages.length > 10 || totalTokens > 100000;
          
          const modelHasReasoning = hasReasoningSupport(resolvedModel);

          const totalToolCalls = steps.reduce(
            (count, step) => count + step.toolCalls.length,
            0,
          );

          const MAX_TOOL_CALLS_PER_RESPONSE = 10;

          if (totalToolCalls >= MAX_TOOL_CALLS_PER_RESPONSE) {
            return {
              toolChoice: 'none',
              activeTools: [],
            };
          }

          return undefined;
        },
        tools: (() => {
          const baseTools = {
            datetime: datetimeTool,
            ean_search: eanSearchTool(dataStream),
            greeting: greetingTool(timezone),
          };

          return baseTools;
        })(),
        experimental_repairToolCall: async ({ toolCall, tools, inputSchema, error }) => {
          if (NoSuchToolError.isInstance(error)) {
            return null;
          }

          console.log('Fixing tool call================================');
          console.log('toolCall', toolCall);
          console.log('tools', tools);
          console.log('parameterSchema', inputSchema);
          console.log('error', error);

          const tool = tools[toolCall.toolName as keyof typeof tools];

          if (!tool) {
            return null;
          }

          const { object: repairedArgs } = await generateObject({
            model: hyper.languageModel('hyper-grok-4-fast'),
            schema: tool.inputSchema,
            prompt: [
              `The model tried to call the tool "${toolCall.toolName}"` + ` with the following arguments:`,
              JSON.stringify(toolCall.input),
              `The tool accepts the following schema:`,
              JSON.stringify(inputSchema(toolCall)),
              'Please fix the arguments.',
              `Today's date is ${new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}`,
            ].join('\n'),
          });

          console.log('repairedArgs', repairedArgs);

          return { ...toolCall, args: JSON.stringify(repairedArgs) };
        },
        onChunk(event) {
          if (event.chunk.type === 'tool-call') {
            console.log('Called Tool: ', event.chunk.toolName);
          }
        },
        onStepFinish(event) {
          console.log('Step Request:', event.request);
          if (event.warnings) {
            console.log('Warnings: ', event.warnings);
          }
        },
        onFinish: async (event) => {
          const processingTime = (Date.now() - requestStartTime) / 1000;
          console.log(`✅ Request completed: ${processingTime.toFixed(2)}s (${event.finishReason})`);

          if (user?.id && event.finishReason === 'stop') {
            after(async () => {
              try {
                if (!shouldBypassRateLimits(resolvedModel, user)) {
                  await incrementMessageUsage({ userId: user.id });
                }
              } catch (error) {
                console.error('Failed to track usage:', error);
              }
            });
          }
        },
        onError(event) {
          const processingTime = (Date.now() - requestStartTime) / 1000;
          console.error(`❌ Request failed: ${processingTime.toFixed(2)}s`, event.error);
        },
      });

      result.consumeStream();

      dataStream.merge(
        result.toUIMessageStream({
          sendReasoning: true,
          messageMetadata: ({ part }) => {
            if (part.type === 'finish') {
              console.log('Finish part: ', part);
              const processingTime = (Date.now() - streamStartTime) / 1000;
              return {
                model: resolvedModel as string,
                completionTime: processingTime,
                createdAt: new Date().toISOString(),
                totalTokens: part.totalUsage?.totalTokens ?? null,
                inputTokens: part.totalUsage?.inputTokens ?? null,
                outputTokens: part.totalUsage?.outputTokens ?? null,
              };
            }
          },
        }),
      );
    },
    onError(error) {
      console.log('Error: ', error);
      if (error instanceof Error && error.message.includes('Rate Limit')) {
        return 'Oops, you have reached the rate limit! Please try again later.';
      }
      return 'Oops, an error occurred!';
    },
    onFinish: async ({ messages }) => {
      if (lightweightUser) {
        await saveMessages({
          messages: messages.map((message) => ({
            id: message.id,
            role: message.role,
            parts: message.parts,
            createdAt: new Date(),
            attachments: [],
            chatId: id,
            model: resolvedModel,
            completionTime: message.metadata?.completionTime ?? 0,
            inputTokens: message.metadata?.inputTokens ?? 0,
            outputTokens: message.metadata?.outputTokens ?? 0,
            totalTokens: message.metadata?.totalTokens ?? 0,
          })),
        });
      }
    },
  });
  
  return createStreamResponse(
    stream.pipeThrough(new JsonToSseTransformStream())
  );
}
