import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSessionFromHeaders } from '@/lib/local-session';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logAudit } from '@/lib/audit';

export async function POST(_req: Request, ctx: { params: { username: string } }) {
  const { username } = ctx.params;
  const hdrs = await headers();
  const sess = getSessionFromHeaders(hdrs as any);
  if (!sess?.userId?.startsWith('local:')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const actor = sess.userId.slice('local:'.length);

  const actorCred = await db.query.users.findFirst({ where: eq(users.username, actor) });
  if (!actorCred || actorCred.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const target = await db.query.users.findFirst({ where: eq(users.username, username) });
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await _req.json().catch(() => ({}));
  const newPassword: string = (body?.password || '').trim();
  if (newPassword.length < 3) return NextResponse.json({ error: 'Mot de passe trop court' }, { status: 400 });

  const argon2 = await import('argon2');
  const hash = await argon2.hash(newPassword);
  await db.update(users).set({ passwordHash: hash }).where(eq(users.username, username));

  await logAudit({ actorUsername: actor, actorRole: actorCred.role, targetUsername: username, action: 'RESET_PASSWORD' });

  return NextResponse.json({ ok: true });
}
