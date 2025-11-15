"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function UnicornBackground() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = theme === "system" ? resolvedTheme : theme;
  const isDark = mounted && activeTheme === "dark";

  if (!isDark) {
    return null;
  }

  return (
    <div className="spline-container pointer-events-none fixed inset-0 z-0" aria-hidden style={{ zIndex: 0 }}>
      <iframe
        src="https://my.spline.design/aidatamodelinteraction-mdTL3FktFVHgDvFr5TKtnYDV"
        frameBorder="0"
        width="100%"
        height="100%"
        id="aura-spline"
        className="h-full w-full"
        title="Spline background"
        allow="autoplay; fullscreen"
        loading="lazy"
      />
    </div>
  );
}
