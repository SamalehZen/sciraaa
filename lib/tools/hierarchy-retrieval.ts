import { tool } from 'ai';
import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import Fuse from 'fuse.js';
import { normalizeText } from '@/lib/utils';
import { extractSessionToken, hierarchyCache } from '@/lib/performance-cache';
import { headers as nextHeaders } from 'next/headers';

// Types
interface HierNode {
  code: string;
  label: string;
  children?: HierNode[];
}

interface FlatNode {
  code: string;
  label: string;
  pathLabels: string[];
  pathCodes: string[];
  nodeRef: HierNode;
}

// Lazy-loaded data
let hierarchyRoot: HierNode | null = null;
let synonymsMap: Record<string, string[]> | null = null;
let flatNodes: FlatNode[] | null = null;
let fuse: Fuse<FlatNode> | null = null;
let normalizedSynonymLookup: Map<string, string> | null = null; // normalized -> canonical label

function loadHierarchy(): void {
  if (hierarchyRoot) return;
  const file = path.resolve(process.cwd(), 'lib/data/classification-hierarchy.json');
  const raw = fs.readFileSync(file, 'utf8');
  hierarchyRoot = JSON.parse(raw);
}

function loadSynonyms(): void {
  if (synonymsMap && normalizedSynonymLookup) return;
  const file = path.resolve(process.cwd(), 'lib/data/hierarchy-synonyms.json');
  try {
    const raw = fs.readFileSync(file, 'utf8');
    synonymsMap = JSON.parse(raw);
  } catch {
    synonymsMap = {};
  }
  normalizedSynonymLookup = new Map<string, string>();
  for (const [canonical, arr] of Object.entries(synonymsMap as Record<string, string[]>)) {
    const canonN = normalizeText(canonical);
    normalizedSynonymLookup.set(canonN, canonical);
    for (const s of arr) normalizedSynonymLookup.set(normalizeText(s), canonical);
  }
}

function buildFlat(): void {
  if (flatNodes && fuse) return;
  loadHierarchy();
  const acc: FlatNode[] = [];

  function walk(node: HierNode, parentLabels: string[], parentCodes: string[]) {
    const pathLabels = [...parentLabels, node.label];
    const pathCodes = [...parentCodes, node.code];
    acc.push({ code: node.code, label: node.label, pathLabels, pathCodes, nodeRef: node });
    if (node.children) for (const ch of node.children) walk(ch, pathLabels, pathCodes);
  }

  // Support either root node or array root
  if (Array.isArray(hierarchyRoot)) {
    (hierarchyRoot as any as HierNode[]).forEach((n) => walk(n, [], []));
  } else if (hierarchyRoot) {
    walk(hierarchyRoot, [], []);
  }

  flatNodes = acc;
  fuse = new Fuse(acc, {
    keys: ['label', 'code'],
    includeScore: true,
    threshold: 0.3,
    distance: 100,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });
}

function findByCodesPath(codes: string[]): HierNode | null {
  buildFlat();
  const target = codes.map((c) => c.trim());
  // try exact path match
  const exact = flatNodes!.find((n) => {
    if (n.pathCodes.length < target.length) return false;
    const tail = n.pathCodes.slice(-target.length);
    return tail.join('>') === target.join('>');
  });
  if (exact) return exact.nodeRef;

  // fallback: last code match
  const last = target[target.length - 1];
  const byLast = flatNodes!.find((n) => n.code === last);
  return byLast ? byLast.nodeRef : null;
}

function clipTree(root: HierNode, depth: number, maxNodes: { value: number }): HierNode {
  const clone: HierNode = { code: root.code, label: root.label };
  maxNodes.value -= 1;
  if (depth <= 1 || !root.children || maxNodes.value <= 0) return clone;
  clone.children = [];
  for (const ch of root.children) {
    if (maxNodes.value <= 0) break;
    clone.children.push(clipTree(ch, depth - 1, maxNodes));
  }
  return clone;
}

function pickLcaNodes(nodes: FlatNode[]): HierNode[] {
  // Simplified: return the distinct roots among top nodes themselves as subtree anchors
  // Future: compute true LCAs across their pathLabels
  const uniqueByPath = new Map<string, HierNode>();
  for (const n of nodes) {
    uniqueByPath.set(n.pathLabels.join(' > '), n.nodeRef);
  }
  return Array.from(uniqueByPath.values());
}

export const hierarchyRetrievalTool = tool({
  name: 'hierarchy_retrieve',
  description:
    'Retrieve ranked candidates and a relevant classification subtree for a query or codes path. Uses exact, synonyms, and fuzzy (Fuse.js) matching with caching per session (24h).',
  inputSchema: z
    .object({
      query: z.string().optional(),
      codes: z.array(z.string()).optional(),
      depth: z.number().int().min(1).max(5).default(2),
      maxNodes: z.number().int().min(1).max(2000).default(300),
    })
    .refine((v) => !!(v.query || v.codes), { message: 'Provide query or codes' }),
  execute: async (input) => {
    const depth = input.depth ?? 2;
    const maxNodesLimit = input.maxNodes ?? 300;

    // Cache key composition
    let sessionToken: string | null = null;
    try {
      const h = nextHeaders();
      // @ts-ignore - next headers are compatible enough for cookie extraction
      sessionToken = extractSessionToken(h as any as Headers);
    } catch {}
    const sess = sessionToken || 'anon';
    const hashInput = JSON.stringify({ query: input.query || null, codes: input.codes || null, depth, maxNodes: maxNodesLimit });
    const hash = createHash('sha1').update(hashInput).digest('hex');
    const cacheKey = `${sess}:hier:${hash}`;

    const cached = hierarchyCache.get(cacheKey);
    if (cached) {
      return { ...(cached as any), stats: { ...(cached as any).stats, source: 'cache' as const } };
    }

    loadSynonyms();
    buildFlat();

    let normalizedQuery: string | undefined;
    const candidates: Array<{ code: string; label: string; path: string[]; score: number }> = [];

    // Resolve by codes path first if provided
    let subtreeRoots: HierNode[] = [];
    if (input.codes && input.codes.length > 0) {
      const node = findByCodesPath(input.codes);
      if (node) subtreeRoots = [node];
    }

    if (input.query) {
      normalizedQuery = normalizeText(input.query);

      // 1) exact label match
      const exactMatches = flatNodes!.filter((n) => normalizeText(n.label) === normalizedQuery);
      for (const m of exactMatches) {
        candidates.push({ code: m.code, label: m.label, path: m.pathLabels, score: 1.0 });
      }

      // 2) synonyms exact
      const canonical = normalizedSynonymLookup!.get(normalizedQuery);
      if (canonical) {
        const canonMatches = flatNodes!.filter((n) => normalizeText(n.label) === normalizeText(canonical));
        for (const m of canonMatches) {
          candidates.push({ code: m.code, label: m.label, path: m.pathLabels, score: 0.97 });
        }
      }

      // 3) fuzzy matching (Fuse)
      const fuseRes = fuse!.search(input.query, { limit: 10 });
      for (const r of fuseRes) {
        const m = r.item;
        const rawScore = r.score ?? 1; // 0 best → 1 worst
        const score = Math.max(0, Math.min(1, 1 - rawScore));
        candidates.push({ code: m.code, label: m.label, path: m.pathLabels, score });
      }

      // Deduplicate by path+code, keep highest score
      const byKey = new Map<string, { code: string; label: string; path: string[]; score: number }>();
      for (const c of candidates) {
        const key = `${c.code}|${c.path.join('>')}`;
        const prev = byKey.get(key);
        if (!prev || c.score > prev.score) byKey.set(key, c);
      }
      const dedup = Array.from(byKey.values()).sort((a, b) => b.score - a.score);
      const top = dedup.slice(0, 3);

      // Decide subtree roots
      if (top.length > 0) {
        const s1 = top[0].score;
        const s2 = top.length > 1 ? top[1].score : 0;
        const confident = s1 >= 0.85 && s1 - s2 >= 0.1;
        if (confident) {
          // find the actual node
          const node = flatNodes!.find((n) => n.code === top[0].code && n.pathLabels.join('>') === top[0].path.join('>'));
          if (node) subtreeRoots = [node.nodeRef];
        } else {
          // union of minimal ancestors (simplified to top-3 nodes)
          const nodes = top
            .map((t) => flatNodes!.find((n) => n.code === t.code && n.pathLabels.join('>') === t.path.join('>'))!)
            .filter(Boolean);
          subtreeRoots = pickLcaNodes(nodes);
        }

        // Overwrite candidates with top-3 for clarity
        // Already sorted and limited above
        candidates.length = 0;
        candidates.push(...top);
      }
    }

    // Build subtree output
    const subtree: any[] = [];
    let remaining = { value: maxNodesLimit };
    for (const r of subtreeRoots) {
      if (remaining.value <= 0) break;
      subtree.push(clipTree(r, depth, remaining));
    }

    const result = {
      normalizedQuery,
      candidates,
      subtree,
      stats: { nodesReturned: maxNodesLimit - remaining.value, depth, source: 'fresh' as const },
    };

    hierarchyCache.set(cacheKey, result);
    return result;
  },
});
