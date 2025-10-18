export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { db } from '@/lib/db';
import { auditLog } from '@/lib/db/schema';
import { and, between, desc, eq, gte, lt } from 'drizzle-orm';

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  const userId = url.searchParams.get('userId') || undefined;
  const action = url.searchParams.get('action') || undefined;
  const resourceType = url.searchParams.get('resourceType') || undefined;
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const where = [
    userId ? eq(auditLog.userId, userId) : undefined,
    action ? eq(auditLog.action, action) : undefined,
    resourceType ? eq(auditLog.resourceType, resourceType) : undefined,
    from && to ? and(gte(auditLog.createdAt, new Date(from)), lt(auditLog.createdAt, new Date(to))) : undefined,
  ].filter(Boolean) as any[];
  const rows = await db
    .select()
    .from(auditLog)
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(auditLog.createdAt))
    .limit(limit)
    .offset(offset);
  return NextResponse.json({ items: rows, limit, offset });
}