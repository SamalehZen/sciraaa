"use client";

import { cn } from "@/lib/utils";

export function MetricCard({
  title,
  icon,
  value,
  subtitle,
  className,
}: {
  title: string;
  icon: React.ReactNode;
  value: React.ReactNode;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg bg-secondary/40 border border-border/50 text-foreground hover:border-border/80 transition-colors", "p-3 md:p-4", className)}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] md:text-xs text-muted-foreground font-medium">{title}</span>
        <div className="text-foreground/70 opacity-80">{icon}</div>
      </div>
      <div className="text-xl md:text-2xl font-bold mt-2 text-foreground">{value}</div>
      {subtitle ? <p className="text-[10px] md:text-[11px] text-muted-foreground/80 mt-1.5">{subtitle}</p> : null}
    </div>
  );
}
