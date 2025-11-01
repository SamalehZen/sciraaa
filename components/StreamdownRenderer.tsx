'use client';

import { useState, useEffect } from 'react';
import { parseIncompleteMarkdown } from 'streamdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// The theme to use for syntax highlighting with Shiki.
const shikiTheme = 'github-dark';

/**
 * Props for the StreamdownRenderer component.
 */
interface StreamdownRendererProps {
  /**
   * The stream of Uint8Array data to render as Markdown.
   */
  stream: ReadableStream<Uint8Array>;
}

/**
 * A client component that renders a stream of Markdown content.
 * It uses the `streamdown` library to parse and render the Markdown,
 * and supports features like syntax highlighting, math formulas, and Mermaid diagrams.
 */
export function StreamdownRenderer({ stream }: StreamdownRendererProps) {
  // The Markdown content that has been streamed so far.
  const [markdown, setMarkdown] = useState('');

  useEffect(() => {
    /**
     * Consumes the stream and updates the markdown state.
     */
    async function consumeStream() {
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let result;
      while (!(result = await reader.read()).done) {
        setMarkdown((prev) => prev + decoder.decode(result.value));
      }
    }
    consumeStream();
  }, [stream]);

  // Render the incomplete Markdown content.
  const renderedMarkdown = parseIncompleteMarkdown(markdown, {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [rehypeKatex],
    shiki: {
      theme: shikiTheme,
    },
    // Allow relative links and images for security.
    allowedImagePrefixes: ['/'],
    allowedLinkPrefixes: ['/'],
    mermaid: {},
  });

  return (
    <div className="prose dark:prose-invert">
      {renderedMarkdown}
    </div>
  );
}
