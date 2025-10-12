import { NextRequest, NextResponse } from 'next/server';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, type SupportedLocale } from '@/lib/locale';

export async function POST(req: NextRequest) {
  try {
    const { locale } = (await req.json()) as { locale?: SupportedLocale };
    const l = SUPPORTED_LOCALES.includes(locale as any) ? (locale as SupportedLocale) : DEFAULT_LOCALE;
    const res = new NextResponse(JSON.stringify({ ok: true, locale: l }), { status: 200 });
    res.headers.set(
      'Set-Cookie',
      `scira-locale=${encodeURIComponent(l)}; Max-Age=31536000; Path=/; SameSite=Lax`
    );
    res.headers.set('Content-Type', 'application/json');
    return res;
  } catch {
    const res = new NextResponse(JSON.stringify({ ok: false }), { status: 400 });
    res.headers.set('Content-Type', 'application/json');
    return res;
  }
}
