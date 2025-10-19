"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface ResearchProcessStepsProps {
  steps: string[];
  completedCount: number; // number of steps validated (0..steps.length)
  className?: string;
  title?: string;
}

export const ResearchProcessSteps: React.FC<ResearchProcessStepsProps> = ({
  steps,
  completedCount,
  className,
  title = "Research Process",
}) => {
  return (
    <div className={cn("rounded-lg border border-border/60 bg-background/50", className)}>
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10">
            <svg className="h-3.5 w-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 6h7m-7 6h7m-7 6h7M6 6h.01M6 12h.01M6 18h.01" />
            </svg>
          </div>
          <h3 className="font-medium text-sm">{title}</h3>
        </div>
      </div>
      <div className="px-3 pb-3">
        <div className="relative ml-4">
          {steps.map((label, idx) => {
            const done = idx < completedCount;
            const isActive = idx === completedCount && completedCount < steps.length;
            const isLast = idx === steps.length - 1;

            return (
              <div key={idx} className="relative pl-3 py-1">
                {/* vertical connector */}
                {!isLast && (
                  <div
                    className="absolute left-0 top-3 w-[2px] bg-neutral-300 dark:bg-neutral-700"
                    style={{ height: "calc(100% + 4px)", transform: "translateX(-50%)" }}
                  />
                )}

                {/* bullet bg */}
                <div
                  className="absolute left-0 top-2 bg-background rounded-full"
                  style={{ width: 10, height: 10, transform: "translateX(-50%)" }}
                />

                {/* bullet state */}
                <div
                  className={cn(
                    "absolute left-0 top-[10px] rounded-full transition-colors",
                    done ? "bg-[#70665D] dark:bg-[#C7C0B9]" : isActive ? "bg-[#70665D]/70 dark:bg-[#C7C0B9]/80 animate-pulse" : "bg-neutral-400 dark:bg-neutral-600",
                  )}
                  style={{ width: 8, height: 8, transform: "translateX(-50%)" }}
                  aria-hidden
                />

                {/* label */}
                <div className={cn("text-[12px] leading-tight", done ? "text-foreground" : isActive ? "text-[#70665D] dark:text-[#C7C0B9]" : "text-muted-foreground")}>{label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
