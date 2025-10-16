import { google } from '@ai-sdk/google';
import { generateText, streamText } from 'ai';
import { kvGet, kvSet, kvExpire } from '@/lib/kv/client';

const STATE_KEY = 'gemini:rotation:v1';

type RotationState = {
  date: string;
  exhausted: number[];
};

export function getGeminiKeys(): string[] {
  const raw = process.env.GEMINI_API_KEYS || '';
  const keys = raw
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
  if (keys.length < 1) throw new Error('Missing GEMINI_API_KEYS');
  return keys;
}

export function getDayKeyUTC(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function secondsUntilNextUtcMidnight(): number {
  const now = new Date();
  const next = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0,
    0,
    0,
    0,
  );
  const diff = next - now.getTime();
  return Math.max(1, Math.ceil(diff / 1000));
}

export function isRateLimitError(err: unknown): boolean {
  const e = err as any;
  const status = e?.status ?? e?.cause?.status ?? e?.response?.status ?? e?.cause?.response?.status;
  if (status === 429) return true;
  const name = (e?.name || '').toString().toLowerCase();
  const msg = (e?.message || '').toString().toLowerCase();
  if (name.includes('ratelimit') || name.includes('rate-limit')) return true;
  if (msg.includes('rate limit') || msg.includes('quota') || msg.includes('429')) return true;
  return false;
}

class AllKeysExhaustedError extends Error {
  status = 503;
  constructor() {
    super('Toutes les clés Gemini ont atteint leur limite quotidienne');
    this.name = 'AllKeysExhaustedError';
  }
}

async function loadOrInitState(): Promise<RotationState> {
  const today = getDayKeyUTC();
  const ttl = secondsUntilNextUtcMidnight();
  const current = (await kvGet<RotationState>(STATE_KEY)) || { date: today, exhausted: [] };
  if (current.date !== today) {
    const fresh: RotationState = { date: today, exhausted: [] };
    await kvSet(STATE_KEY, fresh);
    await kvExpire(STATE_KEY, ttl);
    return fresh;
  }
  // Ensure key expires at next midnight
  await kvExpire(STATE_KEY, ttl);
  return current;
}

async function markExhaustedIndex(index: number): Promise<void> {
  const state = await loadOrInitState();
  if (!state.exhausted.includes(index)) {
    state.exhausted.push(index);
    await kvSet(STATE_KEY, state);
    await kvExpire(STATE_KEY, secondsUntilNextUtcMidnight());
  }
}

export async function areAllGeminiKeysExhaustedToday(): Promise<boolean> {
  const keys = getGeminiKeys();
  const today = getDayKeyUTC();
  const state = (await kvGet<RotationState>(STATE_KEY)) || { date: today, exhausted: [] };
  if (state.date !== today) return false;
  const exhaustedSet = new Set(state.exhausted);
  let available = 0;
  for (let i = 0; i < keys.length; i++) if (!exhaustedSet.has(i)) available++;
  return available === 0;
}

export async function withGeminiKeyRotation<T>(exec: (apiKey: string) => Promise<T>): Promise<T> {
  const keys = getGeminiKeys();
  let state = await loadOrInitState();
  const exhausted = new Set(state.exhausted);

  const candidates: number[] = [];
  for (let i = 0; i < keys.length; i++) if (!exhausted.has(i)) candidates.push(i);

  for (const idx of candidates) {
    const key = keys[idx];
    try {
      const result = await exec(key);
      return result;
    } catch (err) {
      if (isRateLimitError(err)) {
        await markExhaustedIndex(idx);
        // Reload state in case of concurrent updates
        state = await loadOrInitState();
        continue;
      }
      throw err;
    }
  }
  throw new AllKeysExhaustedError();
}

export async function generateTextWithGeminiRotation(args: { modelName: string } & Record<string, any>) {
  const { modelName, ...rest } = args;
  return withGeminiKeyRotation((apiKey) =>
    generateText({
      model: google(modelName as any, { apiKey }),
      ...(rest as any),
    }),
  );
}

export async function streamTextWithGeminiRotation(args: { modelName: string } & Record<string, any>) {
  const { modelName, ...rest } = args;
  return withGeminiKeyRotation(async (apiKey) => {
    try {
      return streamText({
        model: google(modelName as any, { apiKey }),
        ...(rest as any),
      });
    } catch (err) {
      throw err;
    }
  });
}
