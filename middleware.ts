import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/local-session';

const LOCALES = ['fr', 'en'] as const;
const SHORTLINKS = new Set(['/ph', '/raycast', '/plst', '/blog']);

function isLocalePrefixed(pathname: string) {
  const seg = pathname.split('/').filter(Boolean)[0];
  return seg === 'fr' || seg === 'en';
}

function getFirstTwoSegments(pathname: string) {
  const segs = pathname.split('/').filter(Boolean);
  return { first: segs[0] || '', second: segs[1] || '' };
}

function isExcluded(pathname: string) {
  if (pathname.startsWith('/_next')) return true;
  if (pathname.startsWith('/api')) return true;
  if (pathname === '/robots.txt') return true;
  if (pathname === '/manifest.ts') return true;
  if (pathname === '/favicon.ico' || pathname === '/favicon.svg') return true;
  if (pathname === '/icon.png' || pathname === '/apple-icon.png') return true;
  if (pathname === '/opengraph-image.png' || pathname === '/twitter-image.png') return true;
  if (SHORTLINKS.has(pathname)) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const token = request.cookies.get('local.session')?.value || null;
  let session: any = null;
  try {
    session = verifySessionToken(token);
  } catch {
    session = null;
  }

  if (isExcluded(pathname)) {
    return NextResponse.next();
  }

  // Fallback convenience: /settings -> /fr#settings
  if (pathname === '/settings' || pathname === '/#settings') {
    const url = new URL(request.url);
    url.pathname = '/fr';
    url.hash = '#settings';
    return NextResponse.redirect(url);
  }

  if (!isLocalePrefixed(pathname)) {
    const cookieLocale = request.cookies.get('locale')?.value;
    const locale = LOCALES.includes((cookieLocale as any) || '') ? (cookieLocale as 'fr' | 'en') : 'fr';
    const url = new URL(request.url);
    url.pathname = `/${locale}${pathname}`;
    return NextResponse.redirect(url);
  }

  const { first: locale, second: segment } = getFirstTwoSegments(pathname);

  if (segment === 'settings') {
    const url = new URL(request.url);
    url.pathname = `/${locale}`;
    url.hash = '#settings';
    return NextResponse.redirect(url);
  }

  if (session && (segment === 'sign-in' || segment === 'sign-up')) {
    const url = new URL(request.url);
    url.pathname = `/${locale}`;
    return NextResponse.redirect(url);
  }

  const protectedSecondSeg = new Set(['lookout', 'xql']);
  if (!session && protectedSecondSeg.has(segment)) {
    const url = new URL(request.url);
    url.pathname = `/${locale}/sign-in`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
