"use client";
import React, { ComponentType, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BorderTrail } from "@/components/core/border-trail";
import { TextShimmer } from "@/components/core/text-shimmer";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { File02Icon as FileExcelIcon, Tick01Icon } from "@hugeicons/core-free-icons";



export interface PdfToExcelLoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number;
  duration?: number;
  iconComponent?: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}

export function PdfToExcelLoadingState({
  size = 80,
  duration = 5,
  className,
  iconComponent: Icon = FileExcelIcon,
  ...props
}: PdfToExcelLoadingStateProps) {
  const steps = useMemo(
    () => [
      "Lecture du PDF",
      "Analyse du contenu",
      "Prétraitement du PDF",
      "OCR (si nécessaire)",
      "Extraction des données",
      "Structuration des données",
      "Export vers Excel",
      "Vérification et nettoyage final",
    ],
    [],
  );

  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    const totalMs = 3000;
    const perStep = Math.max(120, Math.floor(totalMs / steps.length));
    const timers: NodeJS.Timeout[] = [];
    for (let i = 0; i < steps.length; i++) {
      timers.push(
        setTimeout(() => {
          setCompletedCount((c) => Math.max(c, i + 1));
        }, perStep * (i + 1)),
      );
    }
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [steps.length]);

  return (
    <Card
      className={cn("relative w-full my-4 overflow-hidden shadow-none", className)}
      role="status"
      aria-live="polite"
      aria-label="Conversion PDF → Excel en cours"
      {...props}
    >
      <BorderTrail
        className={cn(
          "bg-linear-to-l from-[#7D7064] via-[#70665D] to-[#3C3732]",
          "dark:from-[#C7C0B9] dark:via-[#A8998B] dark:to-[#8F877F]"
        )}
        size={size}
        transition={{ repeat: Infinity, duration, ease: "linear" }}
      />
      <CardContent className="px-6">
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-full flex items-center justify-center bg-[#EDEAE7]/60 dark:bg-[#3C3732]/40">
              <BorderTrail
                className={cn(
                  "bg-linear-to-l from-[#7D7064] via-[#70665D] to-[#3C3732]",
                  "dark:from-[#C7C0B9] dark:via-[#A8998B] dark:to-[#8F877F]"
                )}
                size={40}
                transition={{ repeat: Infinity, duration, ease: "linear" }}
              />
              <HugeiconsIcon icon={Icon} size={20} color="currentColor" strokeWidth={2} className={cn("text-[#70665D] dark:text-[#C7C0B9]")} />
            </div>
            <div className="space-y-2">
              <TextShimmer className="text-base font-medium" duration={1.6}>
                {"Conversion PDF → Excel en cours…"}
              </TextShimmer>
              <div className="flex gap-2">
                {[32, 48, 28].map((width, i) => (
                  <div
                    key={i}
                    className="h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 animate-pulse"
                    style={{ width: `${width}px`, animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="mt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
              {steps.map((label, idx) => {
                const done = idx < completedCount;
                const isActive = idx === completedCount && completedCount < steps.length;
                return (
                  <div key={idx} className={cn("flex items-center gap-2 text-[11px] leading-tight",
                    done ? "text-foreground" : isActive ? "text-[#70665D] dark:text-[#C7C0B9]" : "text-muted-foreground")}
                  >
                    <span className={cn("inline-flex items-center justify-center rounded-sm",
                      done ? "text-[#70665D] dark:text-[#C7C0B9]" : "text-muted-foreground")}
                    >
                      <HugeiconsIcon icon={Tick01Icon} size={12} strokeWidth={2} />
                    </span>
                    <span className={cn(isActive ? "animate-pulse" : "")}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
