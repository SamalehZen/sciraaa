
import { NextResponse } from 'next/server';
import { pusherServer, ONLINE_USERS_CHANNEL } from '@/lib/realtime/pusher-server';
import { getSessionFromHeaders } from '@/lib/local-session';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { user } from '@/lib/db/schema';

export async function POST(req: Request) {
  const hdrs = await headers();
  const session = getSessionFromHeaders(hdrs as any);
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const me = await db.query.user.findFirst({ where: eq(user.id, session.userId) });
  if (!me || (me as any).suspendedAt || (me as any).deletedAt) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { socket_id: socketId, channel_name: channelName } = await req.json().catch(() => ({} as any));
  if (!socketId || !channelName || channelName !== ONLINE_USERS_CHANNEL) return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  const presenceData = { user_id: me.id, user_info: { name: me.name || '', image: me.image || '' } } as any;
  // @ts-ignore
  const auth = pusherServer.authorizeChannel(socketId, channelName, presenceData);
  return NextResponse.json(auth);
}