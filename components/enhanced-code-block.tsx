'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { highlight } from 'sugar-high';
import { Geist_Mono } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Check, Copy, WrapText, ArrowLeftRight, Download, Terminal } from 'lucide-react';
import { toast } from 'sonner';

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  preload: true,
  display: 'swap',
});

interface EnhancedCodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  enableDownload?: boolean;
  elementKey?: string;
}

const EnhancedCodeBlock: React.FC<EnhancedCodeBlockProps> = React.memo(
  ({ code, language = 'javascript', showLineNumbers = true, enableDownload = true, elementKey }) => {
    const [isCopied, setIsCopied] = useState(false);
    const [isWrapped, setIsWrapped] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const lineCount = useMemo(() => code.split('\n').length, [code]);
    const isLargeBlock = lineCount > 30;

    const highlightedCode = useMemo(() => {
      try {
        return code.length < 10000 ? highlight(code) : code;
      } catch (error) {
        console.warn('Syntax highlighting failed:', error);
        return code;
      }
    }, [code]);

    const displayedCode = useMemo(() => {
      if (!isExpanded && isLargeBlock) {
        return code.split('\n').slice(0, 15).join('\n');
      }
      return code;
    }, [code, isExpanded, isLargeBlock]);

    const displayedHighlighted = useMemo(() => {
      if (!isExpanded && isLargeBlock) {
        return displayedCode.length < 10000
          ? highlight(displayedCode)
          : displayedCode;
      }
      return highlightedCode;
    }, [displayedCode, highlightedCode, isExpanded, isLargeBlock]);

    const handleCopy = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(code);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        toast.success('Code copied to clipboard');
      } catch (error) {
        console.error('Failed to copy code:', error);
        toast.error('Failed to copy code');
      }
    }, [code]);

    const handleDownload = useCallback(() => {
      try {
        const element = document.createElement('a');
        const file = new Blob([code], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `code.${language || 'txt'}`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        URL.revokeObjectURL(element.href);
        toast.success('Code downloaded');
      } catch (error) {
        console.error('Failed to download code:', error);
        toast.error('Failed to download code');
      }
    }, [code, language]);

    const toggleWrap = useCallback(() => {
      setIsWrapped((prev) => {
        toast.success(prev ? 'Code wrap disabled' : 'Code wrap enabled');
        return !prev;
      });
    }, []);

    const codeLines = displayedCode.split('\n');
    const maxLineNumberWidth = lineCount.toString().length;

    return (
      <div className="group relative my-6 rounded-xl border border-border/50 bg-gradient-to-br from-background to-muted/30 overflow-hidden shadow-md hover:shadow-lg hover:border-primary/30 transition-all duration-300">
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-muted/50 to-muted/30 border-b border-border/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10">
              <Terminal size={14} className="text-primary" />
            </div>
            <div className="flex items-center gap-2">
              {language && (
                <span className="text-xs font-semibold text-primary uppercase tracking-wider px-2 py-1 bg-primary/10 rounded-md">
                  {language}
                </span>
              )}
              <span className="text-xs text-muted-foreground font-medium">
                {lineCount} {lineCount === 1 ? 'line' : 'lines'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {enableDownload && (
              <button
                onClick={handleDownload}
                className={cn(
                  'p-2 rounded-lg border border-border/50 bg-background/50 hover:bg-background',
                  'text-muted-foreground hover:text-foreground',
                  'transition-all duration-200 hover:border-primary/50',
                )}
                title="Download code"
              >
                <Download size={14} />
              </button>
            )}

            <button
              onClick={toggleWrap}
              className={cn(
                'p-2 rounded-lg border border-border/50 bg-background/50 hover:bg-background',
                'transition-all duration-200 hover:border-primary/50',
                isWrapped ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
              title={isWrapped ? 'Disable wrap' : 'Enable wrap'}
            >
              {isWrapped ? <ArrowLeftRight size={14} /> : <WrapText size={14} />}
            </button>

            <button
              onClick={handleCopy}
              className={cn(
                'p-2 rounded-lg border border-border/50 bg-background/50 hover:bg-background',
                'transition-all duration-200 hover:border-primary/50',
                isCopied ? 'text-primary border-primary/30 bg-primary/5' : 'text-muted-foreground hover:text-foreground',
              )}
              title={isCopied ? 'Copied!' : 'Copy code'}
            >
              {isCopied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden">
          <div
            className={cn(
              'font-mono text-sm leading-relaxed p-4 bg-muted/20',
              isWrapped ? 'whitespace-pre-wrap break-words' : 'overflow-x-auto whitespace-pre',
            )}
            style={{
              fontFamily: geistMono.style.fontFamily,
            }}
          >
            <div className="grid gap-0">
              {showLineNumbers && (
                <div
                  className="absolute left-0 top-0 bottom-0 w-12 bg-muted/30 border-r border-border/50 text-muted-foreground text-right pr-3 pt-4 select-none pointer-events-none"
                  style={{
                    fontFamily: geistMono.style.fontFamily,
                  }}
                >
                  {codeLines.map((_, i) => (
                    <div key={`line-${i}`} className="h-6 leading-6 text-xs">
                      {i + 1}
                    </div>
                  ))}
                </div>
              )}

              <div className={showLineNumbers ? 'ml-14' : ''}>
                {codeLines.map((line, i) => (
                  <div
                    key={`code-${i}`}
                    className="h-6 leading-6 group/line hover:bg-primary/5 px-4 transition-colors duration-150 rounded-sm"
                    dangerouslySetInnerHTML={{
                      __html: line || '&nbsp;',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {isLargeBlock && !isExpanded && (
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none flex items-end justify-center pb-3">
              <button
                onClick={() => setIsExpanded(true)}
                className="px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors duration-200"
              >
                Show more ({lineCount - 15} lines)
              </button>
            </div>
          )}

          {isExpanded && isLargeBlock && (
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute bottom-2 right-2 px-3 py-1 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground text-xs transition-colors duration-200"
            >
              Show less
            </button>
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.code === nextProps.code &&
      prevProps.language === nextProps.language &&
      prevProps.showLineNumbers === nextProps.showLineNumbers &&
      prevProps.enableDownload === nextProps.enableDownload
    );
  },
);

EnhancedCodeBlock.displayName = 'EnhancedCodeBlock';

export { EnhancedCodeBlock };
