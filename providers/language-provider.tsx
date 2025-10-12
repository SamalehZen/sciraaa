'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type SupportedLocale } from '@/lib/locale';
import fr from '@/locales/fr-FR.json';
import en from '@/locales/en-US.json';

type Dict = Record<string, any>;
const DICTS: Record<SupportedLocale, Dict> = {
  'fr-FR': fr as Dict,
  'en-US': en as Dict,
};

export type LanguageContextValue = {
  locale: SupportedLocale;
  setLocale: (l: SupportedLocale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = 'scira-locale';

function getByPath(dict: Dict, key: string): any {
  return key.split('.').reduce<any>((acc, k) => (acc && acc[k] != null ? acc[k] : undefined), dict);
}

export function LanguageProvider({ initialLocale, children }: { initialLocale?: SupportedLocale; children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(initialLocale || DEFAULT_LOCALE);

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as SupportedLocale | null;
      if (stored && SUPPORTED_LOCALES.includes(stored)) {
        if (stored !== locale) {
          setLocaleState(stored);
        }
        // Ensure cookie is in sync
        void fetch('/api/locale', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ locale: stored }) });
      } else if (initialLocale && initialLocale !== locale) {
        setLocaleState(initialLocale);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLocale = (l: SupportedLocale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {}
    try {
      void fetch('/api/locale', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ locale: l }) });
    } catch {}
  };

  const t = useMemo(() => {
    return (key: string, vars?: Record<string, string | number>) => {
      const dict = DICTS[locale] || DICTS[DEFAULT_LOCALE];
      const fallbackDict = DICTS['en-US'];
      const value = getByPath(dict, key) ?? getByPath(fallbackDict, key);
      const base = typeof value === 'string' ? value : key;
      if (!vars) return base;
      return Object.keys(vars).reduce((s, k) => s.replace(new RegExp(`{${k}}`, 'g'), String(vars[k]!)), base);
    };
  }, [locale]);

  const value = useMemo<LanguageContextValue>(() => ({ locale, setLocale, t }), [locale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguageContext() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguageContext must be used within LanguageProvider');
  return ctx;
}
