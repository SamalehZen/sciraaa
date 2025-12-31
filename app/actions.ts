'use server';

import { cookies } from 'next/headers';
import {
  getUser,
  type User,
  getCustomInstructions as getCustomInstructionsDb,
  saveCustomInstructions as saveCustomInstructionsDb,
  deleteCustomInstructions as deleteCustomInstructionsDb,
} from '@/lib/db/queries';
import { SearchGroupId } from '@/lib/utils';
import { getLightweightUser } from '@/lib/user-data-server';

// Lightweight auth check for fast authentication validation
export async function getLightweightUser() {
  const cookieStore = await cookies();
  // In a real implementation this would verify the session cookie
  // For this lite version we'll trust the layout/middleware to handle auth state
  // and just return a basic user object if the cookie exists
  const hasSession = cookieStore.has('next-auth.session-token') || cookieStore.has('__Secure-next-auth.session-token');

  if (!hasSession) return null;

  // We can't easily get the full user object without a DB call or JWT decode
  // so this runs a fast check. In this LITE version, we'll assume Pro is active
  // if you want to enforce limits, you'd need the DB call here.
  return { id: 'user', isProUser: true };
}

// Server action to get the current user with Pro status - UNIFIED VERSION
export async function getCurrentUser() {
  const user = await getUser();
  return user;
}

export type GroupId = SearchGroupId;

// -----------------------------------------------------------------------------
// AI AGENT DEFINITIONS & PROMPTS
// -----------------------------------------------------------------------------

const groupTools = {
  chat: [
    'datetime',
    'greeting',
  ],
  cyrus: [
    'datetime',
  ],
  libeller: [
    'datetime',
  ],
  nomenclature: [
    'datetime',
  ],
  pdfExcel: [
    'datetime',
  ],
  eanexpert: [
    'ean_search',
  ]
} as const;

/*
  SYSTEM PROMPTS FOR AGENTS
  -------------------------
  These prompts define the behavior for each specific agent in HyperLITE.
*/

const rawGroupInstructions = {
  chat: `You are Hyper, an AI-powered search and management engine designed for businesses. Your role is to help users find information.

**CORE BEHAVIORS:**
- **Answer directly** using your knowledge base.
- **Be concise**: No unnecessary chatter.
- **Format**: Use Markdown.

**DECISION TREE:**
1. **Greetings**: If user says "hello", "hi", etc. -> Use the \`greeting\` tool. Do NOT answer with text directly.
2. **Date/Time**: If user asks for time/date -> Use \`datetime\` tool.
3. **General**: Answer helpfuly and concisely.`,

  cyrus: `Tu es Cyrus, un expert en structuration d'articles de blog.

**TON RÔLE:**
- Analyser le sujet donné.
- Proposer une structure (H1, H2, H3) optimisée pour le SEO.
- Ne PAS rédiger l'article, seulement le plan.
- Utiliser un ton professionnel et structuré.`,

  libeller: `Tu es Libeller, un expert en correction orthographique et grammaticale.

**TON RÔLE:**
- Corriger les textes fournis.
- Expliquer les corrections si nécessaire (court).
- Améliorer le style si demandé.
- Ne pas changer le sens du texte.`,

  nomenclature: `Tu es Nomenclature, un expert en classification douanière.

**TON RÔLE:**
- Aider à trouver les codes HS (Harmonized System) pour les produits.
- Poser des questions de clarification si la description est vague.
- Fournir le code le plus probable avec une explication.`,

  pdfExcel: `Tu es PDF to Excel, un expert en extraction de données.

**TON RÔLE:**
- Identifier les tableaux et données structurées dans le texte fourni (issu d'un PDF).
- Formater ces données en tableaux Markdown clairs.
- L'utilisateur pourra ensuite télécharger ces tableaux en Excel.`,

  eanexpert: `Tu es EAN Expert, un spécialiste des produits de grande consommation.

**TON RÔLE:**
- Identifier les codes barres (EAN) ou les noms de produits.
- Utiliser l'outil \`ean_search\` pour trouver les détails du produit (nutri-score, image, ingrédients).
- Présenter les résultats de manière synthétique.

**RÈGLE IMPORTANTE:**
- Si l'utilisateur donne un code barre ou un nom de produit -> Utilise IMMÉDIATEMENT \`ean_search\`. Ne pose pas de questions avant.`,
};

export async function getSystemPromptByGroup(groupId: GroupId): Promise<string> {
  // @ts-ignore
  return rawGroupInstructions[groupId] || rawGroupInstructions.chat;
}

// -----------------------------------------------------------------------------
// CHAT UTILITIES
// -----------------------------------------------------------------------------

export async function generateTitleFromUserMessage() {
  throw new Error('Automatic title generation is disabled.');
}

export async function suggestQuestions(history: any[], groupId: GroupId = 'chat') {
  // Simple heuristic or lightweight generation can go here.
  // For HyperLITE, we will return an empty array to save token usage and latency,
  // or implement a very simple static suggestion if needed.
  return [];
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  // This would interact with the DB to delete messages after a certain point (for regeneration).
  // Implementation depends on the DB schema.
  // For LITE version, we'll stub this or use the imported one if available.
  // Since we imported queries, let's assume we might need to implement it in queries.ts if not present.
  // For now, no-op or explicit TODO.
  return;
}

// -----------------------------------------------------------------------------
// USER PREFERENCES
// -----------------------------------------------------------------------------

export async function getCustomInstructions(user: User | null) {
  if (!user) return null;
  return await getCustomInstructionsDb(user.id);
}

export async function saveCustomInstructions(content: string) {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');
  await saveCustomInstructionsDb(user.id, content);
  return { success: true };
}

export async function deleteCustomInstructionsAction() {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');
  await deleteCustomInstructionsDb(user.id);
  return { success: true };
}
