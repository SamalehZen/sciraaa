import { tool } from 'ai';
import { z } from 'zod';
import { serverEnv } from '@/env/server';

function delay(ms: number) { return new Promise((res) => setTimeout(res, ms)); }
function jitter(base: number) { const j = base * 0.2; return base + (Math.random() * 2 - 1) * j; }
async function fetchWithTimeout(url: string, opts: RequestInit & { timeout?: number }) {
  const { timeout = 15000, ...rest } = opts || {};
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try { return await fetch(url, { ...rest, signal: controller.signal }); } finally { clearTimeout(id); }
}
async function retryWithBackoff<T>(fn: () => Promise<T>, attempts = 3) {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); } catch (err) { lastErr = err; const base = i === 0 ? 500 : i === 1 ? 1000 : 2000; await delay(jitter(base)); }
  }
  throw lastErr;
}

function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.split('/')[1] || null;
    }
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return v;
      const parts = u.pathname.split('/');
      const last = parts[parts.length - 1];
      if (last) return last;
    }
    return null;
  } catch {
    return null;
  }
}

function toThumb(videoId: string | null) {
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : undefined;
}

async function exaYouTubeSearch(query: string, max: number) {
  const body = JSON.stringify({
    query: `site:youtube.com/watch ${query}`,
    numResults: Math.min(max, 7),
    type: 'neural',
    useAutoprompt: false,
  });
  const res = await fetchWithTimeout('https://api.exa.ai/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': serverEnv.EXA_API_KEY || '' },
    body,
    timeout: 15000,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`EXA_${res.status}: ${text || res.statusText}`);
  }
  const data = await res.json();
  const items: any[] = data.results || [];
  return items.map((it) => {
    const url: string = it.url || it.link || '';
    const videoId = extractVideoId(url);
    return {
      videoId: videoId || url,
      url,
      details: {
        title: it.title || 'YouTube Video',
        author_name: it.author || it.channel || undefined,
        author_url: it.author_url || undefined,
        thumbnail_url: toThumb(videoId),
        provider_name: 'YouTube',
        provider_url: 'https://youtube.com',
      },
      views: it.viewCount ? String(it.viewCount) : undefined,
      likes: undefined,
      summary: it.snippet || it.text || undefined,
      publishedDate: it.publishedDate || it.date || undefined,
    };
  });
}

async function parallelYouTubeSearch(query: string, max: number) {
  const body = JSON.stringify({ query: `site:youtube.com/watch ${query}`, maxResults: Math.min(max, 7) });
  const res = await fetchWithTimeout('https://api.parallelai.dev/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serverEnv.PARALLEL_API_KEY || ''}` },
    body,
    timeout: 15000,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`PARALLEL_${res.status}: ${text || res.statusText}`);
  }
  const data = await res.json();
  const items: any[] = data.results || [];
  return items.map((it) => {
    const url: string = it.url || it.link || '';
    const videoId = extractVideoId(url);
    return {
      videoId: videoId || url,
      url,
      details: {
        title: it.title || 'YouTube Video',
        author_name: it.author || it.channel || undefined,
        author_url: it.author_url || undefined,
        thumbnail_url: toThumb(videoId),
        provider_name: 'YouTube',
        provider_url: 'https://youtube.com',
      },
      views: it.viewCount ? String(it.viewCount) : undefined,
      likes: undefined,
      summary: it.snippet || it.text || undefined,
      publishedDate: it.publishedDate || it.date || undefined,
    };
  });
}

export const youtubeSearchTool = tool({
  description: 'Search YouTube videos',
  inputSchema: z.object({ query: z.string() }),
  execute: async ({ query }) => {
    const max = 7;
    let items: any[] = [];
    let used: 'exa' | 'parallel' | null = null;

    try {
      if (!serverEnv.EXA_API_KEY) throw new Error('EXA_MISSING_KEY');
      items = await retryWithBackoff(() => exaYouTubeSearch(query, max), 3);
      used = 'exa';
    } catch (e1) {
      if (serverEnv.PARALLEL_API_KEY) {
        try {
          items = await retryWithBackoff(() => parallelYouTubeSearch(query, max), 3);
          used = 'parallel';
        } catch (e2) {
          return {
            results: [],
            error: {
              code: 'SEARCH_FAILED',
              provider: used ?? 'exa',
              attempts: 3,
              message: 'Sorry, we could not load YouTube results. Please try again.',
            },
          };
        }
      } else {
        return {
          results: [],
          error: {
            code: 'SEARCH_FAILED',
            provider: 'exa',
            attempts: 3,
            message: 'Sorry, we could not load YouTube results. Please try again.',
          },
        };
      }
    }

    // Limit and sort as-is (provider relevance)
    const results = items.slice(0, max);
    return { results, meta: { provider: used } };
  },
});
