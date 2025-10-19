"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { ResearchProcessSteps } from "@/components/research-process-steps";
import { cn } from "@/lib/utils";

interface PdfExcelResearchProcessOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  title?: string;
}

export const PdfExcelResearchProcessOverlay: React.FC<PdfExcelResearchProcessOverlayProps> = ({
  open,
  onOpenChange,
  onComplete,
  title = "Analyse et extraction des tables…",
}) => {
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

  // Durées: tout instantané sauf Export (index 6) et Vérification (index 7)
  const durations = useMemo(() => steps.map((_, i) => (i < 6 ? 0 : i === 6 ? 700 : 1100)), [steps]);

  const [completedCount, setCompletedCount] = useState(0);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    if (!open) return;
    setCompletedCount(0);
    // Enchaîner les étapes
    let acc = 0;
    const tHandles: number[] = [];
    for (let i = 0; i < steps.length; i++) {
      acc += durations[i];
      const handle = window.setTimeout(() => {
        setCompletedCount(i + 1);
        if (i + 1 === steps.length) {
          // Terminé — notifier le parent
          // délai minuscule pour laisser le DOM se peindre
          window.setTimeout(() => onComplete(), 80);
        }
      }, acc);
      tHandles.push(handle);
    }
    timersRef.current = tHandles;
    return () => {
      timersRef.current.forEach((h) => window.clearTimeout(h));
      timersRef.current = [];
    };
  }, [open, steps, durations, onComplete]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className={cn("w-full sm:max-w-sm flex flex-col gap-2")}> 
        <DrawerHeader className="pb-2 border-b border-border/60">
          <DrawerTitle className="text-sm">{title}</DrawerTitle>
        </DrawerHeader>
        <div className="p-3">
          <ResearchProcessSteps steps={steps} completedCount={completedCount} title="Research Process" />
        </div>
      </DrawerContent>
    </Drawer>
  );
};
