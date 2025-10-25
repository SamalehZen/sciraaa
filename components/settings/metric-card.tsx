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
    <div className={cn("rounded-lg p-4 bg-secondary/30 border border-border text-foreground", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{title}</span>
        <div className="text-foreground/80">{icon}</div>
      </div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {subtitle ? <p className="text-[11px] text-muted-foreground mt-1">{subtitle}</p> : null}
    </div>
  );
}
