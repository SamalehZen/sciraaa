export const SUPPORTED_LOCALES = ['fr-FR', 'en-US'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = 'fr-FR';

export function mapLocaleToHtmlLang(l: SupportedLocale): 'fr' | 'en' {
  return l === 'fr-FR' ? 'fr' : 'en';
}

export function normalizeDateInput(date: Date | string | number): Date {
  if (date instanceof Date) return date;
  if (typeof date === 'string' || typeof date === 'number') return new Date(date);
  return new Date(date as any);
}

export function formatDate(
  date: Date | string | number,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  try {
    const d = normalizeDateInput(date);
    return new Intl.DateTimeFormat(locale || DEFAULT_LOCALE, options).format(d);
  } catch {
    const d = normalizeDateInput(date);
    return new Intl.DateTimeFormat(DEFAULT_LOCALE, options).format(d);
  }
}

export function formatCurrency(
  value: number,
  locale: string,
  currency: 'EUR' | 'USD' = 'EUR',
  options?: Intl.NumberFormatOptions,
): string {
  try {
    return new Intl.NumberFormat(locale || DEFAULT_LOCALE, {
      style: 'currency',
      currency,
      ...options,
    }).format(value);
  } catch {
    return new Intl.NumberFormat(DEFAULT_LOCALE, {
      style: 'currency',
      currency,
      ...options,
    }).format(value);
  }
}

// Lightweight server-safe translate helper for Server Components
// Note: client t() is provided by the LanguageProvider
import fr from '@/locales/fr-FR.json';
import en from '@/locales/en-US.json';

const DICTS: Record<SupportedLocale, any> = {
  'fr-FR': fr,
  'en-US': en,
};

export function tServer(key: string, locale: SupportedLocale, vars?: Record<string, string | number>): string {
  const dict = DICTS[locale] || DICTS[DEFAULT_LOCALE];
  const value = key.split('.').reduce<any>((acc, k) => (acc && acc[k] != null ? acc[k] : undefined), dict);
  const base = typeof value === 'string' ? value : key;
  if (!vars) return base;
  return Object.keys(vars).reduce((s, k) => s.replace(new RegExp(`{${k}}`, 'g'), String(vars[k]!)), base);
}
