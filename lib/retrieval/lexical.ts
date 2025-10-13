import { loadTaxonomy, Leaf } from '@/lib/taxonomy';
import { normalizeTitle } from './normalize';

type Posting = { doc: number; tf: number };

type Index = {
  leaves: Leaf[];
  postings: Map<string, Posting[]>; // token -> postings
  docLengths: number[]; // per doc
  avgDocLen: number;
  idf: Map<string, number>; // token -> idf
  leafKeyByDoc: string[]; // index -> leafKey
};

let GLOBAL_INDEX: Index | null = null;

function tokenizeLabel(label: string): string[] {
  const { normalized } = normalizeTitle(label);
  return normalized.split(' ').filter(Boolean);
}

function buildIndex(): Index {
  const taxonomy = loadTaxonomy();
  const leaves = taxonomy.leaves;

  const postings = new Map<string, Posting[]>();
  const docLengths: number[] = [];
  const leafKeyByDoc: string[] = [];

  for (let i = 0; i < leaves.length; i++) {
    const leaf = leaves[i];
    leafKeyByDoc.push(leaf.leafKey);
    // build a short path string emphasizing sous-famille and famille
    const fields = [leaf.sousFamille.name, leaf.famille.name, leaf.rayon.name, leaf.sector.name];
    const tokens = Array.from(new Set(fields.flatMap(tokenizeLabel)));

    docLengths[i] = tokens.length || 1;

    for (const t of tokens) {
      let arr = postings.get(t);
      if (!arr) {
        arr = [];
        postings.set(t, arr);
      }
      const last = arr[arr.length - 1];
      if (last && last.doc === i) {
        last.tf += 1;
      } else {
        arr.push({ doc: i, tf: 1 });
      }
    }
  }

  const N = leaves.length;
  const avgDocLen = docLengths.reduce((a, b) => a + b, 0) / Math.max(1, N);
  const idf = new Map<string, number>();
  for (const [term, arr] of postings) {
    const df = arr.length;
    const val = Math.log(1 + (N - df + 0.5) / (df + 0.5));
    idf.set(term, val);
  }

  return { leaves, postings, docLengths, avgDocLen, idf, leafKeyByDoc };
}

function ensureIndex(): Index {
  if (!GLOBAL_INDEX) GLOBAL_INDEX = buildIndex();
  return GLOBAL_INDEX;
}

export type LexicalHit = { leafKey: string; score: number };

export function lexicalSearch(query: string, topN: number = 300): LexicalHit[] {
  const idx = ensureIndex();
  const { tokens } = normalizeTitle(query);
  if (!tokens.length) return [];

  const k1 = 1.5;
  const b = 0.75;

  const scores = new Map<number, number>();

  for (const t of tokens) {
    const idf = idx.idf.get(t) ?? 0;
    const postings = idx.postings.get(t);
    if (!postings) continue;
    for (const p of postings) {
      const dl = idx.docLengths[p.doc];
      const tf = p.tf;
      const denom = tf + k1 * (1 - b + (b * dl) / idx.avgDocLen);
      const s = idf * ((tf * (k1 + 1)) / denom);
      scores.set(p.doc, (scores.get(p.doc) ?? 0) + s);
    }
  }

  const hits: LexicalHit[] = [];
  scores.forEach((score, doc) => {
    hits.push({ leafKey: idx.leafKeyByDoc[doc], score });
  });

  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, topN);
}
