import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = new Redis({ url: url!, token: token! });

export async function kvGet<T>(key: string): Promise<T | null> {
  const raw = await redis.get<string>(key);
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function kvSet<T>(key: string, value: T): Promise<void> {
  await redis.set(key, JSON.stringify(value));
}

export async function kvExpire(key: string, ttlSeconds: number): Promise<void> {
  if (ttlSeconds > 0) {
    await redis.expire(key, ttlSeconds);
  }
}
