import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/local-session';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const authRoutes = ['/sign-in', '/sign-up'];
const protectedRoutes = ['/lookout', '/xql', '/settings'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('local.session')?.value || null;
  let session;
  try {
    session = verifySessionToken(token);
  } catch {
    session = null;
  }

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