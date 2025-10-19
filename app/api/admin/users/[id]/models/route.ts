export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { and, desc, eq } from 'drizzle-orm';
import { db, maindb } from '@/lib/db';
import { user, productModel, userModelAccess } from '@/lib/db/schema';
import { assertAdmin } from '@/lib/auth';
import { pusher } from '@/lib/pusher';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const hdrs = await headers();
  const adminUser = await assertAdmin({ headers: hdrs });
  if (!adminUser) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const id = decodeURIComponent(params.id);
  const u = await maindb.query.user.findFirst({ where: eq(user.id, id) });
  if (!u) return NextResponse.json({ error: 'user not found' }, { status: 404 });

  const rows = await maindb
    .select({ id: productModel.id, key: productModel.key, name: productModel.name, status: productModel.status })
    .from(userModelAccess)
    .innerJoin(productModel, eq(userModelAccess.modelId, productModel.id))
    .where(eq(userModelAccess.userId, id))
    .orderBy(desc(productModel.createdAt));

  return NextResponse.json({ models: rows });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const hdrs = await headers();
  const adminUser = await assertAdmin({ headers: hdrs });
  if (!adminUser) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const id = decodeURIComponent(params.id);
  const body = await req.json().catch(() => ({}));
  const modelKey = String(body?.modelKey || '').trim();
  if (!modelKey) return NextResponse.json({ error: 'modelKey required' }, { status: 400 });

  const mdl = await maindb.query.productModel.findFirst({ where: eq(productModel.key, modelKey) });
  if (!mdl) return NextResponse.json({ error: 'model not found' }, { status: 404 });

  const existing = await maindb
    .query.userModelAccess
    .findFirst({ where: and(eq(userModelAccess.userId, id), eq(userModelAccess.modelId, mdl.id)) })
    .catch(() => null as any);
  if (existing) return NextResponse.json({ ok: true });

  await db.insert(userModelAccess).values({ userId: id, modelId: mdl.id, createdAt: new Date() });
  try { await pusher.trigger('private-admin-users', 'modelAccessChanged', { userId: id, modelKey, action: 'grant' }); } catch {}
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const hdrs = await headers();
  const adminUser = await assertAdmin({ headers: hdrs });
  if (!adminUser) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const id = decodeURIComponent(params.id);
  const body = await req.json().catch(() => ({}));
  const modelKey = String(body?.modelKey || '').trim();
  if (!modelKey) return NextResponse.json({ error: 'modelKey required' }, { status: 400 });

  const mdl = await maindb.query.productModel.findFirst({ where: eq(productModel.key, modelKey) });
  if (!mdl) return NextResponse.json({ ok: true });

  await db.delete(userModelAccess).where(and(eq(userModelAccess.userId, id), eq(userModelAccess.modelId, mdl.id)));
  try { await pusher.trigger('private-admin-users', 'modelAccessChanged', { userId: id, modelKey, action: 'revoke' }); } catch {}
  return NextResponse.json({ ok: true });
}
