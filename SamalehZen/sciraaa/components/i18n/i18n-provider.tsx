"use client";

import React, { createContext, useContext, useMemo } from 'react';

export type SupportedLocale = 'fr' | 'en';

type I18nContextValue = {
  locale: SupportedLocale;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  dictionary,
  fallback,
  children,
}: {
  locale: SupportedLocale;
  dictionary: Record<string, string>;
  fallback: Record<string, string>;
  children: React.ReactNode;
}) {
  const value = useMemo<I18nContextValue>(() => {
    const t = (key: string, params?: Record<string, string | number>) => {
      let str = dictionary[key] ?? fallback[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          str = str.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
        }
      }
      return str;
    };
    return { locale, t };
  }, [locale, dictionary, fallback]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
