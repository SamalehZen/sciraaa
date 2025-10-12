import { tool } from 'ai';
import { z } from 'zod';
import type { UIMessageStreamWriter } from 'ai';
import type { ChatMessage } from '../types';
import { serverEnv } from '@/env/server';

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

function jitter(base: number) {
  const j = base * 0.2;
  return base + (Math.random() * 2 - 1) * j;
}

async function fetchWithTimeout(url: string, opts: RequestInit & { timeout?: number }) {
  const { timeout = 15000, ...rest } = opts || {};
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...rest, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

type Provider = 'exa' | 'parallel';

async function retryWithBackoff<T>(fn: () => Promise<T>, attempts = 3) {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const base = i === 0 ? 500 : i === 1 ? 1000 : 2000;
      await delay(jitter(base));
    }
  }
  throw lastErr;
}

function normalizeWebResults(items: any[] = []) {
  return (items || []).map((r: any) => ({
    url: r.url || r.link || '',
    title: r.title || r.name || r.pageTitle || 'Untitled',
    content: r.text || r.snippet || r.preview || r.content || '',
    published_date: r.publishedDate || r.published_time || r.date || undefined,
    author: r.author || r.byline || undefined,
  })).filter((r) => !!r.url);
}

async function exaWebSearch(query: string, max: number) {
  const body = JSON.stringify({ query, numResults: Math.min(max, 7), type: 'neural', useAutoprompt: false });
  const res = await fetchWithTimeout('https://api.exa.ai/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': serverEnv.EXA_API_KEY || '',
    },
    body,
    timeout: 15000,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`EXA_${res.status}: ${text || res.statusText}`);
  }
  const data = await res.json();
  const results = normalizeWebResults(data.results || data?.value || []);
  return { results, images: [] as Array<{ url: string; description: string }> };
}

async function parallelWebSearch(query: string, max: number) {
  const body = JSON.stringify({ query, maxResults: Math.min(max, 7) });
  const res = await fetchWithTimeout('https://api.parallelai.dev/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serverEnv.PARALLEL_API_KEY || ''}`,
    },
    body,
    timeout: 15000,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`PARALLEL_${res.status}: ${text || res.statusText}`);
  }
  const data = await res.json();
  const results = normalizeWebResults(data.results || data?.value || []);
  const images = Array.isArray(data.images)
    ? (data.images as any[])
        .slice(0, 10)
        .map((img: any) => ({ url: img.url || img.src || '', description: img.alt || img.description || '' }))
        .filter((i) => !!i.url)
    : [];
  return { results, images };
}

export function webSearchTool(
  dataStream?: UIMessageStreamWriter<ChatMessage>,
  preferredProvider?: 'exa' | 'parallel' | 'tavily' | 'firecrawl',
) {
  return tool({
    description: 'Search across the web and return sources and images',
    inputSchema: z.object({
      queries: z.array(z.string()),
      maxResults: z.array(z.number()).optional(),
      topics: z.array(z.enum(['general', 'news'])).optional(),
      quality: z.array(z.enum(['default', 'best'])).optional(),
    }),
    execute: async ({ queries, maxResults }) => {
      const searches: Array<{ query: string; results: any[]; images: any[] }> = [];
      const providerPreference: Provider = preferredProvider === 'exa' ? 'exa' : preferredProvider === 'parallel' ? 'parallel' : 'exa';
      const canUseParallel = Boolean(serverEnv.PARALLEL_API_KEY);

      for (let i = 0; i < queries.length; i++) {
        const q = queries[i];
        const max = Math.max(1, Math.min(7, (maxResults && maxResults[i]) || 7));

        if (dataStream) {
          dataStream.data('query_completion', {
            query: q,
            index: i,
            total: queries.length,
            status: 'started',
            resultsCount: 0,
            imagesCount: 0,
          });
        }

        let used: Provider | null = null;
        let out: { results: any[]; images: any[] } = { results: [], images: [] };
        let error: any = null;

        const tryProvider = async (prov: Provider) => {
          if (prov === 'exa') {
            if (!serverEnv.EXA_API_KEY) throw new Error('EXA_MISSING_KEY');
            return await retryWithBackoff(() => exaWebSearch(q, max), 3);
          }
          if (prov === 'parallel') {
            if (!serverEnv.PARALLEL_API_KEY) throw new Error('PARALLEL_MISSING_KEY');
            return await retryWithBackoff(() => parallelWebSearch(q, max), 3);
          }
          throw new Error('UNSUPPORTED_PROVIDER');
        };

        try {
          out = await tryProvider(providerPreference);
          used = providerPreference;
        } catch (e1) {
          error = e1;
          if (canUseParallel && providerPreference !== 'parallel') {
            try {
              out = await tryProvider('parallel');
              used = 'parallel';
            } catch (e2) {
              error = e2;
            }
          }
        }

        const finalResults = (out.results || []).slice(0, max);
        const finalImages = out.images || [];

        if (dataStream) {
          dataStream.data('query_completion', {
            query: q,
            index: i,
            total: queries.length,
            status: finalResults.length > 0 ? 'completed' : 'error',
            resultsCount: finalResults.length,
            imagesCount: finalImages.length,
          });
        }

        searches.push({ query: q, results: finalResults, images: finalImages });
      }

      return { searches };
    },
  });
}
