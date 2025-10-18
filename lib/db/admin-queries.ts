import { and, between, eq, gte, lt, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { chat, lookout, message, user, auditLog } from '@/lib/db/schema';
import { percentile } from '@/lib/admin-utils';

export function resolvePeriod(period: '24h' | '7d' | '30d') {
  const now = new Date();
  let start = new Date();
  if (period === '24h') start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (period === '7d') start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (period === '30d') start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { start, end: now };
}

export async function countUserSearches(period: '24h' | '7d' | '30d') {
  const { start, end } = resolvePeriod(period);
  const rows = await db
    .select({ c: sql<number>`count(*)` })
    .from(message)
    .where(and(eq(message.role, 'user'), gte(message.createdAt, start), lt(message.createdAt, end)));
  return Number(rows?.[0]?.c || 0);
}

export async function getLatencyDistribution(period: '24h' | '7d' | '30d') {
  const { start, end } = resolvePeriod(period);
  const rows = await db
    .select({ t: message.completionTime })
    .from(message)
    .where(and(gte(message.createdAt, start), lt(message.createdAt, end)));
  const values = rows.map((r) => Number(r.t || 0)).filter((v) => Number.isFinite(v) && v >= 0);
  const p50 = percentile(values, 50);
  const p95 = percentile(values, 95);
  const p99 = percentile(values, 99);
  return { p50, p95, p99, histogram: values };
}

export async function getLookoutStats(period: '24h' | '7d' | '30d') {
  const { start, end } = resolvePeriod(period);
  const rows = await db.select({ runHistory: lookout.runHistory }).from(lookout);
  const cutoff = start.getTime();
  let total = 0;
  let success = 0;
  let error = 0;
  for (const r of rows) {
    const history = (r.runHistory as any[]) || [];
    for (const h of history) {
      const ts = Date.parse(h.runAt);
      if (ts >= cutoff && ts <= end.getTime()) {
        total += 1;
        if (h.status === 'success') success += 1;
        if (h.status === 'error' || h.status === 'timeout') error += 1;
      }
    }
  }
  const successRate = total ? success / total : 0;
  return { total, success, error, successRate };
}

export async function getMessageTimeSeries(period: '24h' | '7d' | '30d') {
  const { start, end } = resolvePeriod(period);
  const rows = await db
    .select({ createdAt: message.createdAt, role: message.role })
    .from(message)
    .where(and(gte(message.createdAt, start), lt(message.createdAt, end)));
  const map = new Map<string, { user: number; assistant: number }>();
  for (const r of rows) {
    const d = new Date(r.createdAt as any);
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
    const entry = map.get(key) || { user: 0, assistant: 0 };
    if (r.role === 'user') entry.user += 1;
    else if (r.role === 'assistant') entry.assistant += 1;
    map.set(key, entry);
  }
  return Array.from(map.entries()).map(([date, v]) => ({ date, ...v }));
}

export async function getStackedBySource(period: '24h' | '7d' | '30d') {
  const { start, end } = resolvePeriod(period);
  const rows = await db
    .select({ src: message.source, c: sql<number>`count(*)` })
    .from(message)
    .where(and(gte(message.createdAt, start), lt(message.createdAt, end)))
    .groupBy(message.source);
  return rows.map((r) => ({ source: r.src || 'unknown', count: Number(r.c || 0) }));
}

export async function getTopCountries(period: '24h' | '7d' | '30d') {
  const { start, end } = resolvePeriod(period);
  const rows = await db
    .select({ country: message.geoCountry, c: sql<number>`count(*)` })
    .from(message)
    .where(and(gte(message.createdAt, start), lt(message.createdAt, end)))
    .groupBy(message.geoCountry)
    .orderBy(sql`count(*) desc`)
    .limit(10);
  return rows.map((r) => ({ country: r.country || 'unknown', count: Number(r.c || 0) }));
}

export async function getIssuesDonut(period: '24h' | '7d' | '30d') {
  const { start, end } = resolvePeriod(period);
  const issueRows = await db
    .select({ it: message.issueType, c: sql<number>`count(*)` })
    .from(message)
    .where(and(gte(message.createdAt, start), lt(message.createdAt, end)))
    .groupBy(message.issueType);
  const apiErrors = await db
    .select({ c: sql<number>`count(*)` })
    .from(auditLog)
    .where(and(eq(auditLog.action, 'api_error'), gte(auditLog.createdAt, start), lt(auditLog.createdAt, end)));
  const map = new Map<string, number>();
  for (const r of issueRows) map.set(String(r.it || 'unknown'), Number(r.c || 0));
  const errorCount = Number(apiErrors?.[0]?.c || 0) + (map.get('error') || 0);
  return {
    success: map.get('success') || 0,
    reformulation: map.get('reformulation') || 0,
    error: errorCount,
  };
}

export async function getActivityHeatmap(period: '24h' | '7d' | '30d') {
  const { start, end } = resolvePeriod(period);
  const rows = await db
    .select({ createdAt: message.createdAt })
    .from(message)
    .where(and(gte(message.createdAt, start), lt(message.createdAt, end)));
  const map = new Map<string, number>();
  for (const r of rows) {
    const d = new Date(r.createdAt as any);
    const key = `${d.getUTCDay()}-${d.getUTCHours()}`;
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Array.from(map.entries()).map(([key, count]) => {
    const [day, hour] = key.split('-').map((x) => parseInt(x));
    return { day, hour, count };
  });
}

export async function listUsersWithStats(limit = 50, offset = 0) {
  const rows = await db.select().from(user).limit(limit).offset(offset);
  const ids = rows.map((u) => u.id);
  if (!ids.length) return [] as any[];
  const lastMsgs = await db
    .select({ id: chat.userId, t: sql<Date>`max(${message.createdAt})` })
    .from(message)
    .leftJoin(chat, eq(message.chatId, chat.id))
    .where(between(message.createdAt, new Date(0), new Date()))
    .groupBy(chat.userId);
  const lastMap = new Map<string, Date>();
  for (const r of lastMsgs) {
    if (r.id) lastMap.set(r.id, r.t);
  }
  return rows.map((u) => {
    const status = (u as any).deletedAt ? 'deleted' : (u as any).suspendedAt ? 'suspended' : 'active';
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      createdAt: u.createdAt,
      lastActive: lastMap.get(u.id) || null,
      role: (u as any).role || 'user',
      status,
    };
  });
}