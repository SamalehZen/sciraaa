'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share, Download } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { HyperLogo } from '@/components/logos/hyper-logo';

type DeferredInstallPrompt = {
  prompt: () => Promise<void>;
  userChoice?: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredInstallPrompt | null>(null);
  const [isDismissed, setIsDismissed] = useLocalStorage('installPromptDismissed', false);

  const isStandalone = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const mql = window.matchMedia?.('(display-mode: standalone)');
    return Boolean(mql?.matches || (navigator as any).standalone);
  }, []);

  const isIOS = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isDismissed || isStandalone) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as unknown as DeferredInstallPrompt);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isDismissed, isStandalone]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isDismissed || isStandalone) return;
    if (deferredPrompt) return;

    if (isIOS) {
      const timer = setTimeout(() => setShowPrompt(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isDismissed, isStandalone, deferredPrompt, isIOS]);

  const handleDismiss = () => {
    setShowPrompt(false);
    setDeferredPrompt(null);
    setIsDismissed(true);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice?.catch(() => null);
      setDeferredPrompt(null);
      setShowPrompt(false);
      if (result?.outcome === 'dismissed') {
        setIsDismissed(true);
      }
    } catch {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  if (isStandalone || isDismissed) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30, transition: { duration: 0.2 } }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-auto md:max-w-sm p-3 bg-card text-card-foreground shadow-xl rounded-lg border border-border overflow-hidden z-100"
        >
          <div className="flex items-start justify-between gap-3">
            <HyperLogo className="size-9" />

            <div className="flex-grow">
              <p className="text-sm font-semibold text-foreground">Installer Hyper sur votre appareil</p>

              {deferredPrompt ? (
                <p className="mt-0.5 text-xs text-muted-foreground inline-flex items-center gap-1">
                  Installez l’app pour un accès rapide et un meilleur mode hors ligne.
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-muted-foreground inline-flex items-center gap-1">
                  Touchez <Share className="w-3 h-3 text-primary" /> puis &quot;Ajouter à l’écran d’accueil&quot;{' '}
                  <span role="img" aria-label="plus icon" className="text-primary font-medium">
                    ➕
                  </span>
                </p>
              )}

              {deferredPrompt && (
                <div className="mt-2 flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleInstall}
                    className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Installer
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDismiss}
                    className="inline-flex h-9 items-center rounded-md border border-border/70 px-3 text-xs font-semibold"
                  >
                    Plus tard
                  </motion.button>
                </div>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleDismiss}
              className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors flex-shrink-0 -mr-1 -mt-1"
              aria-label="Fermer l’invite d’installation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
              </svg>
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

