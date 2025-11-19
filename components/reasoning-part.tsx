import React, { useRef, useEffect } from 'react';
import { Minimize2, Maximize2, Sparkles, ChevronDown } from 'lucide-react';
import { ReasoningUIPart } from 'ai';

import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
  useReasoning,
} from '@/components/ai-elements/reasoning';
import { Streamdown } from '@/components/ai-elements/streamdown';
import { cn } from '@/lib/utils';

interface ReasoningPartViewProps {
  part: ReasoningUIPart;
  sectionKey: string;
  parallelTool: string | null;
  isExpanded: boolean;
  isFullscreen: boolean;
  setIsFullscreen: (v: boolean) => void;
  setIsExpanded: (v: boolean) => void;
}

const SpinnerIcon = React.memo(() => (
  <svg className="animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
));
SpinnerIcon.displayName = 'SpinnerIcon';

const TriggerContent: React.FC<{
  isComplete: boolean;
  parallelTool: string | null;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}> = ({ isComplete, parallelTool, isFullscreen, onToggleFullscreen }) => {
  const { isStreaming, isOpen } = useReasoning();

  return (
    <div className="flex w-full items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        {isStreaming ? (
          <span className="flex items-center gap-1.5 rounded-md border border-border/80 bg-muted/50 px-1.5 py-0.5 text-xs text-muted-foreground">
            <span className="size-2.5 text-muted-foreground">
              <SpinnerIcon />
            </span>
            <span>Réflexion</span>
            {parallelTool && <span className="opacity-60">({parallelTool})</span>}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
            <Sparkles className="size-3" strokeWidth={2} />
            <span>Raisonnement</span>
            {parallelTool && <span className="opacity-60">({parallelTool})</span>}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleFullscreen();
          }}
          className="p-0.5 text-muted-foreground transition-colors hover:bg-muted rounded"
          aria-label={isFullscreen ? 'Réduire' : 'Agrandir'}
        >
          {isFullscreen ? (
            <Minimize2 className="size-3" strokeWidth={2} />
          ) : (
            <Maximize2 className="size-3" strokeWidth={2} />
          )}
        </button>
        <ChevronDown
          className={cn('size-3 text-muted-foreground transition-transform', isOpen ? 'rotate-180' : 'rotate-0')}
        />
      </div>
    </div>
  );
};

const isEmptyContent = (content: string): boolean => {
  return !content || content.trim() === '' || /^\n+$/.test(content);
};

export const ReasoningPartView: React.FC<ReasoningPartViewProps> = React.memo(
  ({ part, sectionKey, parallelTool, isExpanded, isFullscreen, setIsFullscreen, setIsExpanded }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const isComplete = part.state === 'done';

    useEffect(() => {
      if (!isComplete && scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, [isComplete, part.text]);

    useEffect(() => {
      if (!isComplete && scrollRef.current && part.text && part.text.length > 0) {
        const timeout = setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 10);

        return () => clearTimeout(timeout);
      }
      return undefined;
    }, [part.text, isComplete]);

    const hasNonEmptyReasoning = part.text && !isEmptyContent(part.text);

    if (!hasNonEmptyReasoning) {
      return null;
    }

    return (
      <div className="my-2" key={sectionKey}>
        <Reasoning
          isStreaming={!isComplete}
          open={isExpanded}
          onOpenChange={setIsExpanded}
          className="rounded-lg border border-border/80 bg-accent/60 px-2.5 py-2"
        >
          <ReasoningTrigger className="w-full">
            <TriggerContent
              isComplete={isComplete}
              parallelTool={parallelTool}
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
            />
          </ReasoningTrigger>

          <ReasoningContent className="border-t border-border/80 pt-2">
            <div
              ref={scrollRef}
              className={cn(
                'overflow-y-auto bg-muted/20 px-2.5 py-2 text-xs leading-relaxed',
                'scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-border',
                'scrollbar-track-transparent',
                isFullscreen ? 'max-h-[60vh] rounded-b-lg' : 'max-h-[180px] rounded-b-lg',
              )}
            >
              <Streamdown>{part.text}</Streamdown>
            </div>
          </ReasoningContent>
        </Reasoning>
      </div>
    );
  },
);

ReasoningPartView.displayName = 'ReasoningPartView';
