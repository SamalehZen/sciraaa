import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSessionFromHeaders } from '@/lib/local-session';
import { db } from '@/lib/db';
import { users, user as appUser, userPresence, userPreferences, session } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logAudit } from '@/lib/audit';

export async function DELETE(_req: Request, ctx: { params: { username: string } }) {
  const { username } = ctx.params;
  const hdrs = await headers();
  const sess = getSessionFromHeaders(hdrs as any);
  if (!sess?.userId?.startsWith('local:')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const actor = sess.userId.slice('local:'.length);

  const actorCred = await db.query.users.findFirst({ where: eq(users.username, actor) });
  if (!actorCred || actorCred.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const target = await db.query.users.findFirst({ where: eq(users.username, username) });
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const userId = `local:${username}`;

  // Delete rows in auxiliary tables
  await db.delete(userPreferences).where(eq(userPreferences.username, username));
  await db.delete(userPresence).where(eq(userPresence.username, username));
  await db.delete(session).where(eq(session.userId, userId));

  // Delete from users (credentials)
  await db.delete(users).where(eq(users.username, username));
  // Delete from app user (cascades to chats/messages)
  await db.delete(appUser).where(eq(appUser.id, userId));

  await logAudit({ actorUsername: actor, actorRole: actorCred.role, targetUsername: username, action: 'DELETE_USER' });

  return NextResponse.json({ ok: true });
}
