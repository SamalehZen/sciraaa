import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const authRoutes = ['/sign-in', '/sign-up'];
const protectedRoutes = ['/lookout', '/xql', '/settings'];

const SECRET = process.env.LOCAL_AUTH_SECRET || 'insecure-local-secret';

function base64UrlToBase64(input: string) {
  const pad = input.length % 4 === 2 ? '==' : input.length % 4 === 3 ? '=' : '';
  return input.replace(/-/g, '+').replace(/_/g, '/') + pad;
}

function base64ToBase64Url(input: string) {
  return input.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function strToUint8Array(str: string) {
  return new TextEncoder().encode(str);
}

function arrayBufferToBase64Url(buf: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const b64 = btoa(binary);
  return base64ToBase64Url(b64);
}

async function verifySessionTokenEdge(token: string | null | undefined): Promise<{ userId: string; email?: string } | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') return null;
  const [, body, signature] = parts as [string, string, string];

  try {
    const key = await crypto.subtle.importKey('raw', strToUint8Array(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const mac = await crypto.subtle.sign('HMAC', key, strToUint8Array(body));
    const expected = arrayBufferToBase64Url(mac);
    if (expected !== signature) return null;

    const json = atob(base64UrlToBase64(body));
    const data = JSON.parse(json);
    if (!data?.userId) return null;
    return { userId: data.userId as string, email: data.email as string | undefined };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('local.session')?.value || null;
  const session = await verifySessionTokenEdge(token);

  let response = NextResponse.next();

  // Allow some API routes without auth
  if (
    pathname === '/api/search' ||
    pathname.startsWith('/api/search/') ||
    pathname.startsWith('/api/upload') ||
    pathname.startsWith('/api/pusher/auth') ||
    pathname.startsWith('/api/presence/heartbeat')
  ) {
    return response;
  }

  if (
    pathname.startsWith('/api/payments/webhooks') ||
    pathname.startsWith('/api/auth/polar/webhooks') ||
    pathname.startsWith('/api/auth/dodopayments/webhooks') ||
    pathname.startsWith('/api/raycast')
  ) {
    return response;
  }

  // Compute username/role/active if session exists
  let username: string | null = null;
  let role: string | null = null;
  let isActive: boolean | null = null;
  if (session?.userId?.startsWith('local:')) {
    username = session.userId.slice('local:'.length);
    const cred = await db.query.users.findFirst({ where: eq(users.username, username) });
    role = cred?.role || null;
    isActive = cred?.isActive ?? null;
  }

  // Block suspended users globally (except minimal public pages & API)
  if (isActive === false) {
    // Return 403 for APIs
    if (pathname.startsWith('/api')) {
      return new NextResponse(JSON.stringify({ error: 'Compte suspendu' }), { status: 403 });
    }
    // Redirect to banned page for web
    if (!pathname.startsWith('/banned')) {
      return NextResponse.redirect(new URL('/banned', request.url));
    }
    return response;
  }

  // Guard Admin area
  if (pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
    if (!username) {
      return new NextResponse('Forbidden', { status: 403 });
    }
    if (role !== 'admin') {
      return new NextResponse('Forbidden', { status: 403 });
    }
    return response;
  }

  if (pathname === '/settings' || pathname === '/#settings') {
    if (!session) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
    return NextResponse.redirect(new URL('/#settings', request.url));
  }

  if (session && authRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (!session && protectedRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};