// scripts/extract-hierarchy.js
// Node script to extract inline CLASSIFICATION_HIERARCHY from ai/prompts/classification-cyrus.ts
// and convert it into a nested JSON saved at lib/data/classification-hierarchy.json

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const SRC = path.resolve(repoRoot, 'ai/prompts/classification-cyrus.ts');
const OUT = path.resolve(repoRoot, 'lib/data/classification-hierarchy.json');

function getHierarchyString(srcText) {
  const match = srcText.match(/export\s+const\s+CLASSIFICATION_HIERARCHY\s*=\s*`([\s\S]*?)`/);
  if (!match) throw new Error('CLASSIFICATION_HIERARCHY not found');
  return match[1];
}

function leadingIndent(line) {
  let count = 0;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === ' ') count += 1;
    else if (ch === '\t') count += 4; // treat tab as 4 spaces
    else break;
  }
  // Normalize to depth in steps of 2 spaces
  return Math.floor(count / 2);
}

function parseLine(line) {
  // Expect: optional spaces, digits code, space(s), label
  const m = line.match(/^\s*(\d{1,4})\s+(.+?)\s*$/);
  if (!m) return null;
  const code = m[1].trim();
  const label = m[2].trim();
  if (!label) return null;
  return { code, label };
}

function buildTree(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  const root = { code: 'ROOT', label: 'ROOT', children: [] };
  const stack = [{ node: root, depth: -1 }];

  for (const rawLine of lines) {
    const info = parseLine(rawLine);
    if (!info) continue;
    const depth = leadingIndent(rawLine);

    // Adjust stack to current depth
    while (stack.length && stack[stack.length - 1].depth >= depth) stack.pop();

    const parent = stack[stack.length - 1].node;
    const node = { code: info.code, label: info.label };
    // Attach children array only when needed to keep output compact
    parent.children = parent.children || [];
    parent.children.push(node);

    // Prepare for potential children
    stack.push({ node, depth });
  }

  // If the root has exactly one top-level node, return it; else return root children
  if (root.children && root.children.length === 1) return root.children[0];
  return root.children || [];
}

function main() {
  const src = fs.readFileSync(SRC, 'utf8');
  const hierRaw = getHierarchyString(src);
  const tree = buildTree(hierRaw);

  // Ensure output dir exists
  const outDir = path.dirname(OUT);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(tree, null, 2), 'utf8');
  console.log('Wrote', OUT);
}

main();
