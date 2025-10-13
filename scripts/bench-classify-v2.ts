import { normalizeTitle } from '../lib/retrieval/normalize';
import { getCandidatesForTitle } from '../lib/retrieval/candidates';
import { adjudicate } from '../lib/llm/adjudicate';

function sampleTitles(n = 100): { id: string; title: string }[] {
  const seeds = [
    'Coca-Cola 6x33cl',
    'Eau minérale gazeuse 1.5L',
    'Yaourt nature 4x125g',
    'Beurre doux 250g',
    'Biscottes complètes',
    'Chips nature 150g',
    'Jus d’orange 1L',
    'Thé vert sachets',
    'Café moulu 250g',
    'Riz basmati 1kg',
    'Pâtes penne 500g',
    'Sauce tomate basilic',
    'Confiture fraise',
    'Miel d’acacia',
    'Chocolat noir 70%',
    'Biscuits apéritifs cacahuète',
    'Lait demi-écrémé 1L',
    'Fromage camembert 250g',
    'Sardines à l’huile',
    'Thon au naturel',
    'Haricots verts conserve',
    'Pois chiches bocal',
    'Huile d’olive vierge',
    'Vinaigre balsamique',
    'Moutarde de Dijon',
    'Mayonnaise',
    'Cornichons fins',
    'Sel fin iodé',
    'Poivre noir moulu',
    'Épices curry',
    'Farine de blé T55',
    'Sucre en poudre',
    'Levure chimique',
    'Pâtes à tartiner cacao',
    'Compote pomme gourde',
    'Sirop de grenadine',
    'Bâtonnets glacés',
    'Glace vanille bac',
    'Pizza surgelée 4 fromages',
    'Frites surgelées',
    'Poulet rôti',
    'Saucisse de Toulouse',
    'Steak haché frais',
    'Saumon fumé',
    'Oeufs x12',
    'Pain de mie complet',
    'Céréales chocolat',
    'Barres céréalières',
    'Litière chat compacte',
    'Croquettes chien adulte',
  ];
  const arr: { id: string; title: string }[] = [];
  for (let i = 0; i < n; i++) arr.push({ id: String(i + 1), title: seeds[i % seeds.length] });
  return arr;
}

async function main() {
  const items = sampleTitles(100);
  const start = Date.now();

  const normed = items.map((it) => ({ id: it.id, titleNormalized: normalizeTitle(it.title).normalized }));
  const tRetStart = Date.now();
  const withCands = await Promise.all(
    normed.map(async (it) => ({
      id: it.id,
      titleNormalized: it.titleNormalized,
      candidates: (await getCandidatesForTitle(it.titleNormalized)).map((c) => ({
        sector_code: c.sector_code,
        sector_name: c.sector_name,
        rayon_code: c.rayon_code,
        rayon_name: c.rayon_name,
        famille_code: c.famille_code,
        famille_name: c.famille_name,
        sous_famille_code: c.sous_famille_code,
        sous_famille_name: c.sous_famille_name,
        full_path: c.full_path,
        scores: c.scores,
      })),
    })),
  );
  const retrievalMs = Date.now() - tRetStart;

  const tLlmStart = Date.now();
  const { results, tokens } = await adjudicate(withCands);
  const llmMs = Date.now() - tLlmStart;

  // Rank distribution
  const rankCounts: Record<string, number> = {};
  for (const r of results) {
    const it = withCands.find((x) => x.id === r.id);
    let rank = 0;
    if (it) rank = (it.candidates.findIndex((c) => c.full_path === r.full_path && c.sous_famille_code === r.sous_famille_code) + 1) || 0;
    rankCounts[String(rank)] = (rankCounts[String(rank)] || 0) + 1;
  }

  const totalMs = Date.now() - start;
  const out = { count: items.length, timings: { retrievalMs, llmMs, totalMs }, tokens, rankCounts };
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
