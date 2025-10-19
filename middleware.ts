import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/local-session';
import { maindb } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const authRoutes = ['/sign-in', '/sign-up'];
const protectedRoutes = ['/lookout', '/xql', '/settings'];
const adminRoot = '/admin';
const adminApiRoot = '/api/admin';

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

  if (pathname === '/api/search' || pathname.startsWith('/api/search/') || pathname.startsWith('/api/upload')) {
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

  if (pathname === '/settings' || pathname === '/#settings') {
    if (!session) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
    return NextResponse.redirect(new URL('/#settings', request.url));
  }

  if (session && authRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Enforce admin access for admin pages and APIs
  const isAdminPage = pathname === adminRoot || pathname.startsWith(`${adminRoot}/`);
  const isAdminApi = pathname === adminApiRoot || pathname.startsWith(`${adminApiRoot}/`);

  if (isAdminPage || isAdminApi) {
    if (!session?.userId) {
      return isAdminApi
        ? NextResponse.json({ error: 'forbidden' }, { status: 403 })
        : NextResponse.redirect(new URL('/sign-in', request.url));
    }

    try {
      const [u] = await maindb.select().from(user).where(eq(user.id, session.userId)).limit(1);
      const isAdmin = !!u && u.role === 'admin' && u.status !== 'suspended' && u.status !== 'deleted';
      if (!isAdmin) {
        return isAdminApi
          ? NextResponse.json({ error: 'forbidden' }, { status: 403 })
          : NextResponse.redirect(new URL('/sign-in', request.url));
      }
    } catch {
      return isAdminApi
        ? NextResponse.json({ error: 'forbidden' }, { status: 403 })
        : NextResponse.redirect(new URL('/sign-in', request.url));
    }
  }

  // Block non-authenticated users from protected non-admin routes
  if (!session && (protectedRoutes.some((route) => pathname.startsWith(route)))) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
