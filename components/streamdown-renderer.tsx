'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Streamdown, defaultRehypePlugins, defaultRemarkPlugins } from 'streamdown';
import type { MermaidConfig } from 'mermaid';
import type { BundledTheme } from 'shiki';
import { useTheme } from 'next-themes';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { highlightCodeToHtml, shikiThemes } from '@/lib/shiki-config';
import { mermaidConfigDark, mermaidConfigLight } from '@/lib/mermaid-config';

import 'katex/dist/katex.min.css';

interface ShikiThemeOption {
  light: BundledTheme;
  dark: BundledTheme;
}

interface MermaidThemeOption {
  light: MermaidConfig;
  dark: MermaidConfig;
}

interface StreamdownRendererProps {
  content: string;
  isUserMessage?: boolean;
  className?: string;
  isStreaming?: boolean;
  shikiTheme?: ShikiThemeOption;
  mermaidConfig?: MermaidThemeOption;
  allowedImagePrefixes?: string[];
  allowedLinkPrefixes?: string[];
}

const defaultAllowedImages = ['https://', 'http://', 'data:image/', '/api/', '/'];
const defaultAllowedLinks = ['https://', 'http://', 'mailto:', '#', '/'];

const defaultShikiTheme: ShikiThemeOption = {
  light: shikiThemes[0],
  dark: shikiThemes[1],
};

const defaultMermaidTheme: MermaidThemeOption = {
  light: mermaidConfigLight,
  dark: mermaidConfigDark,
};

type StreamdownRendererCodeChildren = ReactNode | ReactNode[];

function normalizeChildren(children: StreamdownRendererCodeChildren) {
  if (typeof children === 'string') {
    return children;
  }
  if (Array.isArray(children)) {
    return children.join('');
  }
  return String(children ?? '');
}

export function StreamdownRenderer({
  content,
  isUserMessage,
  className,
  isStreaming,
  shikiTheme,
  mermaidConfig,
  allowedImagePrefixes,
  allowedLinkPrefixes,
}: StreamdownRendererProps) {
  const { theme, systemTheme } = useTheme();
  const resolvedTheme = (theme === 'system' ? systemTheme : theme) ?? 'light';
  const shiki = shikiTheme ?? defaultShikiTheme;
  const mermaid = mermaidConfig ?? defaultMermaidTheme;
  const activeMermaidConfig = resolvedTheme === 'dark' ? mermaid.dark : mermaid.light;
  const activeShikiTheme = resolvedTheme === 'dark' ? shiki.dark : shiki.light;
  const images = allowedImagePrefixes ?? defaultAllowedImages;
  const links = allowedLinkPrefixes ?? defaultAllowedLinks;
  const streamdownClass = cn(
    'prose prose-sm sm:prose-base md:prose-lg',
    'prose-neutral dark:prose-invert',
    'max-w-none',
    'prose-headings:font-semibold',
    'prose-code:before:content-none prose-code:after:content-none',
    'prose-pre:bg-transparent',
    'prose-table:border-collapse',
    className,
  );

  const containerClass = cn('w-full', isUserMessage && 'text-right');

  const rehypePlugins = useMemo(() => [
    defaultRehypePlugins.harden,
    defaultRehypePlugins.raw,
    defaultRehypePlugins.katex,
  ], []);

  const remarkPlugins = useMemo(() => [defaultRemarkPlugins.gfm, defaultRemarkPlugins.math], []);

  const codeRenderer = useMemo(() => {
    return function CodeComponent({ inline, className: codeClassName, children, node, ...rest }: any) {
      if (inline) {
        return (
          <code className={cn('rounded bg-muted px-1 py-0.5 text-sm', codeClassName)} {...rest}>
            {children}
          </code>
        );
      }
      const [copied, setCopied] = useState(false);
      const [html, setHtml] = useState<string | null>(null);
      const raw = normalizeChildren(children as StreamdownRendererCodeChildren).replace(/\n$/, '');
      const language = typeof codeClassName === 'string' && codeClassName.includes('language-')
        ? codeClassName.replace('language-', '').split(' ')[0]
        : (node?.lang as string | undefined) ?? 'plaintext';

      useEffect(() => {
        let mounted = true;
        setHtml(null);
        highlightCodeToHtml(raw, language, activeShikiTheme)
          .then((result) => {
            if (mounted) {
              setHtml(result);
            }
          })
          .catch(() => {
            if (mounted) {
              setHtml(null);
            }
          });
        return () => {
          mounted = false;
        };
      }, [raw, language, activeShikiTheme]);

      const handleCopy = useCallback(async () => {
        try {
          await navigator.clipboard.writeText(raw);
          setCopied(true);
          toast.success('Code copié');
          setTimeout(() => setCopied(false), 2000);
        } catch (error) {
          toast.error('Impossible de copier le code');
        }
      }, [raw]);

      return (
        <div className="group relative my-4 overflow-hidden rounded-lg border border-border bg-accent/40">
          <div className="flex items-center justify-between border-b border-border bg-accent/60 px-4 py-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {language || 'plaintext'}
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground transition-opacity group-hover:opacity-100 opacity-0"
              onClick={handleCopy}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="relative">
            {html ? (
              <div dangerouslySetInnerHTML={{ __html: html }} />
            ) : (
              <pre className="max-h-[600px] overflow-auto bg-background/80 p-4 text-sm">
                <code>{raw}</code>
              </pre>
            )}
          </div>
        </div>
      );
    };
  }, [activeShikiTheme]);

  const imageRenderer = useMemo(() => {
    return function ImageComponent({ node: _node, src, alt, ...rest }: any) {
      const value = typeof src === 'string' ? src : '';
      const allowed = value ? images.some((prefix) => value.startsWith(prefix)) : false;
      if (!value || !allowed) {
        return (
          <span className="text-sm text-destructive">
            [Image non autorisée]
          </span>
        );
      }
      const { className: imageClassName, ...other } = rest;
      return (
        <img
          {...other}
          src={value}
          alt={alt ?? ''}
          loading="lazy"
          className={cn('max-w-full rounded-lg shadow-sm', imageClassName as string | undefined)}
        />
      );
    };
  }, [images]);

  const linkRenderer = useMemo(() => {
    return function LinkComponent({ node: _node, href, children, ...rest }: any) {
      const value = typeof href === 'string' ? href : '';
      const allowed = value ? links.some((prefix) => value.startsWith(prefix)) : false;
      if (!value || !allowed) {
        return (
          <span className="text-sm text-destructive">
            [Lien non autorisé]
          </span>
        );
      }
      const external = value.startsWith('http');
      const { className: linkClassName, ...other } = rest;
      return (
        <a
          {...other}
          href={value}
          className={cn('text-primary underline decoration-1 underline-offset-4 hover:text-primary/80', linkClassName as string | undefined)}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
        >
          {children}
        </a>
      );
    };
  }, [links]);

  const components = useMemo(
    () => ({
      code: codeRenderer,
      img: imageRenderer,
      a: linkRenderer,
    }),
    [codeRenderer, imageRenderer, linkRenderer],
  );

  return (
    <div className={containerClass}>
      <Streamdown
        className={streamdownClass}
        parseIncompleteMarkdown={Boolean(isStreaming)}
        isAnimating={Boolean(isStreaming)}
        controls={{ code: false }}
        shikiTheme={[shiki.light, shiki.dark]}
        mermaidConfig={activeMermaidConfig}
        rehypePlugins={rehypePlugins}
        remarkPlugins={remarkPlugins}
        components={components}
      >
        {content}
      </Streamdown>
    </div>
  );
}
