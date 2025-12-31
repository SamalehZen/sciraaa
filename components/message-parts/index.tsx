import React, { memo, useCallback, useState, useRef, useEffect } from 'react';
import { ReasoningUIPart, DataUIPart, isToolUIPart } from 'ai';
import { ReasoningPartView } from '@/components/reasoning-part';
import { MarkdownRenderer } from '@/components/markdown';
import { ChatTextHighlighter } from '@/components/chat-text-highlighter';
import { Button } from '@/components/ui/button';
import { deleteTrailingMessages } from '@/app/actions';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ShareButton } from '@/components/share';
import { HugeiconsIcon } from '@hugeicons/react';
import { RepeatIcon, Copy01Icon, CpuIcon } from '@hugeicons/core-free-icons';
import { ChatMessage, CustomUIDataTypes } from '@/lib/types';
import { UseChatHelpers } from '@ai-sdk/react';
import { HyperLogoHeader } from '@/components/hyper-logo-header';
import { EANSearchResults } from '@/components/ean-search-results';
import { EANLoadingState } from '@/components/ean-loading-state';

import {
  XCircle,
  Clock,
  ArrowRightIcon,
  ArrowLeftIcon,
  SigmaIcon,
  Info,
  Download,
} from 'lucide-react';
import { getModelConfig } from '@/ai/providers';
import { ComprehensiveUserData } from '@/lib/user-data-server';

function markdownTablesToXlsx(markdown: string, sheetName = 'pdf-to-excel') {
  const tableRegex = /(^\s*\|.+\|\s*$\n?)+/gm;
  const dividerRegex = /^\s*\|?\s*:?[-]+:?\s*(\|\s*:?[-]+:?\s*)*\|?\s*$/;
  const matches = markdown.match(tableRegex) || [];
  const rows = matches
    .map((block) =>
      block
        .trim()
        .split('\n')
        .filter((line) => line.trim().length > 0 && !dividerRegex.test(line.trim()))
        .map((line) =>
          line
            .trim()
            .replace(/^\|/, '')
            .replace(/\|$/, '')
            .split('|')
            .map((cell) => cell.trim()),
        ),
    )
    .filter((table) => table.length > 0);

  if (!rows.length) {
    return new Blob(['No structured tables detected'], { type: 'text/plain' });
  }

  const csvLines: string[] = [`Sheet,${sheetName}`];
  rows.forEach((table, idx) => {
    if (idx > 0) csvLines.push('');
    table.forEach((line) => {
      csvLines.push(line.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','));
    });
  });

  return new Blob([csvLines.join('\n')], { type: 'text/csv' });
}

// Error component for tool errors
const ToolErrorDisplay = ({ errorText, toolName }: { errorText: string; toolName: string }) => (
  <div className="w-full my-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
    <div className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center">
          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-900 dark:text-red-100">{toolName} failed</h3>
          <p className="text-xs text-red-700 dark:text-red-300 mt-1">{errorText}</p>
        </div>
      </div>
    </div>
  </div>
);

interface MessagePartRendererProps {
  part: ChatMessage['parts'][number];
  messageIndex: number;
  partIndex: number;
  parts: ChatMessage['parts'][number][];
  message: ChatMessage;
  status: string;
  hasActiveToolInvocations: boolean;
  reasoningVisibilityMap: Record<string, boolean>;
  reasoningFullscreenMap: Record<string, boolean>;
  setReasoningVisibilityMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setReasoningFullscreenMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  messages: ChatMessage[];
  user?: ComprehensiveUserData;
  isOwner?: boolean;
  selectedVisibilityType?: 'public' | 'private';
  chatId?: string;
  onVisibilityChange?: (visibility: 'public' | 'private') => void;
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  setSuggestedQuestions: (questions: string[]) => void;
  regenerate: UseChatHelpers<ChatMessage>['regenerate'];
  onHighlight?: (text: string) => void;
  annotations?: DataUIPart<CustomUIDataTypes>[];
  selectedGroup?: import('@/lib/utils').SearchGroupId;
}

export const MessagePartRenderer = memo<MessagePartRendererProps>(
  ({
    part,
    messageIndex,
    partIndex,
    parts,
    message,
    status,
    hasActiveToolInvocations,
    reasoningVisibilityMap,
    reasoningFullscreenMap,
    setReasoningVisibilityMap,
    setReasoningFullscreenMap,
    messages,
    user,
    isOwner,
    selectedVisibilityType,
    chatId,
    onVisibilityChange,
    setMessages,
    setSuggestedQuestions,
    regenerate,
    onHighlight,
    annotations,
    selectedGroup,
  }) => {
    // Handle text parts
    if (part.type === 'text') {
      // Check if there are any reasoning parts in the message
      const hasReasoningParts = parts.some((p) => p.type === 'reasoning');

      // For empty text parts in a streaming message, show loading animation only if no tool invocations and no reasoning parts are present
      if ((!part.text || part.text.trim() === '') && status === 'streaming' && !hasActiveToolInvocations && !hasReasoningParts) {
        return (
          <div
            key={`${messageIndex}-${partIndex}-loading`}
            className="flex flex-col min-h-[calc(100vh-18rem)] !m-0 !p-0"
          >
            <div className="flex space-x-2 ml-8 mt-2">
              <div
                className="w-2 h-2 rounded-full bg-muted-foreground dark:bg-muted-foreground animate-bounce"
                style={{ animationDelay: '0ms' }}
              ></div>
              <div
                className="w-2 h-2 rounded-full bg-muted-foreground dark:bg-muted-foreground animate-bounce"
                style={{ animationDelay: '150ms' }}
              ></div>
              <div
                className="w-2 h-2 rounded-full bg-muted-foreground dark:bg-muted-foreground animate-bounce"
                style={{ animationDelay: '300ms' }}
              ></div>
            </div>
          </div>
        );
      }

      // Skip empty text parts entirely for non-streaming states, but allow them during streaming with active tool invocations
      if (!part.text || part.text.trim() === '') {
        // Only skip if we're not streaming or if there are no active tool invocations
        if (status !== 'streaming' || !hasActiveToolInvocations) {
          return null;
        }
        // If we're streaming with active tool invocations, don't render anything for empty text but don't block other parts
        return <div key={`${messageIndex}-${partIndex}-empty`}></div>;
      }

      // Pre-compute metadata presentation values
      const meta = message?.metadata;
      const modelConfig = meta?.model ? getModelConfig(meta.model) : null;
      const modelLabel = modelConfig?.label ?? meta?.model ?? null;
      const tokenTotal = (meta?.totalTokens ?? (meta?.inputTokens ?? 0) + (meta?.outputTokens ?? 0)) || null;
      const inputCount = meta?.inputTokens ?? null;
      const outputCount = meta?.outputTokens ?? null;

      // Detect text sandwiched between step-start and tool-invocation
      const hasMarkdownTable = /\n\s*\|[^\n]+\|\s*\n\s*\|\s*[-:]+[^\n]*\|/.test(part.text || '');

      return (
        <div key={`${messageIndex}-${partIndex}-text`} className="mt-2">
          <div>
            <ChatTextHighlighter onHighlight={onHighlight} removeHighlightOnClick={true}>
              <MarkdownRenderer content={part.text} />
            </ChatTextHighlighter>
          </div>

          {/* Add compact buttons below the text with tooltips */}
          {status === 'ready' && (
            <div className="flex flex-row items-center justify-between gap-2 mt-2.5 mb-5 !-ml-1 flex-wrap">
              {/* Left side - Action buttons container */}
              <div className="flex flex-wrap items-center gap-1">
                {/* Only show reload for owners OR unauthenticated users on private chats */}
                {((user && isOwner) || (!user && selectedVisibilityType === 'private')) && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            try {
                              const lastUserMessage = messages.findLast((m) => m.role === 'user');
                              if (!lastUserMessage) return;

                              // Step 1: Delete trailing messages if user is authenticated
                              if (user && lastUserMessage.id) {
                                await deleteTrailingMessages({
                                  id: lastUserMessage.id,
                                });
                              }

                              // Step 2: Update local state to remove assistant messages
                              const newMessages = [];
                              // Find the index of the last user message
                              for (let i = 0; i < messages.length; i++) {
                                newMessages.push(messages[i]);
                                if (messages[i].id === lastUserMessage.id) {
                                  break;
                                }
                              }

                              // Step 3: Update UI state
                              setMessages(newMessages);
                              setSuggestedQuestions([]);

                              // Step 4: Reload
                              await regenerate();
                            } catch (error) {
                              console.error('Error in reload:', error);
                            }
                          }}
                          className="size-8 p-0 rounded-full"
                        >
                          <HugeiconsIcon icon={RepeatIcon} size={32} color="currentColor" strokeWidth={2} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Réécrire</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {/* Excel Download for pdfExcel group when tables present */}
                {selectedGroup === 'pdfExcel' && hasMarkdownTable && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            try {
                              const blob = markdownTablesToXlsx(part.text || '', 'pdf-to-excel');
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              const ts = new Date().toISOString().replace(/[:T]/g, '-').replace(/\..+/, '');
                              a.href = url;
                              a.download = `pdf-to-excel-${ts}.xlsx`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            } catch (e) {
                              console.error(e);
                              toast.error("Échec du téléchargement Excel");
                            }
                          }}
                          className="size-8 p-0 rounded-full"
                          aria-label="Télécharger en Excel (.xlsx)"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Télécharger en Excel (.xlsx)</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {/* Share button using unified component */}
                {onVisibilityChange && (
                  <ShareButton
                    chatId={chatId || null}
                    selectedVisibilityType={selectedVisibilityType || 'private'}
                    onVisibilityChange={async (visibility) => {
                      await Promise.resolve(onVisibilityChange(visibility));
                    }}
                    isOwner={isOwner}
                    user={user}
                    variant="icon"
                    size="sm"
                    className="rounded-full"
                  />
                )}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(part.text);
                          toast.success('Copied to clipboard');
                        }}
                        className="size-8 p-0 rounded-full"
                      >
                        <HugeiconsIcon icon={Copy01Icon} size={32} color="currentColor" strokeWidth={2} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copier</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Right side - Message metadata stats popover */}
              {meta && (
                <div className="flex items-center">
                  <HoverCard openDelay={100} closeDelay={100}>
                    <HoverCardTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 p-0 rounded-full touch-manipulation"
                        onTouchStart={() => { }} // Enable touch events
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent
                      className="w-72 max-w-[calc(100vw-2rem)]"
                      side="top"
                      align="end"
                      sideOffset={8}
                      alignOffset={-8}
                      avoidCollisions={true}
                      collisionPadding={16}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4" />
                          <h4 className="font-semibold text-sm">Info Réponse</h4>
                        </div>

                        {modelLabel && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Modèle</span>
                            <div className="flex items-center gap-1 text-xs bg-primary text-primary-foreground rounded-lg px-2 py-1">
                              <HugeiconsIcon icon={CpuIcon} size={12} />
                              {modelLabel}
                            </div>
                          </div>
                        )}

                        {typeof meta.completionTime === 'number' && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Temps de génération</span>
                            <div className="flex items-center gap-1 text-xs">
                              <Clock className="h-3 w-3" />
                              {meta.completionTime.toFixed(1)}s
                            </div>
                          </div>
                        )}

                        {(inputCount != null || outputCount != null) && (
                          <div className="space-y-2">
                            <span className="text-sm text-muted-foreground">Utilisation des jetons</span>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {inputCount != null && (
                                <div className="flex items-center justify-between bg-muted rounded-lg px-2 py-1">
                                  <span className="flex items-center gap-1">
                                    <ArrowLeftIcon className="h-3 w-3" />
                                    Entrée
                                  </span>
                                  <span className="font-medium">{inputCount.toLocaleString()}</span>
                                </div>
                              )}
                              {outputCount != null && (
                                <div className="flex items-center justify-between bg-muted rounded-lg px-2 py-1">
                                  <span className="flex items-center gap-1">
                                    <ArrowRightIcon className="h-3 w-3" />
                                    Sortie
                                  </span>
                                  <span className="font-medium">{outputCount.toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                            {tokenTotal != null && (
                              <div className="flex items-center justify-between bg-accent rounded-lg px-2 py-1 text-xs">
                                <span className="flex items-center gap-1 font-medium">
                                  <SigmaIcon className="h-3 w-3" />
                                  Total
                                </span>
                                <span className="font-semibold">{tokenTotal.toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // Handle reasoning parts
    if (part.type === 'reasoning') {
      const prevPart = parts[partIndex - 1];
      if (prevPart && prevPart.type === 'reasoning') {
        return null;
      }

      let nextIndex = partIndex;
      const mergedTexts: string[] = [];
      while (nextIndex < parts.length && parts[nextIndex]?.type === 'reasoning') {
        const r = parts[nextIndex] as unknown as ReasoningUIPart;
        if (typeof r.text === 'string' && r.text.length > 0) {
          mergedTexts.push(r.text);
        }
        nextIndex += 1;
      }

      const mergedPart: ReasoningUIPart = { ...(part as ReasoningUIPart), text: mergedTexts.join('\n\n') };

      const sectionKey = `${messageIndex}-${partIndex}`;
      const hasParallelToolInvocation = parts.some((p: ChatMessage['parts'][number]) => p.type.startsWith('tool-'));
      const isComplete = parts.some(
        (p: ChatMessage['parts'][number], i: number) =>
          i > partIndex && (p.type === 'text' || p.type.startsWith('tool-')),
      );
      const parallelTool = hasParallelToolInvocation
        ? (parts.find((p: ChatMessage['parts'][number]) => p.type.includes('tool-'))?.type.split('-')[1] ?? null)
        : null;

      const isExpanded = reasoningVisibilityMap[sectionKey] ?? !isComplete;
      const isFullscreen = reasoningFullscreenMap[sectionKey] ?? false;

      const setIsExpanded = (v: boolean) => setReasoningVisibilityMap((prev) => ({ ...prev, [sectionKey]: v }));
      const setIsFullscreen = (v: boolean) => setReasoningFullscreenMap((prev) => ({ ...prev, [sectionKey]: v }));

      return (
        <ReasoningPartView
          key={sectionKey}
          part={mergedPart}
          sectionKey={sectionKey}
          parallelTool={parallelTool}
          isExpanded={isExpanded}
          isFullscreen={isFullscreen}
          setIsExpanded={setIsExpanded}
          setIsFullscreen={setIsFullscreen}
        />
      );
    }

    // Handle step-start parts
    if (part.type === 'step-start') {
      const firstStepStartIndex = parts.findIndex((p) => p.type === 'step-start');
      if (partIndex === firstStepStartIndex) {
        return (
          <div key={`${messageIndex}-${partIndex}-step-start-logo`} className="!m-0 !p-0">
            <HyperLogoHeader />
          </div>
        );
      }
      return <div key={`${messageIndex}-${partIndex}-step-start`}></div>;
    }

    // Handle tool parts with new granular states system
    if (isToolUIPart(part)) {
      // Check if this part has the new state system
      if ('state' in part && part.state) {
        switch (part.type) {
          case 'tool-ean_search':
            switch (part.state) {
              case 'input-streaming': {
                const query = (part as any).input?.query || (part as any).args?.query || (part as any).input?.barcode || (part as any).args?.barcode;
                return <EANLoadingState key={`${messageIndex}-${partIndex}-tool`} barcode={query} />;
              }
              case 'input-available': {
                const query = (part as any).input?.query || (part as any).args?.query || (part as any).input?.barcode || (part as any).args?.barcode;
                return <EANLoadingState key={`${messageIndex}-${partIndex}-tool`} barcode={query} />;
              }
              case 'output-available': {
                const { barcode, results, images, totalResults, description, nutritionScores, nutrients } = (part as any).output || {};
                return (
                  <div key={`${messageIndex}-${partIndex}-tool`} className="space-y-4">
                    <EANSearchResults
                      barcode={barcode}
                      results={results || []}
                      images={images || []}
                      totalResults={totalResults ?? (results?.length || 0)}
                    />
                  </div>
                );
              }
              case 'output-error':
                return (
                  <ToolErrorDisplay
                    key={`${messageIndex}-${partIndex}-tool`}
                    errorText={(part as any).error}
                    toolName="EAN Search"
                  />
                );
            }
            break;

          default:
            return (
              <div key={`${messageIndex}-${partIndex}-tool`} className="text-gray-500 italic">
                {/* Fallback for other tools if any */}
              </div>
            );
        }
      }
    }

    return null;
  },
);
