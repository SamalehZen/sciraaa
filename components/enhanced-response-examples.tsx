'use client';

import React from 'react';
import { EnhancedResponse } from './enhanced-response';
import '@/components/streaming-animations.css';

/**
 * Exemples d'utilisation du composant EnhancedResponse
 */

// Example 1: Simple text response
export function SimpleResponseExample() {
  const content = `# Welcome to Enhanced Response

This is a simple markdown response with **bold text** and *italic text*.

## Features
- Smooth animations
- Better styling
- Enhanced code blocks
- Interactive features

You can also use \`inline code\` for quick references.`;

  return (
    <div className="p-4">
      <EnhancedResponse children={content} />
    </div>
  );
}

// Example 2: Response with code block
export function CodeBlockExample() {
  const content = `# React Hook Example

Here's a custom hook for managing form state:

\`\`\`typescript
import { useState, useCallback } from 'react';

interface FormState {
  [key: string]: any;
}

export function useForm(initialValues: FormState) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FormState>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(prev => new Set([...prev, e.target.name]));
  }, []);

  return { values, errors, touched, handleChange, handleBlur };
}
\`\`\`

This hook provides a clean API for handling form state in React.`;

  return (
    <div className="p-4">
      <EnhancedResponse children={content} />
    </div>
  );
}

// Example 3: Response with table and list
export function TableAndListExample() {
  const content = `# Data Comparison

## Performance Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|------------|
| Load Time | 1200ms | 850ms | 29% ↓ |
| First Paint | 800ms | 480ms | 40% ↓ |
| Interactions | 150ms | 85ms | 43% ↓ |
| Memory | 42MB | 38MB | 10% ↓ |

## Key Improvements

1. **Streaming Performance**
   - Optimized markdown parsing
   - Incremental rendering
   - Progressive enhancement

2. **Visual Enhancements**
   - Smooth animations
   - Better typography
   - Improved spacing

3. **User Experience**
   - Copy buttons
   - Code download
   - Line numbers
   - Expand/collapse`;

  return (
    <div className="p-4">
      <EnhancedResponse children={content} />
    </div>
  );
}

// Example 4: Complex markdown with blockquote
export function ComplexMarkdownExample() {
  const content = `# Advanced Markdown Features

## Headings and Typography

This is a paragraph with **bold text**, *italic text*, and \`inline code\`.

### Nested heading

Some content here.

## Blockquotes

> "The only way to do great work is to love what you do." - Steve Jobs
>
> This is particularly true when building user interfaces that need to be both performant and beautiful.

## Nested lists

1. First item
   - Sub item
   - Another sub item
2. Second item
   - Nested list with multiple items
   - Including some \`code\` samples

### Conclusion

This enhanced response component brings together:

- ✅ Smooth animations
- ✅ Better code block rendering
- ✅ Enhanced typography
- ✅ Interactive features
- ✅ Performance optimizations`;

  return (
    <div className="p-4">
      <EnhancedResponse children={content} />
    </div>
  );
}

// Example 5: Response without animations (for performance-sensitive contexts)
export function NonAnimatedResponseExample() {
  const content = `# Non-Animated Response

This response is rendered without animations for better performance in:

- Very large content
- Frequent updates
- Resource-constrained environments
- User preference for reduced motion

The styling and features are still enhanced, just without the motion effects.`;

  return (
    <div className="p-4">
      <EnhancedResponse 
        children={content}
        enableAnimations={false}
      />
    </div>
  );
}

// Example 6: Minimal response (no interactive features)
export function MinimalResponseExample() {
  const content = `# Minimal Response

This is a minimal response with only the core rendering features:

- No copy button
- No download options
- Focused on content

Perfect for read-only contexts or when you want a cleaner interface.`;

  return (
    <div className="p-4">
      <EnhancedResponse 
        children={content}
        enableInteractiveFeatures={false}
      />
    </div>
  );
}

// Example 7: Response with custom className
export function CustomStyledResponseExample() {
  const content = `# Custom Styled Response

This response uses custom CSS classes for additional styling.

## Features

- Custom background
- Custom padding
- Custom max-width
- Custom font

Perfect for integrating with your existing design system.`;

  return (
    <div className="p-4">
      <EnhancedResponse 
        children={content}
        className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-6 rounded-lg border border-blue-200 dark:border-blue-800"
      />
    </div>
  );
}

// Example 8: Response during streaming (incomplete markdown)
export function StreamingResponseExample() {
  const incompleteContent = `# Streaming Response

This is a response that might be **incomplete due to streaming**.

Here's a code block that might not be closed:

\`\`\`python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# This bracket might be incomplete [
`;

  return (
    <div className="p-4">
      <EnhancedResponse 
        children={incompleteContent}
        parseIncompleteMarkdown={true}
      />
    </div>
  );
}

// Example 9: Integration with real chat message
export function ChatMessageIntegrationExample() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [content, setContent] = React.useState('');

  React.useEffect(() => {
    // Simulate streaming
    setIsLoading(true);
    const text = `# Hello! 👋

I'm here to help you with:

## What I can do

- **Answer questions** about technology, programming, and more
- **Write code** in various programming languages
- **Explain concepts** in simple terms
- **Help with analysis** and data interpretation

## Example use cases

1. Technical questions
2. Code review and optimization
3. Learning and education
4. Creative writing

Feel free to ask me anything!`;

    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setContent(text.slice(0, index + 1));
        index++;
      } else {
        setIsLoading(false);
        clearInterval(timer);
      }
    }, 20);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="p-4 border border-border rounded-lg">
      <div className="mb-2 text-sm text-muted-foreground">
        {isLoading ? '⏳ Streaming...' : '✓ Complete'}
      </div>
      <EnhancedResponse 
        children={content}
        enableAnimations={!isLoading}
        parseIncompleteMarkdown={isLoading}
      />
    </div>
  );
}

// Example 10: All features enabled showcase
export function FullFeaturedExample() {
  const content = `# Full-Featured Response Example

## Overview

This example showcases **all available features** of the enhanced response component.

### Code Examples

Here's a Python example with syntax highlighting:

\`\`\`python
def calculate_fibonacci_with_cache(n, cache=None):
    """
    Calculate fibonacci number with memoization.
    Time complexity: O(n)
    """
    if cache is None:
        cache = {}
    
    if n in cache:
        return cache[n]
    
    if n <= 1:
        return n
    
    cache[n] = (calculate_fibonacci_with_cache(n - 1, cache) + 
                calculate_fibonacci_with_cache(n - 2, cache))
    return cache[n]
\`\`\`

And a JavaScript example:

\`\`\`javascript
const calculateSum = (numbers) => {
  return numbers.reduce((acc, num) => acc + num, 0);
};

// Usage
const scores = [10, 20, 30, 40, 50];
const total = calculateSum(scores);
console.log(\`Total: \${total}\`);
\`\`\`

## Features

### Tables

| Language | Paradigm | Use Case |
|----------|----------|----------|
| Python | Object-Oriented | Data Science, ML |
| JavaScript | Functional | Web Development |
| Rust | Systems | Performance-Critical |

### Lists

1. **Ordered Lists**
   - With proper indentation
   - Supporting nested items
   
2. **Unordered Lists**
   - Also with nesting support
   - Multiple levels deep

### Blockquotes

> "Code is poetry written for computers to execute and humans to understand."
>
> This philosophy guides all modern software development practices.

## Conclusion

The enhanced response component provides a complete solution for rendering AI responses with:

✅ Streaming support  
✅ Beautiful animations  
✅ Interactive features  
✅ Performance optimizations  
✅ Accessibility considerations  
✅ Mobile responsiveness  

Ready to integrate into your application!`;

  return (
    <div className="p-4">
      <EnhancedResponse 
        children={content}
        enableAnimations={true}
        enableInteractiveFeatures={true}
        parseIncompleteMarkdown={true}
      />
    </div>
  );
}

// Component showcase
export function EnhancedResponseShowcase() {
  const [activeExample, setActiveExample] = React.useState('full');

  const examples = {
    simple: { label: 'Simple Text', component: SimpleResponseExample },
    code: { label: 'Code Block', component: CodeBlockExample },
    table: { label: 'Table & List', component: TableAndListExample },
    complex: { label: 'Complex MD', component: ComplexMarkdownExample },
    streaming: { label: 'Streaming', component: StreamingResponseExample },
    chat: { label: 'Chat Message', component: ChatMessageIntegrationExample },
    full: { label: 'Full Featured', component: FullFeaturedExample },
  };

  const ActiveComponent = examples[activeExample as keyof typeof examples]?.component;

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Enhanced Response Examples</h1>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(examples).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setActiveExample(key)}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeExample === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {value.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border border-border rounded-lg p-4 bg-background">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
}
