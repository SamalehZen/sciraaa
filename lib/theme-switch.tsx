'use client';

import { cn } from '@/lib/utils';
import { MoonIcon, SunIcon } from 'lucide-react';

interface ThemeSwitchProps {
  className?: string;
  localTheme: 'light' | 'dark';
  setLocalTheme: (theme: 'light' | 'dark') => void;
}

export default function ThemeSwitch({ className, localTheme, setLocalTheme }: ThemeSwitchProps) {
  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setLocalTheme(localTheme === 'dark' ? 'light' : 'dark')}
      className={cn('inline-flex h-9 w-9 items-center justify-center', className)}
    >
      {localTheme === 'light' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
