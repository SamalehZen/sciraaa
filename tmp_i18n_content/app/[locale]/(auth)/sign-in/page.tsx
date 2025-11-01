'use client';

import AuthCard from '@/components/auth-card';
import { useT } from '@/lib/i18n';

export default function SignInPage() {
  const { t } = useT();
  return <AuthCard title={t('auth.signIn.title')} description={t('auth.signIn.subtitle')} />;
}
