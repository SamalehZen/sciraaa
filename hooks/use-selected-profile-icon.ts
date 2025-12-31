'use client';

import { useState, useEffect } from 'react';

export function useSelectedProfileIcon(): string | null {
  const [icon, setIcon] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('hyper:selected-profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.icon) {
          setIcon(parsed.icon);
        }
      }
    } catch {}
  }, []);

  return icon;
}
