'use client';

import { StreamdownRenderer } from '@/components/StreamdownRenderer';
import { useState, useEffect } from 'react';

// An example Markdown string that will be streamed to the renderer.
const exampleMarkdown = `
# Streamdown Example

This is an example of a streamed AI response.

## Code Block

\`\`\`typescript
function helloWorld() {
  console.log('Hello, world!');
}
\`\`\`

## Mathematical Formula

$$
E = mc^2
$$

## Mermaid Diagram

\`\`\`mermaid
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
\`\`\`
`;

/**
 * Creates a ReadableStream from a string.
 * This is used to simulate a streaming response from an AI.
 * @param str The string to convert to a stream.
 * @returns A ReadableStream of the string.
 */
function createStreamFromString(str: string) {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(str);
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoded);
      controller.close();
    }
  });
}

/**
 * An example page that demonstrates the StreamdownRenderer component.
 */
export default function StreamingExamplePage() {
  // The stream to render.
  const [stream, setStream] = useState<ReadableStream<Uint8Array> | null>(null);

  useEffect(() => {
    // Create a stream from the example Markdown string when the component mounts.
    setStream(createStreamFromString(exampleMarkdown));
  }, []);

  return (
    <div className="p-4">
      {stream && <StreamdownRenderer stream={stream} />}
    </div>
  );
}
