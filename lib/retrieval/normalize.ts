export type Normalized = {
  original: string;
  normalized: string;
  tokens: string[];
};

const GENERIC_PATTERNS: RegExp[] = [
  /\b(lot\s*de|pack|flacon|boite|sachet|bouteille|canette|lot)\b/gi,
  /\b(x\s*\d+)\b/gi, // x12, x 6
  /\b(\d+\s*x\s*\d+\s*(cl|ml|l|g|kg))\b/gi, // 6x33cl, 3x1l
  /\b(\d+\s*(cl|ml|l|g|kg))\b/gi,
  /\b(sachet|paquet|carton|lot|pack)\b/gi,
];

const PUNCT = /[\p{P}\p{S}]+/gu;

const WHITELIST_TERMS = [
  'bio',
  'halal',
  'sans sucre',
  'sans sel',
  'sans gluten',
  'vegan',
  'vegetarien',
  'épautre',
  'epautre',
];

function stripDiacritics(s: string) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae');
}

export function normalizeTitle(input: string): Normalized {
  const original = input || '';
  let s = stripDiacritics(original.toLowerCase());
  s = s.replace(PUNCT, ' ');

  // preserve whitelist terms by tagging temporarily
  for (const term of WHITELIST_TERMS) {
    const re = new RegExp(`\\b${term.replace(/\s+/g, '\\s+')}\\b`, 'gi');
    s = s.replace(re, (m) => m.replace(/\s+/g, '_')); // collapse spaces to underscore to avoid removal
  }

  // remove generic patterns
  for (const re of GENERIC_PATTERNS) s = s.replace(re, ' ');

  // remove clothing sizes
  s = s.replace(/\b(xl|xs|xxl|s|m|l|xxxl|xxxxl)\b/gi, ' ');

  // restore whitelist
  s = s.replace(/_/g, ' ');

  // collapse spaces
  s = s.replace(/\s+/g, ' ').trim();

  const tokens = Array.from(new Set(s.split(' ').filter(Boolean)));
  return { original, normalized: s, tokens };
}
