// /app/api/search/full/route.ts
import { convertToModelMessages, generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { after } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { geolocation } from '@vercel/functions';

import { getLightweightUser, generateTitleFromUserMessage, getGroupConfig } from '@/app/actions';
import { getChatById, saveChat, updateChatTitleById, saveMessages, getMessageById } from '@/lib/db/queries';
import type { ChatMessage } from '@/lib/types';

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
  const { latitude, longitude } = geolocation(req);

  // Ensure user (authenticated or anonymous via cookie) exists
  const lightweightUser = await getLightweightUser();
  const userId = lightweightUser?.userId;

  // Ensure chat exists and title generation (same as /api/search)
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

  // Save the last user message if not already persisted (avoid duplicates on fallback)
  if (userId && messages?.length) {
    const lastUser = messages[messages.length - 1];
    if (lastUser?.role === 'user' && lastUser?.id) {
      try {
        const existing = await getMessageById({ id: lastUser.id });
        if (!existing || existing.length === 0) {
          await saveMessages({
            messages: [
              {
                chatId: id,
                id: lastUser.id,
                role: 'user',
                parts: lastUser.parts,
                attachments: (lastUser as any).experimental_attachments ?? [],
                createdAt: new Date(),
                model,
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0,
                completionTime: 0,
              },
            ],
          });
        }
      } catch {}
    }
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

  // Build system instructions
  const { instructions } = await getGroupConfig(group);
  const systemParts: string[] = [];
  if (instructions) systemParts.push(instructions);
  if (autoContext) systemParts.push(autoContext);
  if (latitude && longitude) systemParts.push(`User location (approx): ${latitude}, ${longitude}`);

  // Try Gemini models with fallback
  const modelNames = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-exp'] as const;
  let result: Awaited<ReturnType<typeof generateText>> | null = null;
  let lastError: unknown = null;

  const genStart = Date.now();
  for (const name of modelNames) {
    try {
      result = await generateText({
        model: google(name as any),
        messages: convertToModelMessages(messages),
        system: systemParts.join('\n\n'),
      });
      break;
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  if (!result) {
    return new Response(JSON.stringify({ error: 'Failed to generate response', details: String(lastError) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  const processingTimeSec = (Date.now() - genStart) / 1000;
  const createdAt = new Date().toISOString();
  const usage = result.usage || {} as any;

  const assistantMessage: ChatMessage = {
    id: 'msg-' + uuidv4(),
    role: 'assistant',
    parts: [
      {
        type: 'text',
        text: result.text || '',
      } as any,
    ],
    metadata: {
      model: String(model),
      completionTime: processingTimeSec,
      createdAt,
      totalTokens: usage.totalTokens ?? null,
      inputTokens: usage.inputTokens ?? null,
      outputTokens: usage.outputTokens ?? null,
    },
  } as ChatMessage;

  // Persist assistant message like streaming onFinish
  if (userId) {
    try {
      await saveMessages({
        messages: [
          {
            id: assistantMessage.id,
            role: 'assistant',
            parts: assistantMessage.parts as any,
            createdAt: new Date(),
            attachments: [],
            chatId: id,
            model,
            completionTime: assistantMessage.metadata?.completionTime ?? 0,
            inputTokens: assistantMessage.metadata?.inputTokens ?? 0,
            outputTokens: assistantMessage.metadata?.outputTokens ?? 0,
            totalTokens: assistantMessage.metadata?.totalTokens ?? 0,
          },
        ],
      });
    } catch {}
  }

  const completionTime = (Date.now() - requestStart) / 1000;
  // Align top-level metadata completionTime with total time if desired; keep assistantMessage.metadata as generation time

  const responseBody = {
    ...assistantMessage,
    metadata: {
      ...assistantMessage.metadata,
      completionTime: completionTime,
    },
  };

  return new Response(JSON.stringify(responseBody), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
