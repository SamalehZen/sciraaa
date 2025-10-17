import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSessionFromHeaders } from '@/lib/local-session';
import { db } from '@/lib/db';
import { users, userPresence, session } from '@/lib/db/schema';
import { and, desc, eq, ilike, or, sql, inArray, gt } from 'drizzle-orm';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim() || '';
  const roleFilter = url.searchParams.get('role') || '';
  const statusFilter = url.searchParams.get('status') || '';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const pageSize = Math.min(parseInt(url.searchParams.get('pageSize') || '20', 10), 100);

  const hdrs = await headers();
  const sess = getSessionFromHeaders(hdrs as any);
  const userId = sess?.userId ?? null;
  if (!userId?.startsWith('local:')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const requester = userId.slice('local:'.length);
  const [admin] = await db.select().from(users).where(eq(users.username, requester)).limit(1);
  if (!admin || admin.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const where = and(
    q ? or(ilike(users.username, `%${q}%`)) : undefined,
    roleFilter ? eq(users.role, roleFilter) : undefined,
    statusFilter === 'active' ? eq(users.isActive, true) : undefined,
    statusFilter === 'suspended' ? eq(users.isActive, false) : undefined,
  );

  // Total count
  const [{ value: total }] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(users)
    .where(where as any);

  const rows = await db
    .select({
      username: users.username,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      lastSeenAt: userPresence.lastSeenAt,
      lastIp: userPresence.lastIp,
      city: userPresence.city,
      country: userPresence.country,
    })
    .from(users)
    .leftJoin(userPresence, eq(userPresence.username, users.username))
    .where(where as any)
    .orderBy(desc(users.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  // Compute session counts in one query
  const usernames = rows.map((r) => r.username);
  let sessionCounts: Record<string, number> = {};
  if (usernames.length > 0) {
    const userIds = usernames.map((u) => `local:${u}`);
    const now = new Date();
    const sc = await db
      .select({ userId: session.userId, c: sql<number>`count(*)::int` })
      .from(session)
      .where(and(inArray(session.userId, userIds), gt(session.expiresAt, now)))
      .groupBy(session.userId);
    sessionCounts = Object.fromEntries(sc.map((r) => [r.userId.replace('local:', ''), r.c]));
  }

  const data = rows.map((r) => ({
    ...r,
    activeSessions: sessionCounts[r.username] || 0,
  }));

  return NextResponse.json({ data, total, page, pageSize });
}
