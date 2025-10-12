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

function normalizeAcademic(results: any[] = []) {
  return (results || []).map((r: any) => ({
    title: r.title || r.name || 'Untitled',
    url: r.url || r.link || '',
    author: (Array.isArray(r.authors) ? r.authors.join('; ') : r.author) || null,
    publishedDate: r.publishedDate || r.year || r.date || undefined,
    summary: r.text || r.abstract || r.snippet || r.summary || '',
  })).filter((x) => !!x.url);
}

async function exaAcademicSearch(query: string, max: number) {
  const body = JSON.stringify({ query, numResults: Math.min(max, 7), type: 'neural', category: 'scholar', useAutoprompt: false });
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
  return normalizeAcademic(data.results || []);
}

async function parallelAcademicSearch(query: string, max: number) {
  const body = JSON.stringify({ query, maxResults: Math.min(max, 7), domain: 'scholar' });
  const res = await fetchWithTimeout('https://api.parallelai.dev/academic-search', {
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
  return normalizeAcademic(data.results || []);
}

export const academicSearchTool = tool({
  description: 'Search academic papers and scholarly sources',
  inputSchema: z.object({ query: z.string().describe('Search query') }),
  execute: async ({ query }) => {
    const max = 7;
    let results: any[] = [];
    let used: 'exa' | 'parallel' | null = null;

    // Try Exa first with retries
    try {
      if (!serverEnv.EXA_API_KEY) throw new Error('EXA_MISSING_KEY');
      results = await retryWithBackoff(() => exaAcademicSearch(query, max), 3);
      used = 'exa';
    } catch (e1) {
      // Fallback to Parallel if configured
      if (serverEnv.PARALLEL_API_KEY) {
        try {
          results = await retryWithBackoff(() => parallelAcademicSearch(query, max), 3);
          used = 'parallel';
        } catch (e2) {
          // Both failed, return structured error
          return {
            results: [],
            error: {
              code: 'SEARCH_FAILED',
              provider: used ?? 'exa',
              attempts: 3,
              message: 'Sorry, we could not load academic results. Please try again.',
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
            message: 'Sorry, we could not load academic results. Please try again.',
          },
        };
      }
    }

    return { results: results.slice(0, max), meta: { provider: used } };
  },
});
