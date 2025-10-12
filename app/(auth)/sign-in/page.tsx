'use client';

import AuthCard from '@/components/auth-card';
import { useLocale } from '@/hooks/use-locale';

export default function SignInPage() {
  const { t } = useLocale();
  return <AuthCard title={t('auth.signIn.title')} description={t('auth.signIn.description')} />;
}
