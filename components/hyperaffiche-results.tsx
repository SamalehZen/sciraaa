'use client';

import React, { useState } from 'react';
import { Image as ImageIcon, Download, Maximize2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SearchLoadingState } from './tool-invocation-list-view';

interface ImageGenerationResult {
  imageData: string;
  mimeType: string;
  prompt: string;
  aspectRatio?: string;
  textContent?: string;
}

interface HyperAfficheResultsProps {
  result: ImageGenerationResult;
  isLoading?: boolean;
  toolName?: 'generate' | 'edit' | 'compose';
}

const HyperAfficheCard: React.FC<{
  result: ImageGenerationResult;
  toolName?: string;
}> = ({ result, toolName }) => {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = `data:${result.mimeType};base64,${result.imageData}`;
    link.download = `hyperaffiche-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(result.prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const getToolLabel = () => {
    switch (toolName) {
      case 'generate':
        return 'Génération';
      case 'edit':
        return 'Édition';
      case 'compose':
        return 'Composition';
      default:
        return 'Image';
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            {getToolLabel()} HyperAffiche
          </CardTitle>
          {result.aspectRatio && (
            <Badge variant="outline">{result.aspectRatio}</Badge>
          )}
        </div>
        {result.textContent && (
          <CardDescription>{result.textContent}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Image Display */}
        <div className="relative group">
          <img
            src={`data:${result.mimeType};base64,${result.imageData}`}
            alt={result.prompt}
            className="w-full h-auto rounded-lg border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setImageModalOpen(true)}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Button
              variant="secondary"
              size="sm"
              className="gap-2"
              onClick={() => setImageModalOpen(true)}
            >
              <Maximize2 className="h-4 w-4" />
              Agrandir
            </Button>
          </div>
        </div>

        {/* Prompt Display */}
        <div className="bg-muted p-3 rounded-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Prompt utilisé :</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyPrompt}
              className="h-7 gap-1"
            >
              {copiedPrompt ? (
                <>
                  <Check className="h-3 w-3" />
                  Copié
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copier
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {result.prompt}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={downloadImage} className="flex-1 gap-2">
            <Download className="h-4 w-4" />
            Télécharger
          </Button>
        </div>

        {/* Full Image Modal */}
        <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Image complète</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-full">
              <img
                src={`data:${result.mimeType};base64,${result.imageData}`}
                alt={result.prompt}
                className="w-full h-auto"
              />
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export const HyperAfficheResults: React.FC<HyperAfficheResultsProps> = ({
  result,
  isLoading,
  toolName,
}) => {
  if (isLoading) {
    return <SearchLoadingState message="Génération de l'image en cours..." />;
  }

  if (!result || !result.imageData) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Aucune image générée</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center p-4">
      <HyperAfficheCard result={result} toolName={toolName} />
    </div>
  );
};
