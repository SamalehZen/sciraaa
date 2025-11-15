"use client";

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

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = theme === "system" ? resolvedTheme : theme;
  const isDark = mounted && activeTheme === "dark";

  useEffect(() => {
    if (!isDark) {
      return;
    }

    if (window.UnicornStudio?.isInitialized) {
      window.UnicornStudio.init?.();
      return;
    }

    if (document.getElementById("unicorn-studio-loader")) {
      return;
    }

    window.UnicornStudio = window.UnicornStudio ?? {};
    window.UnicornStudio.isInitialized = false;

    const script = document.createElement("script");
    script.id = "unicorn-studio-loader";
    script.src = "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.29/dist/unicornStudio.umd.js";
    script.onload = () => {
      if (!window.UnicornStudio?.isInitialized) {
        window.UnicornStudio?.init?.();
        if (window.UnicornStudio) {
          window.UnicornStudio.isInitialized = true;
        }
      }
    };

    const parent = document.head ?? document.body;
    parent.appendChild(script);
  }, [isDark]);

  if (!isDark) {
    return null;
  }

  return (
    <div
      data-us-project="qF3qXhdiOxdUeQYH8wCK"
      className="pointer-events-none fixed inset-0 -z-10"
    />
  );
}
