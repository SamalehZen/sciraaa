import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSessionFromHeaders } from '@/lib/local-session';
import { db } from '@/lib/db';
import { users, messageUsage, extremeSearchUsage, chat, message } from '@/lib/db/schema';
import { and, asc, between, eq, gte, lte, sql } from 'drizzle-orm';

export async function GET(req: Request, ctx: { params: { username: string } }) {
  const { username } = ctx.params;
  const url = new URL(req.url);
  const period = url.searchParams.get('period') || '30d';
  const now = new Date();
  const from = new Date(now);
  if (period === '7d') from.setDate(now.getDate() - 7);
  else if (period === '30d') from.setDate(now.getDate() - 30);
  else if (period === '90d') from.setDate(now.getDate() - 90);
  else from.setDate(now.getDate() - 30);

  const hdrs = await headers();
  const sess = getSessionFromHeaders(hdrs as any);
  if (!sess?.userId?.startsWith('local:')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const actor = sess.userId.slice('local:'.length);
  const [admin] = await db.select().from(users).where(eq(users.username, actor)).limit(1);
  if (!admin || admin.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const userId = `local:${username}`;

  const msgAgg = await db
    .select({ d: sql<string>`date_trunc('day', ${messageUsage.date})::date`, c: sql<number>`sum(${messageUsage.messageCount})::int` })
    .from(messageUsage)
    .where(and(eq(messageUsage.userId, userId), gte(messageUsage.date, from)))
    .groupBy(sql`date_trunc('day', ${messageUsage.date})`)
    .orderBy(asc(sql`date_trunc('day', ${messageUsage.date})`));

  const extAgg = await db
    .select({ d: sql<string>`date_trunc('day', ${extremeSearchUsage.date})::date`, c: sql<number>`sum(${extremeSearchUsage.searchCount})::int` })
    .from(extremeSearchUsage)
    .where(and(eq(extremeSearchUsage.userId, userId), gte(extremeSearchUsage.date, from)))
    .groupBy(sql`date_trunc('day', ${extremeSearchUsage.date})`)
    .orderBy(asc(sql`date_trunc('day', ${extremeSearchUsage.date})`));

  return NextResponse.json({ messages: msgAgg, extremeSearch: extAgg, from: from.toISOString(), to: now.toISOString() });
}
