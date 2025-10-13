import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

export type AdjudicationInputItem = {
  id: string;
  titleNormalized: string;
  candidates: Array<{
    sector_code: string; sector_name: string;
    rayon_code: string; rayon_name: string;
    famille_code: string; famille_name: string;
    sous_famille_code: string; sous_famille_name: string;
    full_path: string;
    scores: { lexical: number; cosine: number; fused: number };
  }>;
};

export type AdjudicationOutput = Array<{
  id: string;
  sector_code: string; sector_name: string;
  rayon_code: string; rayon_name: string;
  famille_code: string; famille_name: string;
  sous_famille_code: string; sous_famille_name: string;
  full_path: string;
  source_scores: { lexical: number; cosine: number; fused: number };
}>;

const DEFAULTS = { B: 25, CONCURRENCY: 4, MODEL: 'gemini-2.5-flash' } as const;

const itemSchema = z.object({
  id: z.string(),
  sector_code: z.string(),
  sector_name: z.string(),
  rayon_code: z.string(),
  rayon_name: z.string(),
  famille_code: z.string(),
  famille_name: z.string(),
  sous_famille_code: z.string(),
  sous_famille_name: z.string(),
  full_path: z.string(),
  source_scores: z.object({ lexical: z.number(), cosine: z.number(), fused: z.number() }),
});

const batchSchema = z.object({ results: z.array(itemSchema) });

function buildPrompt(batch: AdjudicationInputItem[]) {
  const header = [
    'Vous êtes un système de validation de classification d\'articles. Règles STRICTES:',
    '- Pour chaque item, CHOISISSEZ EXCLUSIVEMENT UNE sous-famille parmi les candidats fournis.',
    '- INTERDICTION ABSOLUE d\'inventer une autre catégorie.',
    '- Travaillez uniquement sur le titre normalisé.',
    '- Répondez en JSON STRICT UNIQUEMENT, SANS MARKDOWN.',
  ].join('\n');

  const items = batch.map((it) => ({
    id: it.id,
    title: it.titleNormalized,
    candidates: it.candidates.map((c, idx) => ({
      rank: idx + 1,
      sector_code: c.sector_code, sector_name: c.sector_name,
      rayon_code: c.rayon_code, rayon_name: c.rayon_name,
      famille_code: c.famille_code, famille_name: c.famille_name,
      sous_famille_code: c.sous_famille_code, sous_famille_name: c.sous_famille_name,
      full_path: c.full_path,
      scores: c.scores,
    })),
  }));

  return `${header}\n\n${JSON.stringify({ items }, null, 2)}`;
}

export async function adjudicate(items: AdjudicationInputItem[], opts?: Partial<typeof DEFAULTS>) {
  const { B, CONCURRENCY, MODEL } = { ...DEFAULTS, ...(opts || {}) };

  const batches: AdjudicationInputItem[][] = [];
  for (let i = 0; i < items.length; i += B) batches.push(items.slice(i, i + B));

  const results: AdjudicationOutput = [];
  let inputTokens = 0;
  let outputTokens = 0;

  // simple concurrency control
  let idx = 0;
  async function next() {
    if (idx >= batches.length) return;
    const myIdx = idx++;
    const batch = batches[myIdx];
    const system = 'Vous êtes un validateur rapide et précis.';
    const prompt = buildPrompt(batch);

    const { object, usage } = await generateObject({
      model: google(MODEL as any),
      system,
      prompt,
      schema: batchSchema,
      mode: 'json',
    });

    inputTokens += usage?.inputTokens ?? 0;
    outputTokens += usage?.outputTokens ?? 0;

    // Map back to include selected candidate scores
    for (const r of object.results) {
      results.push(r);
    }

    await next();
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, batches.length) }, () => next());
  await Promise.all(workers);

  return { results, tokens: { input: inputTokens, output: outputTokens, total: inputTokens + outputTokens } };
}
