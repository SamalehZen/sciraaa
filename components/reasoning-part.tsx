import React, { ReactNode, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import Marked from 'marked-react';
import { ReasoningUIPart } from 'ai';

import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning';
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

interface TableFlags {
  header?: boolean;
  align?: 'center' | 'left' | 'right' | null;
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

const MarkdownRenderer = React.memo(({ content }: { content: string }) => {
  const renderer = {
    code(code: string) {
      return (
        <pre
          key={Math.random()}
          className="bg-muted/70 dark:bg-muted/50 border border-border/60 rounded px-2 py-1.5 text-xs overflow-x-auto my-2"
        >
          <code className="text-foreground/90">{code}</code>
        </pre>
      );
    },
    codespan(code: string) {
      return (
        <code
          key={Math.random()}
          className="bg-muted/70 dark:bg-muted/50 text-foreground px-1 py-0.5 rounded border border-border/50 text-[11px]"
        >
          {code}
        </code>
      );
    },
    paragraph(text: ReactNode) {
      return (
        <p key={Math.random()} className="mb-2 last:mb-0 text-muted-foreground">
          {text}
        </p>
      );
    },
    strong(text: ReactNode) {
      return (
        <strong key={Math.random()} className="text-foreground font-semibold">
          {text}
        </strong>
      );
    },
    heading(text: ReactNode, level: number) {
      const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
      const classes = {
        h1: 'text-lg font-semibold mb-2 mt-3 text-foreground',
        h2: 'text-base font-semibold mb-1.5 mt-2.5 text-foreground',
        h3: 'text-base font-medium mb-1.5 mt-2 text-foreground',
        h4: 'text-base font-medium mb-1 mt-1.5 text-foreground',
        h5: 'text-base font-normal mb-1 mt-1.5 text-foreground',
        h6: 'text-base font-normal mb-1 mt-1.5 text-foreground',
      } as const;

      const className = classes[`h${level}` as keyof typeof classes] || '';
      return (
        <Tag key={Math.random()} className={className}>
          {text}
        </Tag>
      );
    },
    link(href: string, text: ReactNode) {
      return (
        <a
          key={Math.random()}
          href={href}
          target="_blank"
          className="text-primary hover:text-primary underline-offset-2 hover:underline"
        >
          {text}
        </a>
      );
    },
    list(body: ReactNode, ordered: boolean) {
      const Type = ordered ? 'ol' : 'ul';
      return (
        <Type
          key={Math.random()}
          className={`${ordered ? 'list-decimal' : 'list-disc'} pl-4 mb-2 last:mb-1 marker:text-muted-foreground/60 text-muted-foreground`}
        >
          {body}
        </Type>
      );
    },
    listItem(text: ReactNode) {
      return (
        <li key={Math.random()} className="mb-0.5 text-muted-foreground">
          {text}
        </li>
      );
    },
    blockquote(text: ReactNode) {
      return (
        <blockquote
          key={Math.random()}
          className="border-l-2 border-border pl-2 py-1 my-2 italic bg-muted/30 text-muted-foreground rounded"
        >
          {text}
        </blockquote>
      );
    },
    hr() {
      return <hr key={Math.random()} className="my-3 border-t border-border/80" />;
    },
    table(children: ReactNode[]) {
      return (
        <div key={Math.random()} className="overflow-x-auto mb-2">
          <table className="min-w-full border border-border/60 rounded text-xs">{children}</table>
        </div>
      );
    },
    tableRow(content: ReactNode) {
      return (
        <tr key={Math.random()} className="border-b border-border/80">
          {content}
        </tr>
      );
    },
    tableCell(children: ReactNode[], flags: TableFlags) {
      const align = flags.align ? `text-${flags.align}` : '';

      return flags.header ? (
        <th key={Math.random()} className={`px-1.5 py-1 font-medium bg-muted/60 text-foreground border border-border/60 ${align}`}>
          {children}
        </th>
      ) : (
        <td key={Math.random()} className={`px-1.5 py-1 text-muted-foreground border border-border/60 ${align}`}>
          {children}
        </td>
      );
    },
  };

  return (
    <div className="markdown-content space-y-1">
      <Marked value={content} renderer={renderer} />
    </div>
  );
});
MarkdownRenderer.displayName = 'MarkdownRenderer';

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
          className="w-full"
        >
          <div className={cn('bg-accent border border-border/80 rounded-lg overflow-hidden')}>
            <ReasoningTrigger
              disabledWhileStreaming
              className={cn(
                'bg-background/80 px-2.5 py-2 transition-colors',
                isComplete ? 'hover:bg-muted/50 cursor-pointer' : 'cursor-default',
              )}
            >
              {({ isOpen, isStreaming }) => (
                <div className="flex items-center justify-between gap-2">
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
                      onClick={(event) => {
                        event.stopPropagation();
                        setIsFullscreen(!isFullscreen);
                      }}
                      className="p-0.5 text-muted-foreground transition-colors hover:bg-muted rounded"
                      aria-label={isFullscreen ? 'Réduire' : 'Agrandir'}
                      type="button"
                    >
                      {isFullscreen ? (
                        <Minimize2 className="size-3" strokeWidth={2} />
                      ) : (
                        <Maximize2 className="size-3" strokeWidth={2} />
                      )}
                    </button>

                    {!isStreaming && (
                      <span className="text-muted-foreground">
                        {isOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </ReasoningTrigger>

            <ReasoningContent className="border-t border-border/80">
              <div
                ref={scrollRef}
                className={cn(
                  'overflow-y-auto bg-muted/20 px-2.5 py-2 text-xs leading-relaxed',
                  'scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-border',
                  'scrollbar-track-transparent',
                  isFullscreen ? 'max-h-[60vh]' : 'max-h-[180px]',
                )}
              >
                <div className="text-muted-foreground prose prose-sm max-w-none">
                  <MarkdownRenderer content={part.text} />
                </div>
              </div>
            </ReasoningContent>
          </div>
        </Reasoning>
      </div>
    );
  },
);

ReasoningPartView.displayName = 'ReasoningPartView';
