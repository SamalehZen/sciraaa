'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { LocalizedLink as Link } from '@/components/i18n/link';

interface AuthCardProps {
  title: string;
  description: string;
}

export default function AuthCard({ title, description }: AuthCardProps) {
  const { t, locale } = useT();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/local-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to sign in');
      }
      window.location.href = `/${locale}`;
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[380px] mx-auto">
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-medium">{title}</h1>
          <p className="text-sm text-muted-foreground/80">{description}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="username">{t('auth.username.label')}</label>
            <Input
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('auth.username.placeholder')}
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="password">{t('auth.password.label')}</label>
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.password.placeholder')}
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="text-xs text-destructive/90">{error}</p>}
          <Button type="submit" className="w-full h-10" disabled={loading}>
            {loading ? t('auth.signIn.loading') : t('auth.signIn.submit')}
          </Button>
        </form>

        <div className="pt-4">
          <p className="text-[11px] text-center text-muted-foreground/60 leading-relaxed">
            By continuing, you agree to our{' '}
            <Link href="/terms" className="hover:text-muted-foreground underline-offset-2 underline">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy-policy" className="hover:text-muted-foreground underline-offset-2 underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
