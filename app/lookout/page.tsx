export const dynamic = 'force-dynamic';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function LookoutRedirect() {
  const hdrs = await headers();
  const cookieHeader = hdrs.get('cookie') || '';
  const match = cookieHeader.match(/(?:^|;)\s*locale=([^;]+)/);
  const cookieLocale = match ? decodeURIComponent(match[1]) : null;
  const locale = cookieLocale === 'en' || cookieLocale === 'fr' ? cookieLocale : 'fr';
  redirect(`/${locale}/lookout`);
}
