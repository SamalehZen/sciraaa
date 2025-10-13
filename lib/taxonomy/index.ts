import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export type Sector = { code: string; name: string };
export type Rayon = { code: string; name: string; sectorCode: string };
export type Famille = { code: string; name: string; rayonCode: string };
export type SousFamille = { code: string; name: string; familleCode: string };
export type Leaf = {
  leafId: string;
  sector: Sector;
  rayon: Omit<Rayon, 'sectorCode'> & { code: string };
  famille: Omit<Famille, 'rayonCode'> & { code: string };
  sousFamille: Omit<SousFamille, 'familleCode'> & { code: string };
  fullPath: string;
  leafKey: string; // globally unique key: sectorCode-rayonCode-familleCode-sousFamilleCode
};

export type Taxonomy = {
  sectors: Sector[];
  rayons: Rayon[];
  familles: Famille[];
  sousFamilles: SousFamille[];
  leaves: Leaf[];
  taxonomyHash: string;
};

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'data');
const TAXONOMY_JSON = path.join(DATA_DIR, 'taxonomy.json');
const PROMPT_FILE = path.join(ROOT, 'ai', 'prompts', 'classification-cyrus.ts');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function sha1(input: string) {
  return crypto.createHash('sha1').update(input).digest('hex');
}

function extractHierarchyText(fileContent: string): string | null {
  // In this repo the hierarchy lives INSIDE CYRUS_PROMPT string as a literal snippet:
  // "export const CLASSIFICATION_HIERARCHY = \`...\`"
  // so we must match backslash+backtick.
  const m = fileContent.match(/export const CLASSIFICATION_HIERARCHY[\s\S]*?=\s*(?:`|\\`)([\s\S]*?)(?:`|\\`)/);
  if (m?.[1]) return m[1];
  // Fallback: line-based capture from marker to next '---' or a markdown header
  const lines = fileContent.split('\n');
  const idx = lines.findIndex((l) => l.includes('export const CLASSIFICATION_HIERARCHY'));
  if (idx === -1) return null;
  const buf: string[] = [];
  for (let i = idx + 1; i < lines.length; i++) {
    const ln = lines[i];
    if (/^\s*---\s*$/.test(ln) || /^\s*##\s/.test(ln)) break;
    buf.push(ln);
  }
  return buf.join('\n').trim() || null;
}

function parseLine(line: string) {
  // returns {indent: number, code: string, name: string} or null
  if (!line.trim()) return null;
  const indent = line.match(/^\s*/)?.[0]?.length ?? 0;
  const m = line.trim().match(/^(\d{2,3})\s+(.+)$/);
  if (!m) return null;
  const code = m[1];
  const name = m[2].trim();
  return { indent, code, name };
}

function parseHierarchyToTaxonomy(hText: string): Taxonomy {
  const sectors: Sector[] = [];
  const rayons: Rayon[] = [];
  const familles: Famille[] = [];
  const sousFamilles: SousFamille[] = [];
  const leaves: Leaf[] = [];

  const lines = hText.split('\n');
  let currentSector: Sector | null = null;
  let currentRayon: Rayon | null = null;
  let currentFamille: Famille | null = null;

  for (const raw of lines) {
    const parsed = parseLine(raw);
    if (!parsed) continue;

    const { indent, code, name } = parsed;

    // ignore the very top store root like "201 GEANT CASINO" (indent 0 with 3 digits followed by uppercase words)
    if (indent === 0) {
      // treat as root node, skip
      currentSector = null;
      currentRayon = null;
      currentFamille = null;
      continue;
    }

    // The indentation levels observed:
    // 1: sector (e.g., 01 MARCHE)
    // 2: rayon (e.g., 010 BOUCHERIE)
    // 3: famille (e.g., 101 STAND TRADITIONNEL)
    // 4+: sous-famille (e.g., 101 BOEUF LOCAL)

    if (indent === 1) {
      currentSector = { code: code.padStart(2, '0'), name };
      if (!sectors.find((s) => s.code === currentSector!.code)) sectors.push(currentSector);
      currentRayon = null;
      currentFamille = null;
      continue;
    }

    if (indent === 2) {
      if (!currentSector) continue; // malformed, skip
      currentRayon = { code: code.padStart(3, '0'), name, sectorCode: currentSector.code };
      rayons.push(currentRayon);
      currentFamille = null;
      continue;
    }

    if (indent === 3) {
      if (!currentRayon) continue;
      currentFamille = { code: code.padStart(3, '0'), name, rayonCode: currentRayon.code };
      familles.push(currentFamille);
      continue;
    }

    if (indent >= 4) {
      if (!currentFamille || !currentRayon || !currentSector) continue;
      const sf: SousFamille = { code: code.padStart(3, '0'), name, familleCode: currentFamille.code };
      sousFamilles.push(sf);

      const leaf: Leaf = {
        leafId: sf.code,
        leafKey: `${currentSector.code}-${currentRayon.code}-${currentFamille.code}-${sf.code}`,
        sector: { ...currentSector },
        rayon: { code: currentRayon.code, name: currentRayon.name },
        famille: { code: currentFamille.code, name: currentFamille.name },
        sousFamille: { code: sf.code, name: sf.name },
        fullPath: `${currentSector.name} › ${currentRayon.name} › ${currentFamille.name} › ${sf.name}`,
      };
      leaves.push(leaf);
      continue;
    }
  }

  const taxonomyHash = sha1(JSON.stringify({ sectors, rayons, familles, sousFamilles, leaves: leaves.map((l) => ({ leafKey: l.leafKey })) }));

  return { sectors, rayons, familles, sousFamilles, leaves, taxonomyHash };
}

export function loadTaxonomy(): Taxonomy {
  ensureDataDir();

  // Try to read existing taxonomy.json
  if (fs.existsSync(TAXONOMY_JSON)) {
    try {
      const raw = fs.readFileSync(TAXONOMY_JSON, 'utf-8');
      const json = JSON.parse(raw) as Taxonomy;
      if (json && Array.isArray(json.leaves) && json.taxonomyHash) return json;
    } catch {}
  }

  // Fallback: parse from prompt file
  const promptContent = fs.readFileSync(PROMPT_FILE, 'utf-8');
  const hierarchyText = extractHierarchyText(promptContent);
  if (!hierarchyText) {
    throw new Error('Failed to extract CLASSIFICATION_HIERARCHY from ai/prompts/classification-cyrus.ts');
  }

  const taxonomy = parseHierarchyToTaxonomy(hierarchyText);
  fs.writeFileSync(TAXONOMY_JSON, JSON.stringify(taxonomy, null, 2), 'utf-8');
  return taxonomy;
}

export function getTaxonomyPath() {
  return TAXONOMY_JSON;
}
