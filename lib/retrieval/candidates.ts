import { lexicalSearch } from './lexical';
import { loadLeafEmbeddings, embedTitleNormalized, cosineSimilarity } from './embeddings';
import { loadTaxonomy } from '@/lib/taxonomy';

export type Candidate = {
  leafKey: string;
  leafId: string;
  sector_code: string;
  sector_name: string;
  rayon_code: string;
  rayon_name: string;
  famille_code: string;
  famille_name: string;
  sous_famille_code: string;
  sous_famille_name: string;
  full_path: string;
  scores: { lexical: number; cosine: number; fused: number };
};

const DEFAULTS = {
  W_E: 0.65,
  W_L: 0.35,
  K: 5,
  TOP_N_COSINE: 200,
};

export async function getCandidatesForTitle(normalizedTitle: string, opts?: Partial<typeof DEFAULTS>): Promise<Candidate[]> {
  const { W_E, W_L, K, TOP_N_COSINE } = { ...DEFAULTS, ...(opts || {}) };
  const taxonomy = loadTaxonomy();
  const lexHits = lexicalSearch(normalizedTitle, TOP_N_COSINE);
  const leafEmb = loadLeafEmbeddings();

  let titleVec: Float32Array | null = null;
  if (leafEmb) {
    titleVec = await embedTitleNormalized(normalizedTitle);
  }

  const arr: Candidate[] = [];
  for (const hit of lexHits) {
    const leaf = taxonomy.leaves.find((l) => l.leafKey === hit.leafKey);
    if (!leaf) continue;
    const cosine = leafEmb && titleVec ? (() => {
      const v = leafEmb.vectors.get(leaf.leafKey);
      if (!v) return 0;
      return cosineSimilarity(titleVec!, v);
    })() : 0;

    arr.push({
      leafKey: leaf.leafKey,
      leafId: leaf.leafId,
      sector_code: leaf.sector.code,
      sector_name: leaf.sector.name,
      rayon_code: leaf.rayon.code,
      rayon_name: leaf.rayon.name,
      famille_code: leaf.famille.code,
      famille_name: leaf.famille.name,
      sous_famille_code: leaf.sousFamille.code,
      sous_famille_name: leaf.sousFamille.name,
      full_path: leaf.fullPath,
      scores: { lexical: hit.score, cosine, fused: 0 },
    });
  }

  if (!arr.length) return arr;

  // min-max normalization for lexical and cosine
  const lexVals = arr.map((c) => c.scores.lexical);
  const cosVals = arr.map((c) => c.scores.cosine);
  const minLex = Math.min(...lexVals);
  const maxLex = Math.max(...lexVals);
  const minCos = Math.min(...cosVals);
  const maxCos = Math.max(...cosVals);

  for (const c of arr) {
    const l = maxLex > minLex ? (c.scores.lexical - minLex) / (maxLex - minLex) : 0;
    const e = maxCos > minCos ? (c.scores.cosine - minCos) / (maxCos - minCos) : 0;
    c.scores.fused = W_E * e + W_L * l;
    c.scores.lexical = l;
    c.scores.cosine = e;
  }

  arr.sort((a, b) => b.scores.fused - a.scores.fused);
  return arr.slice(0, K);
}
