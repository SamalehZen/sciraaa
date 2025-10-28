import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface PlainTextRendererProps {
  content: string;
  isUserMessage?: boolean;
}

export const PlainTextRenderer: React.FC<PlainTextRendererProps> = React.memo(
  ({ content, isUserMessage = false }) => {
    const formattedContent = useMemo(() => {
      // Handle code blocks first (triple backticks)
      const codeBlockPattern = /```[\s\S]*?```/g;
      const codeBlocks: Array<{ id: string; content: string }> = [];
      let processedContent = content;

      // Extract code blocks and replace with placeholders
      let match;
      let blockIndex = 0;
      const codeRegex = new RegExp(codeBlockPattern);
      const matches = [...content.matchAll(codeRegex)];

      for (const codeMatch of matches) {
        const id = `CODE_BLOCK_${blockIndex}_END`;
        const codeContent = codeMatch[0];
        codeBlocks.push({ id, content: codeContent });
        processedContent = processedContent.replace(codeContent, id);
        blockIndex++;
      }

      // Split content by double newlines for paragraphs
      const paragraphs = processedContent.split('\n\n').filter((p) => p.trim());

      const result: React.ReactNode[] = [];

      for (let pIndex = 0; pIndex < paragraphs.length; pIndex++) {
        const paragraph = paragraphs[pIndex];

        // Check if this is a code block placeholder
        if (paragraph.match(/CODE_BLOCK_\d+_END/)) {
          const blockIdMatch = paragraph.match(/CODE_BLOCK_(\d+)_END/);
          if (blockIdMatch) {
            const blockNum = parseInt(blockIdMatch[1]);
            const codeBlock = codeBlocks[blockNum];
            if (codeBlock) {
              const codeContent = codeBlock.content
                .replace(/^```[\w]*\n?/, '')
                .replace(/\n?```$/, '')
                .trim();
              result.push(
                <pre
                  key={`code-${pIndex}`}
                  className="my-4 p-4 bg-accent rounded-lg border border-border overflow-x-auto"
                >
                  <code className="text-sm font-mono text-foreground">{codeContent}</code>
                </pre>
              );
            }
          }
          continue;
        }

        // Check if this is a list item (starts with -, *, or digits.)
        const lines = paragraph.split('\n');
        const isListContent = lines.some((line) => /^\s*[-*]|\d+\./.test(line.trim()));

        if (isListContent) {
          result.push(
            <ul key={`list-${pIndex}`} className="my-4 ml-6 space-y-2 list-disc">
              {lines.map((line, lIndex) => {
                const trimmedLine = line.trim();
                if (/^\s*[-*]|\d+\./.test(trimmedLine)) {
                  const cleanText = trimmedLine.replace(/^[-*]\s+|\d+\.\s+/, '');
                  return (
                    <li key={`item-${pIndex}-${lIndex}`} className="text-foreground leading-relaxed">
                      {cleanText}
                    </li>
                  );
                }
                return null;
              })}
            </ul>
          );
        } else {
          // Regular paragraph
          result.push(
            <p
              key={`para-${pIndex}`}
              className={cn(
                'my-4 leading-relaxed text-foreground',
                isUserMessage && 'font-normal'
              )}
            >
              {lines.map((line, lineIdx) => (
                <React.Fragment key={`line-${pIndex}-${lineIdx}`}>
                  {line}
                  {lineIdx < lines.length - 1 && <br />}
                </React.Fragment>
              ))}
            </p>
          );
        }
      }

      return result;
    }, [content, isUserMessage]);

    return (
      <div
        className={cn(
          'prose prose-sm sm:prose-base prose-neutral dark:prose-invert',
          'prose-p:my-0 prose-p:leading-relaxed',
          'max-w-none text-foreground font-sans'
        )}
      >
        {formattedContent}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.content === nextProps.content && prevProps.isUserMessage === nextProps.isUserMessage;
  }
);

PlainTextRenderer.displayName = 'PlainTextRenderer';
