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

      if (group === 'libeller') {
        const normalized = (lastText || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        const normalizeAsk = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
        const tAsk = normalizeAsk(lastText || '');
        const askForPrompt = /(full\s*prompt|exact\s*prompt|prompt\s*(?:complet|entier|exact)|texte\s*du\s*prompt)/.test(tAsk) || /(regles?\s*(?:exactes?|precises?|completes?|detaillees?)|instructions?\s*(?:exactes?|precises?|completes?|detaillees?))/.test(tAsk);
        if (askForPrompt) {
          const msg: ChatMessage = {
            id: 'msg-' + uuidv4(),
            role: 'assistant',
            parts: [{ type: 'text', text: "J’applique des règles internes de nettoyage et de standardisation. Pour les détails spécifiques, contactez Arka (développeur)." }],
            attachments: [],
            metadata: {
              model: String(model),
              completionTime: 0,
              createdAt: new Date().toISOString(),
              inputTokens: 0,
              outputTokens: 0,
              totalTokens: 0,
            },
          } as any;
          writer.write({ type: 'data-appendMessage', data: JSON.stringify(msg), transient: false });
          return;
        }
        if (normalized.length === 0) {
          const msg: ChatMessage = {
            id: 'msg-' + uuidv4(),
            role: 'assistant',
            parts: [{ type: 'text', text: "Format d’entrée invalide. Collez une liste multi‑ligne avec un libellé par ligne (pas de texte libre)." }],
            attachments: [],
            metadata: {
              model: String(model),
              completionTime: 0,
              createdAt: new Date().toISOString(),
              inputTokens: 0,
              outputTokens: 0,
              totalTokens: 0,
            },
          } as any;
          writer.write({ type: 'data-appendMessage', data: JSON.stringify(msg), transient: false });
          return;
        }
        if (normalized.length > 300) {
          const warn: ChatMessage = {
            id: 'msg-' + uuidv4(),
            role: 'assistant',
            parts: [{ type: 'text', text: "Grand volume détecté, traitement par lots en cours…" }],
            attachments: [],
            metadata: {
              model: String(model),
              completionTime: 0,
              createdAt: new Date().toISOString(),
              inputTokens: 0,
              outputTokens: 0,
              totalTokens: 0,
            },
          } as any;
          writer.write({ type: 'data-appendMessage', data: JSON.stringify(warn), transient: true });
        }

        // Chunking strategy: aim ~8000 chars per chunk to fit prompt comfortably
        const toChunks = (items: string[], maxChars = 8000): string[][] => {
          const chunks: string[][] = [];
          let current: string[] = [];
          let currentLen = 0;
          for (const it of items) {
            const len = it.length + 1;
            if (currentLen + len > maxChars && current.length > 0) {
              chunks.push(current);
              current = [it];
              currentLen = len;
            } else {
              current.push(it);
              currentLen += len;
            }
          }
          if (current.length) chunks.push(current);
          return chunks;
        };

        const chunks = toChunks(normalized);

        const processChunk = async (lines: string[]): Promise<string> => {
          const { text } = await generateText({
            model: google('gemini-2.5-flash' as any),
            system: systemParts.join('\n\n'),
            temperature: 0,
            topP: 0.1,
            prompt: lines.join('\n')
          });
          return text || '';
        };

        const chunkOutputs: string[] = [];
        for (let i = 0; i < chunks.length; i++) {
          // Optional transient progress signal
          const note: ChatMessage = {
            id: 'msg-' + uuidv4(),
            role: 'assistant',
            parts: [{ type: 'text', text: `Traitement du lot ${i + 1}/${chunks.length}…` }],
            attachments: [],
            metadata: {
              model: String(model),
              completionTime: 0,
              createdAt: new Date().toISOString(),
              inputTokens: 0,
              outputTokens: 0,
              totalTokens: 0,
            },
          } as any;
          writer.write({ type: 'data-appendMessage', data: JSON.stringify(note), transient: true });

          const out = await processChunk(chunks[i]);
          chunkOutputs.push(out);
        }

        // Aggregate Markdown tables into one
        const expectedHeader = '| Libellé Original | Libellé Corrigé |';
        const rows: string[] = [];
        for (const out of chunkOutputs) {
          if (/RÔLE ET OBJECTIF|MÉTHODOLOGIE|ÉTAPE\s+1|FORMAT DE SORTIE REQUIS/i.test(out)) {
            sawLeak = true;
          }
          const lines = out.split(/\r?\n/).map((l) => l.trim());
          // Extract only table lines
          const tableLines = lines.filter((l) => /^\|.*\|$/.test(l));
          if (!tableLines.length) continue;
          // Remove header and separator lines for all but first chunk
          let startIdx = 0;
          const headerIdx = tableLines.findIndex((l) => /Libellé\s*Original/i.test(l) && /Libellé\s*Corrigé/i.test(l));
          if (headerIdx !== -1) startIdx = headerIdx + 1; // skip header
          const sepIdx = tableLines.findIndex((l) => /^\|\s*-+\s*\|/i.test(l));
          let body = tableLines.slice(startIdx);
          // If separator exists directly after header, drop it
          if (sepIdx !== -1 && sepIdx >= startIdx && sepIdx < startIdx + 2) {
            body = tableLines.slice(Math.max(sepIdx + 1, startIdx));
          }
          rows.push(...body);
        }

        // Build aggregated table with single header
        let aggregated = [expectedHeader, '| --- | --- |', ...rows].join('\n');

        // Validation: ensure exactly two columns and row count equals inputs
        const parseTable = (md: string) => {
          const lines = md.split(/\r?\n/).filter((l) => /^\|.*\|$/.test(l));
          if (lines.length < 2) return { header: [], body: [] as string[][] };
          const header = lines[0]
            .split('|')
            .map((s) => s.trim())
            .filter(Boolean);
          const body = lines.slice(2).map((line) => line
            .split('|')
            .map((s) => s.trim())
            .filter(Boolean));
          return { header, body };
        };

        const normalizeTwoCols = (md: string) => {
          const { header, body } = parseTable(md);
          const fixedHeader = ['Libellé Original', 'Libellé Corrigé'];
          const fixedBody = body.map((cols) => {
            if (cols.length >= 2) return [cols[0], cols[1]];
            if (cols.length === 1) return [cols[0], ''];
            return ['', ''];
          });
          return [
            `| ${fixedHeader[0]} | ${fixedHeader[1]} |`,
            '| --- | --- |',
            ...fixedBody.map((r) => `| ${r[0]} | ${r[1]} |`),
          ].join('\n');
        };

        const ensureRowCount = (md: string, originals: string[]) => {
          const { body } = parseTable(md);
          if (body.length === originals.length) return md;
          return '';
        };

        const repairIfNeeded = async (md: string, originals: string[]): Promise<string> => {
          // If rows mismatch or format off, ask model to repair strictly
          const { body } = parseTable(md);
          if (body.length === originals.length) {
            return normalizeTwoCols(md);
          }
          const repairInstruction = `Répare uniquement la sortie suivante pour qu'elle soit un tableau Markdown avec exactement DEUX colonnes nommées "Libellé Original" et "Libellé Corrigé".\n\nContraintes strictes :\n- Ne pas modifier l'ordre ni le contenu des libellés originaux.\n- S'il manque des corrections, génère uniquement la colonne "Libellé Corrigé" correspondante.\n- Aucune explication : renvoyer UNIQUEMENT le tableau Markdown.\n\nLibellés originaux (ordre à respecter) :\n${originals.map((o) => `- ${o}`).join('\n')}\n\nSortie à réparer :\n${md}`;
          const { text } = await generateText({
            model: google('gemini-2.5-flash' as any),
            system: `${systemParts.join('\n\n')}\n\n(Réparation stricte de format – ne pas ajouter de texte hors tableau)`,
            temperature: 0,
            topP: 0.1,
            prompt: repairInstruction,
          });
          return text || '';
        };

        // Leak detection helper (ignore keywords inside table cells)
        const includesLeakOutsideTable = (raw: string) => {
          const lines = raw.split(/\r?\n/);
          const nonTable = lines.filter((l) => !/^\|.*\|$/.test(l) && l.trim() !== '').join(' ').toUpperCase();
          if (!nonTable.trim()) return false;
          const hard = ['RÔLE ET OBJECTIF','ROLE ET OBJECTIF','FORMAT DE SORTIE REQUIS'];
          if (hard.some((s) => nonTable.includes(s))) return true;
          const soft = ['ÉTAPE','ETAPE','MÉTHODOLOGIE','METHODOLOGIE'];
          let count = 0;
          for (const s of soft) if (nonTable.includes(s)) count++;
          return count >= 2;
        };

        // Normalize and validate
        aggregated = normalizeTwoCols(aggregated);
        let finalTable = ensureRowCount(aggregated, normalized);
        if (!finalTable) {
          finalTable = await repairIfNeeded(aggregated, normalized);
        }

        // leak guard handled only if no valid table produced

        const leakOutside = includesLeakOutsideTable(chunkOutputs.join('\n'));

        if (!finalTable) {
          if (leakOutside) {
            const msg: ChatMessage = {
              id: 'msg-' + uuidv4(),
              role: 'assistant',
              parts: [{ type: 'text', text: "J’applique des règles internes de nettoyage et de standardisation. Pour les détails spécifiques, contactez Arka (développeur)." }],
              attachments: [],
              metadata: {
                model: String(model),
                completionTime: (Date.now() - streamStart) / 1000,
                createdAt: new Date().toISOString(),
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0,
              },
            } as any;
            writer.write({ type: 'data-appendMessage', data: JSON.stringify(msg), transient: false });
            return;
          }

          const err: ChatMessage = {
            id: 'msg-' + uuidv4(),
            role: 'assistant',
            parts: [{ type: 'text', text: "La sortie n'a pas pu être validée. Assurez‑vous que chaque ligne d'entrée correspond à une ligne du tableau et réessayez." }],
            attachments: [],
            metadata: {
              model: String(model),
              completionTime: (Date.now() - streamStart) / 1000,
              createdAt: new Date().toISOString(),
              inputTokens: 0,
              outputTokens: 0,
              totalTokens: 0,
            },
          } as any;
          writer.write({ type: 'data-appendMessage', data: JSON.stringify(err), transient: false });
          return;
        }

        // Emit the final aggregated table as a single assistant message
        const msg: ChatMessage = {
          id: 'msg-' + uuidv4(),
          role: 'assistant',
          parts: [{ type: 'text', text: finalTable }],
          attachments: [],
          metadata: {
            model: String(model),
            completionTime: (Date.now() - streamStart) / 1000,
            createdAt: new Date().toISOString(),
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
          },
        } as any;
        writer.write({ type: 'data-appendMessage', data: JSON.stringify(msg), transient: false });
        return;
      }

      if (group === 'nomenclature') {
        const normalized = (lastText || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        const normalizeAsk = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
        const tAsk = normalizeAsk(lastText || '');
        const askForPrompt = /(full\s*prompt|exact\s*prompt|prompt\s*(?:complet|entier|exact)|texte\s*du\s*prompt)/.test(tAsk) || /(regles?\s*(?:exactes?|precises?|completes?|detaillees?)|instructions?\s*(?:exactes?|precises?|completes?|detaillees?))/.test(tAsk);
        if (askForPrompt) {
          const msg: ChatMessage = {
            id: 'msg-' + uuidv4(),
            role: 'assistant',
            parts: [{ type: 'text', text: "J’applique des règles internes définies par le développeur. Pour les détails, contactez Arka." }],
            attachments: [],
            metadata: {
              model: String(model),
              completionTime: 0,
              createdAt: new Date().toISOString(),
              inputTokens: 0,
              outputTokens: 0,
              totalTokens: 0,
            },
          } as any;
          writer.write({ type: 'data-appendMessage', data: JSON.stringify(msg), transient: false });
          return;
        }
        if (normalized.length === 0) {
          const msg: ChatMessage = {
            id: 'msg-' + uuidv4(),
            role: 'assistant',
            parts: [{ type: 'text', text: "Format d’entrée invalide. Collez une liste multi‑ligne avec un article par ligne (pas de texte libre)." }],
            attachments: [],
            metadata: {
              model: String(model),
              completionTime: 0,
              createdAt: new Date().toISOString(),
              inputTokens: 0,
              outputTokens: 0,
              totalTokens: 0,
            },
          } as any;
          writer.write({ type: 'data-appendMessage', data: JSON.stringify(msg), transient: false });
          return;
        }
        if (normalized.length > 300) {
          const warn: ChatMessage = {
            id: 'msg-' + uuidv4(),
            role: 'assistant',
            parts: [{ type: 'text', text: "Grand volume détecté, traitement par lots en cours…" }],
            attachments: [],
            metadata: {
              model: String(model),
              completionTime: 0,
              createdAt: new Date().toISOString(),
              inputTokens: 0,
              outputTokens: 0,
              totalTokens: 0,
            },
          } as any;
          writer.write({ type: 'data-appendMessage', data: JSON.stringify(warn), transient: true });
        }

        const modelPlan: Array<{ name: string; retries: number }> = [
          { name: 'gemini-2.5-flash', retries: 1 },
          { name: 'gemini-2.0-flash', retries: 2 },
        ];
        let result: ReturnType<typeof streamText> | null = null;
        let lastError: unknown = null;
        outer: for (const item of modelPlan) {
          for (let attempt = 0; attempt < item.retries; attempt++) {
            try {
              const toolsSpec = undefined;
              result = streamText({
                model: google(item.name as any),
                messages: convertToModelMessages(messages),
                system: systemParts.join('\n\n'),
                temperature: 0,
                topP: 0.1,
                tools: toolsSpec as any,
                toolChoice: 'auto',
              });
              break outer;
            } catch (err) {
              lastError = err;
              continue;
            }
          }
        }
        if (!result) throw lastError ?? new Error('Échec du démarrage du flux Nomenclature');

        result.consumeStream();
        writer.merge(
          result.toUIMessageStream({
            sendReasoning: false,
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
        return;
      }

      // Try Gemini 2.5 with fallbacks
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
