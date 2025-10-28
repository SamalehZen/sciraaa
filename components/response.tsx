import React from 'react';
import { MarkdownRenderer } from '@/components/markdown';
import { cn } from '@/lib/utils';

interface ResponseProps {
  children: string;
  className?: string;
}

export const Response: React.FC<ResponseProps> = ({ children, className }) => {
  return (
    <div className={cn('prose prose-sm max-w-none text-muted-foreground', className)}>
      <MarkdownRenderer content={children} />
    </div>
  );
};
