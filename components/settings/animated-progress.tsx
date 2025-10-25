"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export function AnimatedProgress({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    requestAnimationFrame(() => {
      el.style.width = `${Math.max(0, Math.min(100, value))}%`;
    });
  }, [value]);

  return (
    <div className={cn("w-full bg-secondary rounded-full overflow-hidden", "h-1.5 md:h-2", className)}>
      <div
        ref={ref}
        className="h-full rounded-full transition-[width] duration-500 ease-out bg-gradient-to-r from-primary to-accent shadow-lg"
        style={{
          width: "0%",
        }}
      />
    </div>
  );
}
