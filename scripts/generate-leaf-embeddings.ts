#!/usr/bin/env ts-node
import fs from 'fs';
import path from 'path';
import { google } from '@ai-sdk/google';
import { embedMany } from 'ai';
import { loadTaxonomy } from '../lib/taxonomy';

async function main() {
  let model = process.env.EMBED_MODEL || 'text-embedding-004';
  const outPath = path.join(process.cwd(), 'data', 'leaf-embeddings.json');
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.error('Missing GOOGLE_GENERATIVE_AI_API_KEY in environment. Aborting.');
    process.exit(2);
  }
  const taxonomy = loadTaxonomy();

  const values = taxonomy.leaves.map((l) => l.fullPath);
  const B = 100;
  const vectors: number[][] = [];

  for (let i = 0; i < values.length; i += B) {
    const batch = values.slice(i, i + B);
    process.stdout.write(`Embedding leaves ${i + 1}-${Math.min(i + B, values.length)} / ${values.length} using ${model}...\n`);
    try {
      const { embeddings } = await embedMany({ model: google.embedding(model as any), values: batch });
      if (i === 0) {
        console.log('sample embedding shape', embeddings?.[0] && Object.keys(embeddings[0]));
        // @ts-ignore
        console.log('sample embedding length', embeddings?.[0]?.embedding?.length || embeddings?.[0]?.vector?.length);
      }
      // @ts-ignore unify formats: array<number> or { embedding:number[] }
      embeddings.forEach((e: any) => vectors.push(Array.isArray(e) ? e : (e.embedding || e.vector)));

    } catch (e) {
      // Fallback chain for Google embeddings naming
      const fallbacks = model === 'text-embedding-004' ? ['embedding-001', 'gemini-embedding-1'] : ['text-embedding-004', 'embedding-001'];
      let success = false;
      for (const alt of fallbacks) {
        try {
          process.stdout.write(`Fallback to ${alt}...\n`);
          const { embeddings } = await embedMany({ model: google.embedding(alt as any), values: batch });
          embeddings.forEach((x) => vectors.push(x.embedding));
          model = alt;
          success = true;
          break;
        } catch {}
      }
      if (!success) throw e;
    }
  }

  const dim = vectors[0]?.length || 0;
  const rows = taxonomy.leaves.map((l, i) => ({
    leafId: l.leafId,
    leafKey: l.leafKey,
    fullPath: l.fullPath,
    labels: { sector: l.sector.name, rayon: l.rayon.name, famille: l.famille.name, sousFamille: l.sousFamille.name },
    vector: vectors[i],
  }));

  const file = { model, dim, taxonomyHash: taxonomy.taxonomyHash, createdAt: new Date().toISOString(), vectors: rows };
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(file));
  console.log('Wrote', outPath, 'with', rows.length, 'vectors', `dim=${dim}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
