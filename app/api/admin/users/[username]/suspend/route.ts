import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSessionFromHeaders } from '@/lib/local-session';
import { db } from '@/lib/db';
import { users, session, user as appUser } from '@/lib/db/schema';
import { and, eq, like, sql } from 'drizzle-orm';
import { logAudit } from '@/lib/audit';
import { pusher } from '@/lib/realtime/pusher';

export async function POST(req: Request, ctx: { params: { username: string } }) {
  const { username } = ctx.params;
  const hdrs = await headers();
  const sess = getSessionFromHeaders(hdrs as any);
  if (!sess?.userId?.startsWith('local:')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const actor = sess.userId.slice('local:'.length);
  const reason = (await req.json().catch(() => ({})))?.reason || undefined;

  const actorCred = await db.query.users.findFirst({ where: eq(users.username, actor) });
  if (!actorCred || actorCred.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const target = await db.query.users.findFirst({ where: eq(users.username, username) });
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.update(users).set({ isActive: false }).where(eq(users.username, username));

  // Delete DB sessions for this user
  const userId = `local:${username}`;
  await db.delete(session).where(eq(session.userId, userId));

  // Notify user via Pusher to display ban overlay
  try {
    await pusher.trigger(`private-user-${username}`, 'banned', { reason: reason ?? 'Compte suspendu' });
  } catch {}

  await logAudit({ actorUsername: actor, actorRole: actorCred.role, targetUsername: username, action: 'SUSPEND', metadata: { reason } });

  return NextResponse.json({ ok: true });
}
