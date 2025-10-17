import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { geolocation } from '@vercel/functions';
import { getSessionFromHeaders } from '@/lib/local-session';
import { db } from '@/lib/db';
import { userPresence } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { pusher } from '@/lib/realtime/pusher';
import { parseLocalUsername } from '@/lib/users';

export async function POST() {
  const hdrs = await headers();
  const sess = getSessionFromHeaders(hdrs as any);
  if (!sess?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const username = parseLocalUsername(sess.userId);
  if (!username) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const xfwd = hdrs.get('x-forwarded-for') || '';
  const ip = (xfwd.split(',')[0] || '').trim() || null;
  const userAgent = hdrs.get('user-agent') || null;
  const geo = geolocation(hdrs as any);

  const now = new Date();
  // Upsert into user_presence
  await db
    .insert(userPresence)
    .values({
      username,
      lastSeenAt: now,
      lastIp: ip,
      userAgent: userAgent,
      city: geo?.city || null,
      country: geo?.country || null,
      lat: typeof geo?.latitude === 'number' ? (geo!.latitude as number) : null,
      lon: typeof geo?.longitude === 'number' ? (geo!.longitude as number) : null,
    })
    .onConflictDoUpdate({
      target: userPresence.username,
      set: {
        lastSeenAt: now,
        lastIp: ip,
        userAgent: userAgent,
        city: geo?.city || null,
        country: geo?.country || null,
        lat: typeof geo?.latitude === 'number' ? (geo!.latitude as number) : null,
        lon: typeof geo?.longitude === 'number' ? (geo!.longitude as number) : null,
      },
    });

  // Broadcast presence update
  await pusher.trigger('presence-users', 'heartbeat', {
    username,
    lastSeenAt: now.toISOString(),
    ip,
    userAgent,
    approxLocation: geo ? { country: geo.country, city: geo.city, latitude: geo.latitude, longitude: geo.longitude } : undefined,
  });

  return NextResponse.json({ ok: true });
}
