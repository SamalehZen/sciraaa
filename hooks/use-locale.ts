import { useLanguageContext } from '@/providers/language-provider';

export function useLocale() {
  const { locale, setLocale, t } = useLanguageContext();
  return { locale, setLocale, t };
}
