import { NextResponse } from 'next/server';
import { clearCookie } from '@/lib/local-session';

export async function POST(request: Request) {
  const res = NextResponse.json({ success: true });
  const cookie = clearCookie();
  res.cookies.set(cookie.name, cookie.value, cookie.options);
  try {
    const { getSessionFromHeaders } = await import('@/lib/local-session');
    const session = getSessionFromHeaders(request.headers);
    if (session) {
      const { createAuditLog } = await import('@/lib/audit');
      const ipAddress = (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '').split(',')[0] || null;
      const userAgent = request.headers.get('user-agent');
      await createAuditLog({ userId: session.userId, action: 'logout', resourceType: 'auth', resourceId: session.userId, metadata: {}, ipAddress, userAgent });
    }
  } catch {}
  return res;
}
