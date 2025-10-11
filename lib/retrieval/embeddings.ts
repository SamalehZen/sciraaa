import fs from 'fs';
import path from 'path';
import { embedMany, embed } from 'ai';
import { google } from '@ai-sdk/google';
import { loadTaxonomy } from '@/lib/taxonomy';

export type LeafEmbeddingRow = {
  leafId: string;
  leafKey: string;
  fullPath: string;
  labels: { sector: string; rayon: string; famille: string; sousFamille: string };
  vector: number[];
};

export type LeafEmbeddingsFile = {
  model: string;
  dim: number;
  taxonomyHash: string;
  createdAt: string;
  vectors: LeafEmbeddingRow[];
};

export type LeafEmbeddings = {
  model: string;
  dim: number;
  taxonomyHash: string;
  vectors: Map<string, Float32Array>; // leafKey -> vector
};

const ROOT = process.cwd();
const LEAF_EMBEDDINGS_PATH = path.join(ROOT, 'data', 'leaf-embeddings.json');

let LEAF_EMB: LeafEmbeddings | null = null;

export function loadLeafEmbeddings(): LeafEmbeddings | null {
  if (LEAF_EMB) return LEAF_EMB;
  if (!fs.existsSync(LEAF_EMBEDDINGS_PATH)) return null;
  try {
    const raw = fs.readFileSync(LEAF_EMBEDDINGS_PATH, 'utf-8');
    const data = JSON.parse(raw) as LeafEmbeddingsFile;
    if (!data?.vectors?.length) return null;

    const taxonomy = loadTaxonomy();
    if (data.taxonomyHash !== taxonomy.taxonomyHash) {
      console.warn('[leaf-embeddings] taxonomy hash mismatch — please regenerate embeddings');
    }

    const vmap = new Map<string, Float32Array>();
    for (const row of data.vectors) {
      vmap.set(row.leafKey, Float32Array.from(row.vector));
    }

    LEAF_EMB = { model: data.model, dim: data.dim, taxonomyHash: data.taxonomyHash, vectors: vmap };
    return LEAF_EMB;
  } catch (e) {
    console.error('[leaf-embeddings] failed to load:', e);
    return null;
  }
}

// simple in-memory LRU with TTL for title embeddings
class LRU<V> {
  private max: number;
  private ttl: number;
  private map = new Map<string, { v: V; t: number }>();
  constructor(max = 2000, ttlMs = 10 * 60 * 1000) {
    this.max = max;
    this.ttl = ttlMs;
  }
  get(k: string): V | undefined {
    const e = this.map.get(k);
    if (!e) return undefined;
    if (Date.now() - e.t > this.ttl) {
      this.map.delete(k);
      return undefined;
    }
    // bump
    this.map.delete(k);
    this.map.set(k, { v: e.v, t: Date.now() });
    return e.v;
  }
  set(k: string, v: V) {
    if (this.map.size >= this.max) {
      // delete oldest
      const firstKey = this.map.keys().next().value;
      if (firstKey) this.map.delete(firstKey);
    }
    this.map.set(k, { v, t: Date.now() });
  }
}

const titleEmbCache = new LRU<Float32Array>(1000, 30 * 60 * 1000);

export async function embedTitleNormalized(normalizedTitle: string, model = 'text-embedding-004'): Promise<Float32Array> {
  const cached = titleEmbCache.get(normalizedTitle);
  if (cached) return cached;
  try {
    const { embeddings } = await embed({ model: google.embedding(model as any), value: normalizedTitle });
    const vec = Float32Array.from(embeddings[0].embedding);
    titleEmbCache.set(normalizedTitle, vec);
    return vec;
  } catch (e) {
    const fallbacks = model === 'text-embedding-004' ? ['embedding-001', 'gemini-embedding-1'] : ['text-embedding-004', 'embedding-001'];
    for (const alt of fallbacks) {
      try {
        const { embeddings } = await embed({ model: google.embedding(alt as any), value: normalizedTitle });
        const vec = Float32Array.from(embeddings[0].embedding);
        titleEmbCache.set(normalizedTitle, vec);
        return vec;
      } catch {}
    }
    // as last resort return zero vector of dim 0
    return new Float32Array();
  }
}

export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length && i < b.length; i++) {
    const x = a[i];
    const y = b[i];
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
