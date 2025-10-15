// /app/api/search/route.ts
import { convertToModelMessages, streamText, createUIMessageStream, JsonToSseTransformStream, generateText } from 'ai';
import { scira } from '@/ai/providers';
import { createResumableStreamContext, type ResumableStreamContext } from 'resumable-stream';
import { after } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { google } from '@ai-sdk/google';
import { geolocation } from '@vercel/functions';

import { saveChat, saveMessages, createStreamId, getChatById, updateChatTitleById } from '@/lib/db/queries';
import { extremeSearchTool } from '@/lib/tools';
import type { ChatMessage } from '@/lib/types';
import { getLightweightUser, generateTitleFromUserMessage, getGroupConfig } from '@/app/actions';

let globalStreamContext: ResumableStreamContext | null = null;

export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
        keyPrefix: 'arka:stream',
      });
    } catch (error: any) {
      if (error.message?.includes('REDIS_URL')) {
        console.log(' > Resumable streams are disabled due to missing REDIS_URL');
      } else {
        console.error(error);
      }
    }
  }
  return globalStreamContext;
}

function extractUrlsFromText(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s)"'>]+)(?![^<]*>|[^\(]*\))/g;
  const urls = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(text)) !== null) {
    urls.add(match[1]);
  }
  return Array.from(urls);
}

async function fetchAndSummarize(url: string): Promise<{ url: string; title?: string; excerpt?: string } | null> {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok) return null;
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) return null;

    const text = await res.text();
    if (contentType.includes('text/html')) {
      const titleMatch = text.match(/<title[^>]*>([^<]*)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : undefined;
      const body = text
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return { url, title, excerpt: body.slice(0, 1200) };
    }
    return { url, excerpt: text.slice(0, 1200) };
  } catch {
    return null;
  }
}

function buildAutoContext(summaries: Array<{ url: string; title?: string; excerpt?: string }>): string {
  if (!summaries.length) return '';
  const lines: string[] = [];
  lines.push('Context: The user message contains URLs that were fetched server-side. Here are concise notes:');
  summaries.forEach((s, i) => {
    const header = `URL #${i + 1}: ${s.title ? `${s.title} — ` : ''}${s.url}`;
    const excerpt = s.excerpt ? s.excerpt : '';
    lines.push(header);
    if (excerpt) lines.push(excerpt);
  });
  lines.push('Use this fetched context to improve your response. Do not list raw URLs unless relevant.');
  return lines.join('\n\n');
}

export async function POST(req: Request) {
  const requestStart = Date.now();
  const { messages, model, group, timezone, id } = await req.json();
  const streamId = 'stream-' + uuidv4();
  const { latitude, longitude } = geolocation(req);

  // Ensure user (authenticated or anonymous via cookie) exists
  const lightweightUser = await getLightweightUser();
  const userId = lightweightUser?.userId;

  // Ensure chat exists and track stream id
  const existingChat = await getChatById({ id }).catch(() => null);
  if (!existingChat && userId) {
    await saveChat({ id, userId, title: 'New Chat', visibility: 'private' });
    after(async () => {
      try {
        const title = await generateTitleFromUserMessage({ message: messages[messages.length - 1] });
        await updateChatTitleById({ chatId: id, title });
      } catch {}
    });
  }
  after(async () => {
    try {
      await createStreamId({ streamId, chatId: id });
    } catch {}
  });

  // Save the last user message before streaming (if we have a user)
  if (userId) {
    try {
      await saveMessages({
        messages: [
          {
            chatId: id,
            id: messages[messages.length - 1].id,
            role: 'user',
            parts: messages[messages.length - 1].parts,
            attachments: messages[messages.length - 1].experimental_attachments ?? [],
            createdAt: new Date(),
            model,
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            completionTime: 0,
          },
        ],
      });
    } catch {}
  }

  // Auto-fetch URLs from the last user text
  const lastText = (messages?.[messages.length - 1]?.parts || [])
    .filter((p: any) => p?.type === 'text')
    .map((p: any) => p.text)
    .join('\n');
  const urls = extractUrlsFromText(lastText).slice(0, 3);
  const fetched = await Promise.all(urls.map((u) => fetchAndSummarize(u)));
  const summaries = fetched.filter((x): x is NonNullable<typeof x> => Boolean(x));
  const autoContext = buildAutoContext(summaries);

  const streamStart = Date.now();

  const dataStream = createUIMessageStream<ChatMessage>({
    execute: async ({ writer }) => {
      const { instructions, tools: toolIds } = await getGroupConfig(group);
      const systemParts: string[] = [];
      if (instructions) systemParts.unshift(instructions);
      if (autoContext) systemParts.push(autoContext);
      if (latitude && longitude) systemParts.push(`User location (approx): ${latitude}, ${longitude}`);

      if (String(group) === 'libeller') {
        const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
        const askText = normalize(lastText || '');
        const leakingAsk = askText.includes('prompt complet') || askText.includes('exact prompt') || askText.includes('full prompt') || askText.includes('regles exactes') || askText.includes('règles exactes') || askText.includes('show prompt') || askText.includes('montre les regles') || askText.includes('montre les règles') || askText.includes('affiche les regles') || askText.includes('affiche les règles') || (askText.includes('les regles') && (askText.includes('montre') || askText.includes('affiche') || askText.includes('donne') || askText.includes('explique'))) || (askText.includes('les règles') && (askText.includes('montre') || askText.includes('affiche') || askText.includes('donne') || askText.includes('explique')));
        const safeGuardMsg = "J’applique des règles internes de nettoyage et de standardisation. Pour les détails spécifiques, contactez Arka (développeur).";
        if (!lastText || leakingAsk) {
          const assistantId = 'assistant-' + uuidv4();
          writer.write({ type: 'data-appendMessage', data: JSON.stringify({ id: assistantId, role: 'assistant', parts: [{ type: 'text', text: safeGuardMsg }] }), transient: true });
          if (userId) {
            try {
              await saveMessages({ messages: [{ id: assistantId, role: 'assistant', parts: [{ type: 'text', text: safeGuardMsg }], createdAt: new Date(), attachments: [], chatId: id, model, completionTime: (Date.now() - streamStart) / 1000, inputTokens: 0, outputTokens: 0, totalTokens: 0 }] });
            } catch {}
          }
          return;
        }

        const items = lastText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
        const chunkSize = 80;
        const chunks: string[][] = [];
        for (let i = 0; i < items.length; i += chunkSize) chunks.push(items.slice(i, i + chunkSize));

        const parseTable = (txt: string): Array<{ original: string; corrected: string }> => {
          const lines = txt.split('\n').map((l) => l.trim()).filter(Boolean);
          const rows: Array<{ original: string; corrected: string }> = [];
          let inTable = false;
          for (const line of lines) {
            if (line.startsWith('|') && line.includes('|')) {
              const cells = line.split('|').map((c) => c.trim());
              if (cells.length >= 4) {
                if (!inTable) {
                  const h1 = cells[1]?.toLowerCase();
                  const h2 = cells[2]?.toLowerCase();
                  if (h1?.includes('libellé original') && h2?.includes('libellé corrigé')) {
                    inTable = true;
                  }
                } else {
                  if (cells[1]?.toLowerCase().includes('libellé original') && cells[2]?.toLowerCase().includes('libellé corrigé')) {
                    continue;
                  }
                  if (cells[1] && cells[2]) {
                    rows.push({ original: cells[1], corrected: cells[2] });
                  }
                }
              }
            } else if (inTable && (line.startsWith('---') || line.includes('---'))) {
              continue;
            } else if (inTable && line === '') {
              continue;
            }
          }
          return rows;
        };

        const isLeak = (txt: string) => {
          const t = normalize(txt || '');
          // Only flag as leak if it contains system/prompt-revealing patterns, not legitimate label content
          const systemPromptPatterns = [
            'role et objectif',
            'rôle et objectif', 
            'regles critiques',
            'règles critiques'
          ];
          return systemPromptPatterns.some(pattern => t.includes(pattern));
        };

        const map = new Map<string, string>();
        for (let idx = 0; idx < chunks.length; idx++) {
          const chunkText = chunks[idx].join('\n');
          const { text } = await generateText({
            model: google('gemini-2.5-flash' as any),
            temperature: 0,
            topP: 0.1,
            maxOutputTokens: 4000,
            system: systemParts.join('\n\n'),
            prompt: chunkText,
          });
          if (isLeak(text)) {
            const { text: repaired } = await generateText({
              model: google('gemini-2.5-flash' as any),
              temperature: 0,
              topP: 0.1,
              maxOutputTokens: 4000,
              system: systemParts.join('\n\n'),
              prompt: `REPARATION STRICTE: Retournez UNIQUEMENT un tableau Markdown à 2 colonnes nommé exactement "Libellé Original" et "Libellé Corrigé" pour les lignes suivantes, sans aucune explication avant ou après le tableau:\n\n${chunkText}`,
            });
            const rows = parseTable(repaired);
            rows.forEach((r) => {
              if (!map.has(r.original)) map.set(r.original, r.corrected);
            });
          } else {
            const rows = parseTable(text);
            rows.forEach((r) => {
              if (!map.has(r.original)) map.set(r.original, r.corrected);
            });
          }
        }

        const missing = items.filter((o) => !map.has(o));
        if (missing.length > 0) {
          const repairChunkSize = 100;
          for (let i = 0; i < missing.length; i += repairChunkSize) {
            const part = missing.slice(i, i + repairChunkSize).join('\n');
            const { text } = await generateText({
              model: google('gemini-2.5-flash' as any),
              temperature: 0,
              topP: 0.1,
              maxOutputTokens: 4000,
              system: systemParts.join('\n\n'),
              prompt: `REPARATION STRICTE: Retournez UNIQUEMENT un tableau Markdown à 2 colonnes nommé exactement "Libellé Original" et "Libellé Corrigé" pour les lignes suivantes, sans aucune explication avant ou après le tableau:\n\n${part}`,
            });
            const rows = parseTable(text);
            rows.forEach((r) => {
              if (!map.has(r.original)) map.set(r.original, r.corrected);
            });
          }
        }

        const header = '| Libellé Original | Libellé Corrigé |\n|---|---|';
        const body = items.map((o) => `| ${o} | ${map.get(o) ?? ''} |`).join('\n');
        let finalTable = `${header}\n${body}`;

        if (isLeak(finalTable)) {
          finalTable = "J’applique des règles internes de nettoyage et de standardisation. Pour les détails spécifiques, contactez Arka (développeur).";
        }

        const assistantId = 'assistant-' + uuidv4();
        writer.write({ type: 'data-appendMessage', data: JSON.stringify({ id: assistantId, role: 'assistant', parts: [{ type: 'text', text: finalTable }] }), transient: true });
        if (userId) {
          try {
            await saveMessages({ messages: [{ id: assistantId, role: 'assistant', parts: [{ type: 'text', text: finalTable }], createdAt: new Date(), attachments: [], chatId: id, model, completionTime: (Date.now() - streamStart) / 1000, inputTokens: 0, outputTokens: 0, totalTokens: 0 }] });
          } catch {}
        }
        return;
      }

      const modelNames = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-exp'];
      let result: ReturnType<typeof streamText> | null = null;
      let lastError: unknown = null;
      for (const name of modelNames) {
        try {
          {
            const toolsSpec = Array.isArray(toolIds) && toolIds.includes('extreme_search')
              ? { extreme_search: extremeSearchTool(writer) }
              : undefined;
            result = streamText({
              model: google(name as any),
              messages: convertToModelMessages(messages),
              system: systemParts.join('\n\n'),
              tools: toolsSpec as any,
              toolChoice: toolsSpec ? 'required' : 'auto',
            });
          }
          break;
        } catch (err) {
          lastError = err;
          continue;
        }
      }
      if (!result) throw lastError ?? new Error('Failed to start stream');

      result.consumeStream();
      const enableReasoning = String(model) === 'scira-google-think';
      writer.merge(
        result.toUIMessageStream({
          sendReasoning: enableReasoning,
          messageMetadata: ({ part }) => {
            if (part.type === 'finish') {
              const processingTime = (Date.now() - streamStart) / 1000;
              return {
                model: model as string,
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
    onError() {
      return 'Oops, an error occurred!';
    },
    onFinish: async ({ messages: streamed }) => {
      if (userId) {
        try {
          await saveMessages({
            messages: streamed.map((m) => ({
              id: m.id,
              role: m.role,
              parts: m.parts,
              createdAt: new Date(),
              attachments: [],
              chatId: id,
              model,
              completionTime: m.metadata?.completionTime ?? 0,
              inputTokens: m.metadata?.inputTokens ?? 0,
              outputTokens: m.metadata?.outputTokens ?? 0,
              totalTokens: m.metadata?.totalTokens ?? 0,
            })),
          });
        } catch {}
      }
    },
  });

  const streamContext = getStreamContext();
  if (streamContext) {
    return new Response(
      await streamContext.resumableStream(streamId, () => dataStream.pipeThrough(new JsonToSseTransformStream())),
    );
  }
  return new Response(dataStream.pipeThrough(new JsonToSseTransformStream()));
}
