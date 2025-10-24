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
    <div className={cn("w-full h-2 bg-[#1e1e1e] rounded-full overflow-hidden", className)}>
      <div
        ref={ref}
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{
          width: "0%",
          background: "linear-gradient(90deg, #F5DEB3 0%, #FFD7B5 100%)",
        }}
      />
    </div>
  );
}
