'use client';

import { useEffect, useRef } from 'react';

export function PwaManager() {
  const registeredRef = useRef(false);

  useEffect(() => {
    if (registeredRef.current) return;
    registeredRef.current = true;

    if (typeof window === 'undefined') return;
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    let registration: ServiceWorkerRegistration | null = null;

    const register = async () => {
      try {
        registration = await navigator.serviceWorker.register('/sw.js');
        registration.update().catch(() => {});
      } catch {}
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        registration?.update().catch(() => {});
      }
    };

    register();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return null;
}
