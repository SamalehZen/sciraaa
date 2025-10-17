import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSessionFromHeaders } from '@/lib/local-session';
import { db } from '@/lib/db';
import { users, session } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logAudit } from '@/lib/audit';
import { pusher } from '@/lib/realtime/pusher';

export async function POST(_req: Request, ctx: { params: { username: string } }) {
  const { username } = ctx.params;
  const hdrs = await headers();
  const sess = getSessionFromHeaders(hdrs as any);
  if (!sess?.userId?.startsWith('local:')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const actor = sess.userId.slice('local:'.length);

  const admin = await db.query.users.findFirst({ where: eq(users.username, actor) });
  if (!admin || admin.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const userId = `local:${username}`;
  await db.delete(session).where(eq(session.userId, userId));
  try {
    await pusher.trigger(`private-user-${username}`, 'force-logout', {});
  } catch {}

  await logAudit({ actorUsername: actor, actorRole: admin.role, targetUsername: username, action: 'UPDATE_PREFS', metadata: { terminateSessions: true } });
  return NextResponse.json({ ok: true });
}
