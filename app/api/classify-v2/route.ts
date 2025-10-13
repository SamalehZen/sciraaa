import { NextRequest } from 'next/server';
import { z } from 'zod';
import { normalizeTitle } from '@/lib/retrieval/normalize';
import { getCandidatesForTitle } from '@/lib/retrieval/candidates';
import { adjudicate } from '@/lib/llm/adjudicate';

const BodySchema = z.object({
  items: z.array(z.object({ id: z.string(), title: z.string() })).min(1),
});

class LRU<V> {
  private max: number;
  private ttl: number;
  private map = new Map<string, { v: V; t: number }>();
  constructor(max = 2000, ttlMs = 10 * 60 * 1000) { this.max = max; this.ttl = ttlMs; }
  get(k: string): V | undefined {
    const e = this.map.get(k);
    if (!e) return undefined;
    if (Date.now() - e.t > this.ttl) { this.map.delete(k); return undefined; }
    this.map.delete(k); this.map.set(k, { v: e.v, t: Date.now() });
    return e.v;
  }
  set(k: string, v: V) {
    if (this.map.size >= this.max) { const firstKey = this.map.keys().next().value; if (firstKey) this.map.delete(firstKey); }
    this.map.set(k, { v, t: Date.now() });
  }
}

const retrievalCache = new LRU<any>(2000, 30 * 60 * 1000);

export async function POST(req: NextRequest) {
  const started = Date.now();
  let payload: z.infer<typeof BodySchema>;
  try {
    const json = await req.json();
    payload = BodySchema.parse(json);
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'invalid_body', message: e?.message || 'Invalid input' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }

  const items = payload.items.slice(0, 500);

  const normStart = Date.now();
  const normalized = items.map((it) => ({ id: it.id, rawTitle: it.title, norm: normalizeTitle(it.title).normalized }));

  const retStart = Date.now();
  const candidatePromises = normalized.map(async (it) => {
    const cacheKey = it.norm;
    let c = retrievalCache.get(cacheKey);
    if (!c) {
      c = await getCandidatesForTitle(cacheKey);
      retrievalCache.set(cacheKey, c);
    }
    return { id: it.id, titleNormalized: it.norm, candidates: c.map((x) => ({
      sector_code: x.sector_code,
      sector_name: x.sector_name,
      rayon_code: x.rayon_code,
      rayon_name: x.rayon_name,
      famille_code: x.famille_code,
      famille_name: x.famille_name,
      sous_famille_code: x.sous_famille_code,
      sous_famille_name: x.sous_famille_name,
      full_path: x.full_path,
      scores: x.scores,
    })) };
  });

  const itemsWithCandidates = await Promise.all(candidatePromises);
  const retrievalMs = Date.now() - retStart;

  const llmStart = Date.now();
  const { results, tokens } = await adjudicate(itemsWithCandidates);
  const llmMs = Date.now() - llmStart;

  const totalMs = Date.now() - started;

  const rankCounts: Record<string, number> = {};
  for (const r of results) {
    // find rank by matching chosen to candidate fused ordering (we sent in rank order already)
    const item = itemsWithCandidates.find((i) => i.id === r.id);
    let rank = 0;
    if (item) {
      rank = (item.candidates.findIndex((c) => c.full_path === r.full_path && c.sous_famille_code === r.sous_famille_code) + 1) || 0;
    }
    const k = String(rank || '0');
    rankCounts[k] = (rankCounts[k] || 0) + 1;
  }

  console.log('[classify-v2] timings', { retrievalMs, llmMs, totalMs, items: items.length, rankCounts });

  return new Response(
    JSON.stringify({ results, timings: { retrievalMs, llmMs, totalMs }, tokens }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
}
