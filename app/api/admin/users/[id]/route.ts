export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { db } from '@/lib/db';
import { chat, message, session, user as appUser, users } from '@/lib/db/schema';
import { and, count, desc, eq, sql } from 'drizzle-orm';
import { createAuditLog } from '@/lib/audit';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  const u = await db.query.user.findFirst({ where: eq(appUser.id, id) });
  if (!u) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const chats = await db.select({ c: count() }).from(chat).where(eq(chat.userId, id));
  const messages = await db
    .select({ c: count(), tokens: sql<number>`sum(${message.totalTokens})` })
    .from(message)
    .leftJoin(chat, eq(message.chatId, chat.id))
    .where(eq(chat.userId, id));
  const lastMessage = await db
    .select({ t: message.createdAt })
    .from(message)
    .leftJoin(chat, eq(message.chatId, chat.id))
    .where(eq(chat.userId, id))
    .orderBy(desc(message.createdAt))
    .limit(1);
  return NextResponse.json({
    user: u,
    stats: {
      chats: Number(chats?.[0]?.c || 0),
      messages: Number(messages?.[0]?.c || 0),
      tokens: Number(messages?.[0]?.tokens || 0),
      lastActive: lastMessage?.[0]?.t || null,
    },
  });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const id = params.id;
  const body = await req.json().catch(() => ({} as any));
  const op = String(body.op || '');
  if (!id || !op) return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  const ipAddress = (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '').split(',')[0] || null;
  const userAgent = req.headers.get('user-agent');

  if (op === 'suspend') {
    const [u] = await db.update(appUser).set({ suspendedAt: new Date() }).where(eq(appUser.id, id)).returning();
    if (!u) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await createAuditLog({ userId: admin.userId, action: 'suspend', resourceType: 'user', resourceId: id, metadata: {}, ipAddress, userAgent });
    return NextResponse.json({ ok: true });
  }

  if (op === 'resume') {
    const [u] = await db.update(appUser).set({ suspendedAt: null }).where(eq(appUser.id, id)).returning();
    if (!u) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await createAuditLog({ userId: admin.userId, action: 'resume', resourceType: 'user', resourceId: id, metadata: {}, ipAddress, userAgent });
    return NextResponse.json({ ok: true });
  }

  if (op === 'softDelete') {
    const [u] = await db.update(appUser).set({ deletedAt: new Date() }).where(eq(appUser.id, id)).returning();
    if (!u) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await createAuditLog({ userId: admin.userId, action: 'soft_delete', resourceType: 'user', resourceId: id, metadata: {}, ipAddress, userAgent });
    return NextResponse.json({ ok: true });
  }

  if (op === 'resetPassword') {
    const password = String(body.password || '');
    if (password.length < 3) return NextResponse.json({ error: 'Bad request' }, { status: 400 });
    if (!id.startsWith('local:')) return NextResponse.json({ error: 'Only local users' }, { status: 400 });
    const username = id.split(':')[1];
    const argon2 = await import('argon2');
    const passwordHash = await argon2.hash(password);
    await db
      .insert(users)
      .values({ username, passwordHash })
      .onConflictDoUpdate({ target: users.username, set: { passwordHash } });
    await db.delete(session).where(eq(session.userId, id));
    await createAuditLog({ userId: admin.userId, action: 'reset_password', resourceType: 'user', resourceId: id, metadata: {}, ipAddress, userAgent });
    return NextResponse.json({ ok: true });
  }

  if (op === 'updateRole') {
    const role = body.role === 'admin' ? 'admin' : 'user';
    const [u] = await db.update(appUser).set({ role }).where(eq(appUser.id, id)).returning();
    if (!u) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await createAuditLog({ userId: admin.userId, action: 'update_role', resourceType: 'user', resourceId: id, metadata: { role }, ipAddress, userAgent });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unsupported op' }, { status: 400 });
}