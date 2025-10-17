import { NextResponse } from 'next/server';
import { clearCookie, getSessionFromHeaders } from '@/lib/local-session';
import { headers } from 'next/headers';
import { logAudit } from '@/lib/audit';
import { parseLocalUsername } from '@/lib/users';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST() {
  const hdrs = await headers();
  const sess = getSessionFromHeaders(hdrs as any);
  const xfwd = hdrs.get('x-forwarded-for') || '';
  const ip = (xfwd.split(',')[0] || '').trim() || null;
  const userAgent = hdrs.get('user-agent') || null;

  if (sess?.userId) {
    const uname = parseLocalUsername(sess.userId) || 'unknown';
    const cred = await db.query.users.findFirst({ where: eq(users.username, uname) });
    await logAudit({ actorUsername: uname, actorRole: cred?.role || 'user', action: 'LOGOUT', ip, userAgent });
  }

  const res = NextResponse.json({ success: true });
  const cookie = clearCookie();
  res.cookies.set(cookie.name, cookie.value, cookie.options);
  return res;
}