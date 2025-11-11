"use client";
import { useI18n } from '@/components/i18n/i18n-provider';

export function useT() {
  const { t, locale } = useI18n();
  return { t, locale };
}
