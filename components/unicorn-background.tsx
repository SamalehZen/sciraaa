"use client";

import Script from "next/script";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type UnicornStudioGlobal = {
  isInitialized?: boolean;
  init?: () => void;
} & Record<string, unknown>;

declare global {
  interface Window {
    UnicornStudio?: UnicornStudioGlobal;
  }
}

export function UnicornBackground() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [shouldLoadScript, setShouldLoadScript] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = theme === "system" ? resolvedTheme : theme;
  const isDark = mounted && activeTheme === "dark";

  useEffect(() => {
    if (isDark) {
      setShouldLoadScript(true);
    }
  }, [isDark]);

  useEffect(() => {
    if (!isDark) {
      return;
    }

    if (window.UnicornStudio?.init) {
      const timer = window.setTimeout(() => {
        window.UnicornStudio?.init?.();
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [isDark]);

  return (
    <>
      {isDark ? (
        <div data-us-project="qF3qXhdiOxdUeQYH8wCK" className="pointer-events-none fixed inset-0" />
      ) : null}
      {shouldLoadScript ? (
        <Script
          id="unicorn-studio-loader"
          src="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.29/dist/unicornStudio.umd.js"
          strategy="afterInteractive"
          onLoad={() => {
            if (window.UnicornStudio) {
              window.UnicornStudio.isInitialized = true;
              window.UnicornStudio.init?.();
            }
          }}
        />
      ) : null}
    </>
  );
}
