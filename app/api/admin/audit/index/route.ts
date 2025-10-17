import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSessionFromHeaders } from '@/lib/local-session';
import { db } from '@/lib/db';
import { auditLog, users } from '@/lib/db/schema';
import { and, desc, eq, gte, ilike, lte, or } from 'drizzle-orm';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const qActor = url.searchParams.get('actor')?.trim() || '';
  const qTarget = url.searchParams.get('target')?.trim() || '';
  const action = url.searchParams.get('action')?.trim() || '';
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const pageSize = Math.min(parseInt(url.searchParams.get('pageSize') || '50', 10), 200);

  const hdrs = await headers();
  const sess = getSessionFromHeaders(hdrs as any);
  if (!sess?.userId?.startsWith('local:')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const actor = sess.userId.slice('local:'.length);
  const [admin] = await db.select().from(users).where(eq(users.username, actor)).limit(1);
  if (!admin || admin.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const where = and(
    qActor ? ilike(auditLog.actorUsername, `%${qActor}%`) : undefined,
    qTarget ? ilike(auditLog.targetUsername, `%${qTarget}%`) : undefined,
    action ? eq(auditLog.action, action) : undefined,
    from ? gte(auditLog.createdAt, new Date(from)) : undefined,
    to ? lte(auditLog.createdAt, new Date(to)) : undefined,
  );

  const rows = await db
    .select()
    .from(auditLog)
    .where(where as any)
    .orderBy(desc(auditLog.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return NextResponse.json({ data: rows, page, pageSize });
}
