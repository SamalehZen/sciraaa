'use client';

import { cn } from '@/lib/utils';
import type { ComponentProps, HTMLAttributes } from 'react';
import { isValidElement, memo, useState, useEffect } from 'react';
import ReactMarkdown, { type Options } from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { EnhancedCodeBlock } from './enhanced-code-block';
import hardenReactMarkdown from 'harden-react-markdown';
import 'katex/dist/katex.min.css';
import { Button } from '@/components/ui/button';
import { Copy, Check, Volume2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

function parseIncompleteMarkdown(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  let result = text;

  const linkImagePattern = /(!?\[)([^\]]*?)$/;
  const linkMatch = result.match(linkImagePattern);
  if (linkMatch) {
    const startIndex = result.lastIndexOf(linkMatch[1]);
    result = result.substring(0, startIndex);
  }

  const boldPattern = /(\*\*)([^*]*?)$/;
  const boldMatch = result.match(boldPattern);
  if (boldMatch) {
    const asteriskPairs = (result.match(/\*\*/g) || []).length;
    if (asteriskPairs % 2 === 1) {
      result = `${result}**`;
    }
  }

  const italicPattern = /(__)([^_]*?)$/;
  const italicMatch = result.match(italicPattern);
  if (italicMatch) {
    const underscorePairs = (result.match(/__/g) || []).length;
    if (underscorePairs % 2 === 1) {
      result = `${result}__`;
    }
  }

  const singleAsteriskPattern = /(\*)([^*]*?)$/;
  const singleAsteriskMatch = result.match(singleAsteriskPattern);
  if (singleAsteriskMatch) {
    const singleAsterisks = result.split('').reduce((acc, char, index) => {
      if (char === '*') {
        const prevChar = result[index - 1];
        const nextChar = result[index + 1];
        if (prevChar !== '*' && nextChar !== '*') {
          return acc + 1;
        }
      }
      return acc;
    }, 0);
    if (singleAsterisks % 2 === 1) {
      result = `${result}*`;
    }
  }

  const singleUnderscorePattern = /(_)([^_]*?)$/;
  const singleUnderscoreMatch = result.match(singleUnderscorePattern);
  if (singleUnderscoreMatch) {
    const singleUnderscores = result.split('').reduce((acc, char, index) => {
      if (char === '_') {
        const prevChar = result[index - 1];
        const nextChar = result[index + 1];
        if (prevChar !== '_' && nextChar !== '_') {
          return acc + 1;
        }
      }
      return acc;
    }, 0);
    if (singleUnderscores % 2 === 1) {
      result = `${result}_`;
    }
  }

  const inlineCodePattern = /(`)([^`]*?)$/;
  const inlineCodeMatch = result.match(inlineCodePattern);
  if (inlineCodeMatch) {
    const hasCodeBlockStart = result.includes('```');
    const codeBlockPattern = /```[\s\S]*?```/g;
    const allTripleBackticks = (result.match(/```/g) || []).length;
    const insideIncompleteCodeBlock = allTripleBackticks % 2 === 1;

    if (!insideIncompleteCodeBlock) {
      let singleBacktickCount = 0;
      for (let i = 0; i < result.length; i++) {
        if (result[i] === '`') {
          const isTripleStart = result.substring(i, i + 3) === '```';
          const isTripleMiddle =
            i > 0 && result.substring(i - 1, i + 2) === '```';
          const isTripleEnd = i > 1 && result.substring(i - 2, i + 1) === '```';
          if (!(isTripleStart || isTripleMiddle || isTripleEnd)) {
            singleBacktickCount++;
          }
        }
      }
      if (singleBacktickCount % 2 === 1) {
        result = `${result}\``;
      }
    }
  }

  const strikethroughPattern = /(~~)([^~]*?)$/;
  const strikethroughMatch = result.match(strikethroughPattern);
  if (strikethroughMatch) {
    const tildePairs = (result.match(/~~/g) || []).length;
    if (tildePairs % 2 === 1) {
      result = `${result}~~`;
    }
  }

  return result;
}

const HardenedMarkdown = hardenReactMarkdown(ReactMarkdown);

export type EnhancedResponseProps = HTMLAttributes<HTMLDivElement> & {
  options?: Options;
  children: Options['children'];
  allowedImagePrefixes?: ComponentProps<
    ReturnType<typeof hardenReactMarkdown>
  >['allowedImagePrefixes'];
  allowedLinkPrefixes?: ComponentProps<
    ReturnType<typeof hardenReactMarkdown>
  >['allowedLinkPrefixes'];
  defaultOrigin?: ComponentProps<
    ReturnType<typeof hardenReactMarkdown>
  >['defaultOrigin'];
  parseIncompleteMarkdown?: boolean;
  enableAnimations?: boolean;
  enableInteractiveFeatures?: boolean;
};

interface StreamingState {
  isStreaming: boolean;
  completedPercentage: number;
}

const AnimatedContainer: React.FC<{ children: React.ReactNode; isStreaming?: boolean }> = ({
  children,
  isStreaming,
}) => {
  const [displayedContent, setDisplayedContent] = useState<React.ReactNode>(null);

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedContent(children);
    } else {
      const timer = setTimeout(() => {
        setDisplayedContent(children);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [children, isStreaming]);

  return (
    <div className="animate-in fade-in-50 duration-300">
      {displayedContent || children}
    </div>
  );
};

const components: Options['components'] = {
  ol: ({ node, children, className, ...props }) => (
    <ol
      className={cn(
        'ml-6 list-outside list-decimal space-y-2 my-4',
        'text-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ node, children, className, ...props }) => (
    <li
      className={cn(
        'py-1 leading-relaxed',
        'marker:text-primary marker:font-semibold',
        className,
      )}
      {...props}
    >
      {children}
    </li>
  ),
  ul: ({ node, children, className, ...props }) => (
    <ul
      className={cn(
        'ml-6 list-outside list-disc space-y-2 my-4',
        'text-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </ul>
  ),
  hr: ({ node, className, ...props }) => (
    <hr
      className={cn(
        'my-8 border-t-2 border-gradient-to-r from-border/0 via-border to-border/0',
        'rounded-full',
        className,
      )}
      {...props}
    />
  ),
  strong: ({ node, children, className, ...props }) => (
    <span
      className={cn(
        'font-bold text-foreground',
        'bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  ),
  em: ({ node, children, className, ...props }) => (
    <span className={cn('italic text-foreground/90', className)} {...props}>
      {children}
    </span>
  ),
  a: ({ node, children, className, href, ...props }) => (
    <a
      className={cn(
        'font-medium text-primary hover:text-primary/80',
        'underline underline-offset-2 hover:underline-offset-4',
        'transition-all duration-200',
        'hover:shadow-sm',
        className,
      )}
      rel="noreferrer"
      target="_blank"
      href={href}
      {...props}
    >
      {children}
    </a>
  ),
  h1: ({ node, children, className, ...props }) => (
    <h1
      className={cn(
        'mt-8 mb-4 font-bold text-3xl md:text-4xl',
        'bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent',
        'tracking-tight',
        className,
      )}
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ node, children, className, ...props }) => (
    <h2
      className={cn(
        'mt-7 mb-3 font-bold text-2xl md:text-3xl',
        'text-foreground',
        'border-b border-primary/20 pb-2',
        className,
      )}
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ node, children, className, ...props }) => (
    <h3 className={cn('mt-6 mb-2 font-semibold text-xl md:text-2xl', 'text-foreground', className)} {...props}>
      {children}
    </h3>
  ),
  h4: ({ node, children, className, ...props }) => (
    <h4 className={cn('mt-5 mb-2 font-semibold text-lg', 'text-foreground', className)} {...props}>
      {children}
    </h4>
  ),
  h5: ({ node, children, className, ...props }) => (
    <h5 className={cn('mt-4 mb-2 font-semibold text-base', 'text-foreground', className)} {...props}>
      {children}
    </h5>
  ),
  h6: ({ node, children, className, ...props }) => (
    <h6 className={cn('mt-3 mb-2 font-semibold text-sm', 'text-muted-foreground', className)} {...props}>
      {children}
    </h6>
  ),
  table: ({ node, children, className, ...props }) => (
    <div className="my-6 overflow-x-auto rounded-lg border border-border/50">
      <table
        className={cn(
          'w-full border-collapse',
          'bg-muted/30 backdrop-blur-sm',
          className,
        )}
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ node, children, className, ...props }) => (
    <thead
      className={cn(
        'bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10',
        className,
      )}
      {...props}
    >
      {children}
    </thead>
  ),
  tbody: ({ node, children, className, ...props }) => (
    <tbody className={cn('divide-y divide-border/50', className)} {...props}>
      {children}
    </tbody>
  ),
  tr: ({ node, children, className, ...props }) => (
    <tr
      className={cn(
        'border-b border-border/50 hover:bg-primary/5 transition-colors duration-200',
        className,
      )}
      {...props}
    >
      {children}
    </tr>
  ),
  th: ({ node, children, className, ...props }) => (
    <th
      className={cn(
        'px-4 py-3 text-left font-semibold text-sm text-foreground',
        'border-r border-border/50 last:border-r-0',
        className,
      )}
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ node, children, className, ...props }) => (
    <td className={cn('px-4 py-3 text-sm text-foreground', 'border-r border-border/50 last:border-r-0', className)} {...props}>
      {children}
    </td>
  ),
  blockquote: ({ node, children, className, ...props }) => (
    <blockquote
      className={cn(
        'my-6 border-l-4 border-primary/30 pl-4 py-2 italic',
        'bg-primary/5 rounded-r-lg px-4',
        'text-foreground/80 hover:text-foreground transition-colors duration-200',
        className,
      )}
      {...props}
    >
      {children}
    </blockquote>
  ),
  code: ({ node, className, children, ...props }) => {
    const inline = node?.position?.start.line === node?.position?.end.line;
    if (!inline) {
      return <code className={className} {...props} />;
    }
    return (
      <code
        className={cn(
          'inline-block rounded-md px-2 py-1 font-mono text-sm',
          'bg-primary/10 text-primary font-semibold',
          'border border-primary/20',
          'hover:bg-primary/15 hover:border-primary/30 transition-colors duration-200',
          className,
        )}
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ node, className, children, ...props }) => {
    let language = 'javascript';
    let code = '';

    if (typeof node?.properties?.className === 'string') {
      language = node.properties.className.replace('language-', '');
    }

    if (
      isValidElement(children) &&
      children.props &&
      typeof (children.props as any).children === 'string'
    ) {
      code = (children.props as any).children;
    } else if (typeof children === 'string') {
      code = children;
    }

    return (
      <EnhancedCodeBlock
        code={code}
        language={language}
        showLineNumbers={true}
        enableDownload={true}
      />
    );
  },
};

export const EnhancedResponse = memo(
  (
    {
      className,
      options,
      children,
      allowedImagePrefixes,
      allowedLinkPrefixes,
      defaultOrigin,
      parseIncompleteMarkdown: shouldParseIncompleteMarkdown = true,
      enableAnimations = true,
      enableInteractiveFeatures = true,
      ...props
    }: EnhancedResponseProps,
  ) => {
    const [isVisible, setIsVisible] = useState(false);
    const [streamingState, setStreamingState] = useState<StreamingState>({
      isStreaming: false,
      completedPercentage: 0,
    });

    useEffect(() => {
      setIsVisible(true);
    }, []);

    const parsedChildren =
      typeof children === 'string' && shouldParseIncompleteMarkdown
        ? parseIncompleteMarkdown(children)
        : children;

    return (
      <div
        className={cn(
          'size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
          'transition-all duration-300',
          isVisible ? 'opacity-100' : 'opacity-0',
          enableAnimations && 'animate-in fade-in-50 slide-in-from-bottom-2 duration-500',
          className,
        )}
        {...props}
      >
        <div
          className={cn(
            'prose prose-neutral dark:prose-invert max-w-none',
            'text-foreground',
            'prose-headings:tracking-tight',
            'prose-p:leading-relaxed prose-p:my-4',
            'prose-a:break-all',
          )}
        >
          <HardenedMarkdown
            allowedImagePrefixes={allowedImagePrefixes ?? ['*']}
            allowedLinkPrefixes={allowedLinkPrefixes ?? ['*']}
            components={components}
            defaultOrigin={defaultOrigin}
            rehypePlugins={[rehypeKatex]}
            remarkPlugins={[remarkGfm, remarkMath]}
            {...options}
          >
            {parsedChildren}
          </HardenedMarkdown>
        </div>

        {enableInteractiveFeatures && (
          <div className="mt-6 flex items-center gap-2 pt-4 border-t border-border/30">
            <Button
              size="sm"
              variant="ghost"
              className="gap-2 text-xs hover:bg-primary/10"
              onClick={() => {
                navigator.clipboard.writeText(typeof children === 'string' ? children : '');
                toast.success('Copied to clipboard');
              }}
            >
              <Copy size={14} />
              Copy
            </Button>
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children && prevProps.enableAnimations === nextProps.enableAnimations,
);

EnhancedResponse.displayName = 'EnhancedResponse';

export default EnhancedResponse;
