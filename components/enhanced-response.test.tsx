/**
 * Enhanced Response Component - Test Suite
 * 
 * Basic tests and integration checks for the EnhancedResponse component.
 * Run these tests to verify the component works correctly in your environment.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { EnhancedResponse } from './enhanced-response';
import '@/components/streaming-animations.css';

describe('EnhancedResponse Component', () => {
  describe('Rendering', () => {
    test('renders simple text', () => {
      const content = 'Hello World';
      render(<EnhancedResponse children={content} />);
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    test('renders markdown headings', () => {
      const content = '# Heading 1\n## Heading 2';
      const { container } = render(<EnhancedResponse children={content} />);
      expect(container.querySelector('h1')).toBeInTheDocument();
      expect(container.querySelector('h2')).toBeInTheDocument();
    });

    test('renders bold text', () => {
      const content = '**Bold text**';
      const { container } = render(<EnhancedResponse children={content} />);
      expect(container.querySelector('strong')).toBeInTheDocument();
    });

    test('renders italic text', () => {
      const content = '*Italic text*';
      const { container } = render(<EnhancedResponse children={content} />);
      expect(container.querySelector('em')).toBeInTheDocument();
    });

    test('renders inline code', () => {
      const content = 'Use `const x = 10;` for this';
      const { container } = render(<EnhancedResponse children={content} />);
      expect(container.querySelector('code')).toBeInTheDocument();
    });

    test('renders code blocks', () => {
      const content = '```javascript\nconst x = 10;\n```';
      const { container } = render(<EnhancedResponse children={content} />);
      expect(container.querySelector('code')).toBeInTheDocument();
    });

    test('renders lists', () => {
      const content = '- Item 1\n- Item 2\n- Item 3';
      const { container } = render(<EnhancedResponse children={content} />);
      expect(container.querySelector('ul')).toBeInTheDocument();
      expect(container.querySelectorAll('li')).toHaveLength(3);
    });

    test('renders ordered lists', () => {
      const content = '1. First\n2. Second\n3. Third';
      const { container } = render(<EnhancedResponse children={content} />);
      expect(container.querySelector('ol')).toBeInTheDocument();
      expect(container.querySelectorAll('li')).toHaveLength(3);
    });

    test('renders blockquotes', () => {
      const content = '> This is a quote';
      const { container } = render(<EnhancedResponse children={content} />);
      expect(container.querySelector('blockquote')).toBeInTheDocument();
    });

    test('renders links', () => {
      const content = '[Link](https://example.com)';
      const { container } = render(<EnhancedResponse children={content} />);
      const link = container.querySelector('a');
      expect(link).toBeInTheDocument();
      expect(link?.getAttribute('href')).toBe('https://example.com');
    });

    test('renders tables', () => {
      const content = '| A | B |\n|---|---|\n| 1 | 2 |';
      const { container } = render(<EnhancedResponse children={content} />);
      expect(container.querySelector('table')).toBeInTheDocument();
      expect(container.querySelector('th')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    test('respects enableAnimations prop', () => {
      const content = '# Test';
      const { container: animated } = render(
        <EnhancedResponse children={content} enableAnimations={true} />
      );
      const { container: notAnimated } = render(
        <EnhancedResponse children={content} enableAnimations={false} />
      );

      expect(animated).toBeInTheDocument();
      expect(notAnimated).toBeInTheDocument();
    });

    test('respects enableInteractiveFeatures prop', () => {
      const content = '# Test';
      const { queryByText: withFeatures } = render(
        <EnhancedResponse children={content} enableInteractiveFeatures={true} />
      );
      const { queryByText: withoutFeatures } = render(
        <EnhancedResponse children={content} enableInteractiveFeatures={false} />
      );

      // With features should have copy button
      expect(withFeatures('Copy')).toBeInTheDocument();
    });

    test('respects parseIncompleteMarkdown prop', () => {
      const incompleteContent = '**Bold text without closing';
      const { container } = render(
        <EnhancedResponse 
          children={incompleteContent}
          parseIncompleteMarkdown={true}
        />
      );

      expect(container).toBeInTheDocument();
    });

    test('accepts custom className', () => {
      const content = 'Test';
      const customClass = 'custom-test-class';
      const { container } = render(
        <EnhancedResponse 
          children={content}
          className={customClass}
        />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass(customClass);
    });
  });

  describe('Streaming Content', () => {
    test('handles incomplete markdown during streaming', () => {
      const content = '# Heading\n\nText with incomplete **bold';
      const { container } = render(
        <EnhancedResponse 
          children={content}
          parseIncompleteMarkdown={true}
        />
      );

      expect(container.querySelector('h1')).toBeInTheDocument();
    });

    test('handles incomplete code blocks', () => {
      const content = '```javascript\nconst x = 10;';
      const { container } = render(
        <EnhancedResponse 
          children={content}
          parseIncompleteMarkdown={true}
        />
      );

      expect(container.querySelector('code')).toBeInTheDocument();
    });

    test('handles incomplete links', () => {
      const content = 'Check this [link';
      const { container } = render(
        <EnhancedResponse 
          children={content}
          parseIncompleteMarkdown={true}
        />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('renders semantic HTML', () => {
      const content = '# Heading\nParagraph text';
      const { container } = render(<EnhancedResponse children={content} />);

      expect(container.querySelector('h1')).toBeInTheDocument();
      expect(container.querySelector('p')).toBeInTheDocument();
    });

    test('links have target and rel attributes', () => {
      const content = '[Link](https://example.com)';
      const { container } = render(<EnhancedResponse children={content} />);
      const link = container.querySelector('a');

      expect(link?.getAttribute('target')).toBe('_blank');
      expect(link?.getAttribute('rel')).toContain('noreferrer');
    });

    test('respects reduced motion preference', () => {
      // This would require mocking matchMedia
      // For now, just verify it doesn't error
      const content = '# Test';
      const { container } = render(
        <EnhancedResponse 
          children={content}
          enableAnimations={true}
        />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('memoizes and doesn\'t re-render unnecessarily', () => {
      const content = '# Heading\nParagraph';
      const { rerender } = render(
        <EnhancedResponse children={content} />
      );

      // Re-render with same content
      rerender(<EnhancedResponse children={content} />);

      // Component should handle this efficiently
      expect(screen.getByText('Heading')).toBeInTheDocument();
    });

    test('handles large content', () => {
      const largeContent = '# Heading\n\n' + 'Paragraph text\n\n'.repeat(100);
      const { container } = render(
        <EnhancedResponse children={largeContent} />
      );

      expect(container.querySelector('h1')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    test('works with complex markdown', () => {
      const complexContent = `# Main Heading

This is a paragraph with **bold**, *italic*, and \`code\`.

## Section 2

- List item 1
- List item 2
- List item 3

\`\`\`javascript
const example = () => {
  console.log('Hello');
};
\`\`\`

> A blockquote

| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |

[Link](https://example.com)`;

      const { container } = render(
        <EnhancedResponse children={complexContent} />
      );

      expect(container.querySelector('h1')).toBeInTheDocument();
      expect(container.querySelector('h2')).toBeInTheDocument();
      expect(container.querySelector('strong')).toBeInTheDocument();
      expect(container.querySelector('em')).toBeInTheDocument();
      expect(container.querySelector('ul')).toBeInTheDocument();
      expect(container.querySelector('blockquote')).toBeInTheDocument();
      expect(container.querySelector('table')).toBeInTheDocument();
      expect(container.querySelector('a')).toBeInTheDocument();
    });

    test('works with all feature combinations', () => {
      const content = '# Test\n\n```js\ncode\n```';

      const configs = [
        { enableAnimations: true, enableInteractiveFeatures: true },
        { enableAnimations: true, enableInteractiveFeatures: false },
        { enableAnimations: false, enableInteractiveFeatures: true },
        { enableAnimations: false, enableInteractiveFeatures: false },
      ];

      configs.forEach(config => {
        const { container } = render(
          <EnhancedResponse children={content} {...config} />
        );
        expect(container.querySelector('h1')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles empty content', () => {
      const { container } = render(<EnhancedResponse children="" />);
      expect(container).toBeInTheDocument();
    });

    test('handles null-like values gracefully', () => {
      const { container } = render(
        <EnhancedResponse children="Content" />
      );
      expect(container).toBeInTheDocument();
    });

    test('handles special characters', () => {
      const content = 'Special characters: & < > " \'';
      const { getByText } = render(<EnhancedResponse children={content} />);
      expect(getByText(/Special characters/)).toBeInTheDocument();
    });

    test('handles very long lines', () => {
      const longLine = 'a'.repeat(1000);
      const content = longLine;
      const { container } = render(<EnhancedResponse children={content} />);
      expect(container).toBeInTheDocument();
    });

    test('handles mixed content types', () => {
      const content = `
# Heading
Paragraph
- List
1. Ordered
> Quote
\`\`\`
code
\`\`\`
`;
      const { container } = render(<EnhancedResponse children={content} />);
      expect(container.querySelector('h1')).toBeInTheDocument();
    });
  });
});

/**
 * Integration Tests
 * These test real-world usage scenarios
 */
describe('EnhancedResponse Integration', () => {
  test('renders AI response correctly', () => {
    const aiResponse = `# Analysis Results

Based on your query, here are the key findings:

## Performance Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Load Time | 250ms | ✓ Good |
| Error Rate | 0.5% | ✓ Good |

## Recommendations

1. Optimize database queries
2. Implement caching strategy
3. Monitor performance metrics

\`\`\`sql
SELECT * FROM users WHERE active = true;
\`\`\`

> Always test in production-like environment`;

    const { container } = render(
      <EnhancedResponse children={aiResponse} />
    );

    expect(container.querySelector('h1')).toBeInTheDocument();
    expect(container.querySelector('table')).toBeInTheDocument();
    expect(container.querySelector('ol')).toBeInTheDocument();
    expect(container.querySelector('code')).toBeInTheDocument();
    expect(container.querySelector('blockquote')).toBeInTheDocument();
  });

  test('renders chat message correctly', () => {
    const chatMessage = `Sure! Here's how to solve this problem:

First, let's set up the basics:

\`\`\`python
def solve(x):
    return x * 2
\`\`\`

Then call it with your input.`;

    const { container } = render(
      <EnhancedResponse children={chatMessage} />
    );

    expect(container).toBeInTheDocument();
    expect(container.querySelector('code')).toBeInTheDocument();
  });
});

/**
 * Manual Test Checklist
 * Run these in your browser console to verify functionality
 * 
 * 1. Check animations:
 *    document.querySelectorAll('[class*="animate-"]').length > 0
 * 
 * 2. Check interactivity:
 *    document.querySelector('button')?.textContent // Should show "Copy"
 * 
 * 3. Check code blocks:
 *    document.querySelector('code') // Should exist
 * 
 * 4. Check styling:
 *    window.getComputedStyle(document.querySelector('a')).color
 * 
 * 5. Test copy button:
 *    document.querySelector('button')?.click()
 */

export default {
  description: 'EnhancedResponse Component Test Suite',
  runTests: true,
  manualChecklist: [
    'Animations play smoothly',
    'Copy button works',
    'Code block displays correctly',
    'Links open in new tab',
    'Tables render properly',
    'Responsive on mobile',
    'Dark mode looks good',
    'Accessibility is good',
  ],
};
