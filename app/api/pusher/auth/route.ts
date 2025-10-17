import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSessionFromHeaders } from '@/lib/local-session';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { pusher } from '@/lib/realtime/pusher';
import { geolocation } from '@vercel/functions';
import { parseLocalUsername } from '@/lib/users';

export async function POST(req: Request) {
  const body = await req.json();
  const { channel_name, socket_id } = body || {};
  if (!channel_name || !socket_id) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const hdrs = await headers();
  const sess = getSessionFromHeaders(hdrs as any);
  if (!sess?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const username = parseLocalUsername(sess.userId);
  if (!username) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cred = await db.query.users.findFirst({ where: eq(users.username, username) });
  if (!cred || cred.isActive === false) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const xfwd = hdrs.get('x-forwarded-for') || '';
  const ip = (xfwd.split(',')[0] || '').trim() || undefined;
  const userAgent = hdrs.get('user-agent') || undefined;
  const geo = geolocation(hdrs as any);

  const presenceData = {
    user_id: username,
    user_info: {
      username,
      userAgent,
      ip,
      approxLocation: geo ? { country: geo.country, city: geo.city, latitude: geo.latitude, longitude: geo.longitude } : undefined,
    },
  } as any;

  try {
    const auth = pusher.authenticate(socket_id, channel_name, presenceData);
    return new NextResponse(JSON.stringify(auth), { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 });
  }
}
