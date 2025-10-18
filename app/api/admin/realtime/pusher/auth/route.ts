import { NextResponse } from 'next/server';
import { pusherServer, ONLINE_USERS_CHANNEL } from '@/lib/realtime/pusher-server';
import { requireAdmin } from '@/lib/auth-admin';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { user } from '@/lib/db/schema';

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json().catch(() => ({} as any));
  const socketId = body?.socket_id as string;
  const channelName = body?.channel_name as string;
  if (!socketId || !channelName) return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  if (channelName !== ONLINE_USERS_CHANNEL) return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  const me = await db.query.user.findFirst({ where: eq(user.id, admin.userId) });
  const presenceData = { user_id: admin.userId, user_info: { name: me?.name || '', image: me?.image || '' } } as any;
  // @ts-ignore
  const auth = pusherServer.authorizeChannel(socketId, channelName, presenceData);
  return NextResponse.json(auth);
}