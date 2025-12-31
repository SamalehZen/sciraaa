'use server';

import { cookies } from 'next/headers';
import {
  getUser,
  type User,
  getCustomInstructions as getCustomInstructionsDb,
  saveCustomInstructions as saveCustomInstructionsDb,
  deleteCustomInstructions as deleteCustomInstructionsDb,
  getChatById,
  updateChatVisibilityById,
  deleteChatById,
  getChatsByUserId,
  updateChatTitleById,
  getMessageUsageByUserId,
  createLookout,
  getLookoutsByUserId,
  updateLookout,
  updateLookoutStatus,
  deleteLookout,
  getLookoutById,
} from '@/lib/db/queries';
import { SearchGroupId } from '@/lib/utils';

export type ConnectorProvider = 'notion' | 'slack' | 'google_drive';

export type DiscountConfig = {
  enabled?: boolean;
  dev?: boolean;
  code?: string;
  message?: string;
  percentage?: number;
  finalPrice?: number;
  originalPrice?: number;
  inrPrice?: number;
  startsAt?: Date;
  expiresAt?: Date;
  buttonText?: string;
  showPrice?: boolean;
};

const DEFAULT_DISCOUNT_CONFIG: DiscountConfig = {
  enabled: false,
  dev: false,
  code: '',
  message: 'Student offers available on request.',
};

// Lightweight auth check for fast authentication validation
export async function getLightweightUser() {
  const cookieStore = await cookies();
  const hasSession = cookieStore.has('next-auth.session-token') || cookieStore.has('__Secure-next-auth.session-token');

  if (!hasSession) return null;

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
  return [];
}

export async function deleteTrailingMessages({ id }: { id: string }) {
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

export async function updateChatVisibility(chatId: string, visibility: 'public' | 'private') {
  const user = await getUser();
  if (!user) return { success: false, error: 'Unauthorized' };
  const chat = await getChatById({ id: chatId });
  if (!chat || chat.userId !== user.id) {
    return { success: false, error: 'Chat not found' };
  }
  return await updateChatVisibilityById({ chatId, visibility });
}

export async function deleteChat(chatId: string) {
  const user = await getUser();
  if (!user) return { success: false, error: 'Unauthorized' };
  const chat = await getChatById({ id: chatId });
  if (!chat || chat.userId !== user.id) {
    return { success: false, error: 'Chat not found' };
  }
  await deleteChatById({ id: chatId });
  return { success: true };
}

async function getChatsPage(userId: string, cursor: string | null, limit: number) {
  const records = await getChatsByUserId({ id: userId, limit, startingAfter: cursor, endingBefore: null });
  const trimmed = records.slice(0, limit);
  return { chats: trimmed, hasMore: records.length > limit };
}

export async function getUserChats(userId: string, limit = 20) {
  const user = await getUser();
  if (!user || user.id !== userId) {
    return { chats: [], hasMore: false, error: 'Unauthorized' };
  }
  return await getChatsPage(userId, null, limit);
}

export async function loadMoreChats(userId: string, cursor: string, limit = 20) {
  const user = await getUser();
  if (!user || user.id !== userId) {
    return { chats: [], hasMore: false, error: 'Unauthorized' };
  }
  return await getChatsPage(userId, cursor, limit);
}

export async function updateChatTitle(chatId: string, title: string) {
  const user = await getUser();
  if (!user) return { success: false, error: 'Unauthorized' };
  const chat = await getChatById({ id: chatId });
  if (!chat || chat.userId !== user.id) {
    return { success: false, error: 'Chat not found' };
  }
  const sanitizedTitle = title?.trim().slice(0, 120) || 'Untitled chat';
  await updateChatTitleById({ chatId, title: sanitizedTitle });
  return { success: true };
}

export async function getUserMessageCount() {
  const user = await getUser();
  if (!user) {
    return { count: 0, resetAt: null };
  }
  const usage = await getMessageUsageByUserId({ userId: user.id });
  return {
    count: usage?.messageCount || 0,
    resetAt: usage?.resetAt || new Date(new Date().setHours(24, 0, 0, 0)),
  };
}

export async function getStudentDomainsAction() {
  const domains = ['.edu', '.ac.in', '.edu.mx', '.ac.uk'];
  return {
    success: true,
    domains,
    count: domains.length,
    fallback: false,
  };
}

export async function getUserLocation() {
  return {
    country: 'Unknown',
    countryCode: '',
    isIndia: false,
    loading: false,
  };
}

export async function getDiscountConfigAction(): Promise<DiscountConfig> {
  return { ...DEFAULT_DISCOUNT_CONFIG };
}

export async function checkImageModeration(_images: string[]): Promise<string> {
  return 'safe';
}

export async function enhancePrompt(_input: string): Promise<{ success: boolean; error: string }> {
  return { success: false, error: 'Action bloquée : automatisation non autorisée.' };
}

export async function listUserConnectorsAction(): Promise<{
  success: boolean;
  connections: Array<{ id: string; provider: ConnectorProvider; connectedAt: string }>;
}> {
  return { success: true, connections: [] };
}

function buildNextRunAt(time: string, date?: string) {
  const base = date ? new Date(date) : new Date();
  const [hours, minutes] = time.split(':').map((part) => Number(part));
  if (!Number.isNaN(hours)) {
    base.setHours(hours);
  }
  if (!Number.isNaN(minutes)) {
    base.setMinutes(minutes);
  }
  base.setSeconds(0, 0);
  return base;
}

async function ensureLookoutOwner(id: string, userId: string) {
  const record = await getLookoutById({ id });
  if (!record || record.userId !== userId) {
    throw new Error('Lookout not found');
  }
  return record;
}

export async function createScheduledLookout(params: {
  title: string;
  prompt: string;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  time: string;
  timezone: string;
  date?: string;
}) {
  const user = await getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }
  const nextRunAt = buildNextRunAt(params.time, params.date);
  const lookout = await createLookout({
    userId: user.id,
    title: params.title,
    prompt: params.prompt,
    frequency: params.frequency,
    cronSchedule: params.frequency,
    timezone: params.timezone,
    nextRunAt,
  });
  return { success: true, lookout };
}

export async function getUserLookouts() {
  const user = await getUser();
  if (!user) {
    return { success: false, lookouts: [], error: 'Unauthorized' };
  }
  const lookouts = await getLookoutsByUserId({ userId: user.id });
  return { success: true, lookouts };
}

export async function updateLookoutStatusAction(params: {
  id: string;
  status: 'active' | 'paused' | 'archived' | 'running';
}) {
  const user = await getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }
  await ensureLookoutOwner(params.id, user.id);
  await updateLookoutStatus(params);
  return { success: true };
}

export async function updateLookoutAction(params: {
  id: string;
  title?: string;
  prompt?: string;
  frequency?: string;
  timezone?: string;
}) {
  const user = await getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }
  await ensureLookoutOwner(params.id, user.id);
  await updateLookout({
    id: params.id,
    title: params.title,
    prompt: params.prompt,
    frequency: params.frequency,
    timezone: params.timezone,
  });
  return { success: true };
}

export async function deleteLookoutAction(params: { id: string }) {
  const user = await getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }
  await ensureLookoutOwner(params.id, user.id);
  await deleteLookout({ id: params.id });
  return { success: true };
}

export async function testLookoutAction(params: { id: string }) {
  const user = await getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }
  await ensureLookoutOwner(params.id, user.id);
  return { success: true };
}
