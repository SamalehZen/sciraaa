import { ReactNode } from 'react';
import { I18nProvider, type SupportedLocale } from '@/components/i18n/i18n-provider';
import { loadDictionary, loadFallback } from '@/lib/i18n/dictionaries';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: SupportedLocale };
}) {
  const dict = await loadDictionary(params.locale);
  const fallback = await loadFallback();
  return <I18nProvider locale={params.locale} dictionary={dict} fallback={fallback}>{children}</I18nProvider>;
}
