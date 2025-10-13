'use client';

import { useEffect } from 'react';

export default function SignUpPage() {
  useEffect(() => {
    const m = document.cookie.match(/(?:^|;)\s*locale=([^;]+)/);
    const loc = m ? decodeURIComponent(m[1]) : 'fr';
    window.location.href = `/${loc}/sign-in`;
  }, []);
  return null;
}
