export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { productModel } from '@/lib/db/schema';
import { assertAdmin } from '@/lib/auth';
import { pusher } from '@/lib/pusher';

export async function GET(_req: NextRequest) {
  const hdrs = await headers();
  const adminUser = await assertAdmin({ headers: hdrs });
  if (!adminUser) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const models = await db.select().from(productModel).orderBy(desc(productModel.createdAt));
  return NextResponse.json({ models });
}

export async function POST(req: NextRequest) {
  const hdrs = await headers();
  const adminUser = await assertAdmin({ headers: hdrs });
  if (!adminUser) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id = body?.id as string | undefined;
  const key = String(body?.key || '').trim();
  const name = String(body?.name || '').trim();
  const status = (String(body?.status || 'active').trim() as 'active' | 'inactive');
  if (!key || !name) return NextResponse.json({ error: 'key and name required' }, { status: 400 });

  const existing = await db.query.productModel.findFirst({ where: eq(productModel.key, key) }).catch(() => null as any);

  if (existing) {
    const [updated] = await db.update(productModel).set({ name, status, updatedAt: new Date() }).where(eq(productModel.key, key)).returning();
    try { await pusher.trigger('private-admin-users', 'modelAccessChanged', { type: 'modelsChanged' }); } catch {}
    return NextResponse.json({ model: updated });
  } else {
    const [created] = await db.insert(productModel).values({ key, name, status, createdAt: new Date(), updatedAt: new Date() }).returning();
    try { await pusher.trigger('private-admin-users', 'modelAccessChanged', { type: 'modelsChanged' }); } catch {}
    return NextResponse.json({ model: created });
  }
}
