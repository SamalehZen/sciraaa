import React from 'react';
import { Spinner } from '@/components/ui/spinner';

export function StockAnalysisLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <Spinner className="w-8 h-8" />
      <div className="text-center space-y-2">
        <h3 className="font-semibold text-lg">📊 Analyse de stock en cours...</h3>
        <p className="text-sm text-muted-foreground">
          Lecture du fichier Excel et génération du rapport complet
        </p>
      </div>
    </div>
  );
}
