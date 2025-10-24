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
    <div className={cn("rounded-xl p-4 bg-[#2a2a2a] text-white", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#a0a0a0]">{title}</span>
        <div className="text-white/80">{icon}</div>
      </div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {subtitle ? <p className="text-[11px] text-[#a0a0a0] mt-1">{subtitle}</p> : null}
    </div>
  );
}
