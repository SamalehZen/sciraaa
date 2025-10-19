export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { and, desc, gte, isNotNull } from 'drizzle-orm';
import { db, maindb } from '@/lib/db';
import { user, message, chat } from '@/lib/db/schema';
import { assertAdmin } from '@/lib/auth';
import { tokensToUsd } from '@/lib/cost';

function parseRange(range?: string) {
  switch (range) {
    case '7d':
      return { ms: 7 * 24 * 60 * 60 * 1000, defaultGroupBy: 'day' as const };
    case '30d':
      return { ms: 30 * 24 * 60 * 60 * 1000, defaultGroupBy: 'day' as const };
    case '24h':
    default:
      return { ms: 24 * 60 * 60 * 1000, defaultGroupBy: 'hour' as const };
  }
}

function bucketKey(date: Date, groupBy: 'hour' | 'day' | 'week') {
  const d = new Date(date);
  if (groupBy === 'hour') {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')} ${String(d.getUTCHours()).padStart(2, '0')}:00`;
  }
  if (groupBy === 'week') {
    const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() - day + 1);
    return `${t.getUTCFullYear()}-W${String(Math.ceil(((d.getUTCDate() - day + 1) + 6) / 7)).padStart(2, '0')}`;
  }
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export async function GET(req: NextRequest) {
  const hdrs = await headers();
  const adminUser = await assertAdmin({ headers: hdrs });
  if (!adminUser) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const rangeParam = (searchParams.get('range') || '24h') as '24h' | '7d' | '30d';
  const groupByParam = searchParams.get('groupBy') as 'hour' | 'day' | 'week' | null;

  const { ms, defaultGroupBy } = parseRange(rangeParam);
  const groupBy: 'hour' | 'day' | 'week' = groupByParam || defaultGroupBy;

  const now = new Date();
  const sinceWindow = new Date(now.getTime() - ms);
  const since5s = new Date(now.getTime() - 5 * 1000);

  const [allUsers, activeUsers, recentMessages] = await Promise.all([
    maindb.select({ id: user.id, status: user.status, name: user.name }).from(user),
    maindb.select({ id: user.id }).from(user).where(and(isNotNull(user.lastSeen), gte(user.lastSeen, since5s))),
    maindb
      .select({ id: message.id, model: message.model, totalTokens: message.totalTokens, inputTokens: message.inputTokens, outputTokens: message.outputTokens, createdAt: message.createdAt, chatId: message.chatId, mode: (message as any).mode as any })
      .from(message)
      .where(gte(message.createdAt, sinceWindow))
      .orderBy(desc(message.createdAt)),
  ]);

  const suspendedCount = allUsers.filter((u: any) => u.status === 'suspended').length;
  const deletedCount = allUsers.filter((u: any) => u.status === 'deleted').length;
  const totalUsers = allUsers.length || 1;
  const suspendedPct = (suspendedCount / totalUsers) * 100;
  const deletedPct = (deletedCount / totalUsers) * 100;

  const messagesByModelMap = new Map<string, number>();
  const messagesByUserMap = new Map<string, number>();
  const costByUserMap = new Map<string, number>();
  const byMode = { streaming: 0, non_streaming: 0 } as Record<'streaming' | 'non_streaming', number>;

  const chats = await maindb.select({ id: chat.id, userId: chat.userId }).from(chat);
  const chatUserMap = new Map<string, string>();
  chats.forEach((c) => chatUserMap.set(c.id, (c as any).userId));

  for (const m of recentMessages) {
    const mdl = (m.model || 'inconnu').toString();
    messagesByModelMap.set(mdl, (messagesByModelMap.get(mdl) || 0) + 1);
    const uid = chatUserMap.get(m.chatId) || 'inconnu';
    messagesByUserMap.set(uid, (messagesByUserMap.get(uid) || 0) + 1);
    const cost = tokensToUsd(m.totalTokens as any, m.inputTokens as any, m.outputTokens as any);
    costByUserMap.set(uid, (costByUserMap.get(uid) || 0) + cost);
    const mode = (m as any).mode === 'streaming' ? 'streaming' : 'non_streaming';
    byMode[mode] = (byMode[mode] || 0) + 1;
  }

  const messagesByModel = Array.from(messagesByModelMap.entries())
    .map(([model, count]) => ({ model, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  const messagesByUser = Array.from(messagesByUserMap.entries())
    .map(([userId, count]) => ({ userId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  const costByUser = Array.from(costByUserMap.entries())
    .map(([userId, cost]) => ({ userId, cost: Number(cost.toFixed(2)) }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 15);

  const seriesBuckets = new Map<string, number>();
  for (const m of recentMessages) {
    const key = bucketKey(m.createdAt as any, groupBy);
    seriesBuckets.set(key, (seriesBuckets.get(key) || 0) + 1);
  }
  const seriesActivity = Array.from(seriesBuckets.entries())
    .map(([bucket, count]) => ({ bucket, count }))
    .sort((a, b) => a.bucket.localeCompare(b.bucket));

  return NextResponse.json({
    kpis: {
      activeUsers: activeUsers.length,
      suspended: { count: suspendedCount, pct: suspendedPct },
      deleted: { count: deletedCount, pct: deletedPct },
      messages24hTotal: recentMessages.length,
      messages24hByMode: byMode,
    },
    charts: {
      models: messagesByModel,
      usersActivity: messagesByUser,
      usersCost: costByUser,
    },
    series: { activity: seriesActivity },
    users: (allUsers || []).map((u: any) => ({ id: u.id, name: u.name })),
  });
}
