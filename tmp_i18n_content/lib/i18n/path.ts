export type Locale = 'fr' | 'en';

const shortlinks = new Set(['/ph', '/raycast', '/plst', '/blog']);

export function isSupportedLocale(segment: string | undefined): segment is Locale {
  return segment === 'fr' || segment === 'en';
}

export function getLocaleFromPath(pathname: string): Locale | null {
  const seg = '/' + pathname.replace(/^\/+/, '');
  const first = seg.split('/')[1] || '';
  return isSupportedLocale(first) ? (first as Locale) : null;
}

export function isExternalOrSpecial(href: string): boolean {
  if (!href) return true;
  if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('tel:')) return true;
  if (href.startsWith('#')) return true;
  if (href.startsWith('/api')) return true;
  if (shortlinks.has(href)) return true;
  return false;
}

export function ensureLocalePath(href: string, locale: Locale): string {
  if (isExternalOrSpecial(href)) return href;
  const hasLocale = isSupportedLocale(href.split('/')[1]);
  if (hasLocale) return href;
  return `/${locale}${href.startsWith('/') ? href : `/${href}`}`;
}

export function swapLocale(pathname: string, newLocale: Locale): string {
  const url = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const parts = url.split('?');
  const base = parts[0];
  const query = parts[1] ? `?${parts[1]}` : '';
  const segments = base.split('/').filter(Boolean);
  if (segments.length === 0) return `/${newLocale}${query}`;
  if (isSupportedLocale(segments[0])) {
    segments[0] = newLocale;
    return `/${segments.join('/')}${query}`;
  }
  return `/${newLocale}${base}${query}`;
}
