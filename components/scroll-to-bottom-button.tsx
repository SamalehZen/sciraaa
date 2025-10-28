'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowDownIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

export type ScrollToBottomButtonProps = {
  onClick?: () => void;
  isVisible?: boolean;
  className?: string;
};

export const ScrollToBottomButton = ({
  onClick,
  isVisible = true,
  className,
}: ScrollToBottomButtonProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = useCallback(() => {
    setIsAnimating(true);
    onClick?.();
    setTimeout(() => setIsAnimating(false), 300);
  }, [onClick]);

  if (!isVisible) return null;

  return (
    <div className="animate-scroll-button-appear">
      <Button
        onClick={handleClick}
        className={cn(
          'absolute bottom-4 left-[50%] translate-x-[-50%] rounded-full',
          'transition-all duration-300 ease-out',
          'hover:scale-110 hover:shadow-md',
          'active:scale-95',
          className
        )}
        size="icon"
        type="button"
        variant="outline"
      >
        <ArrowDownIcon
          className={cn(
            'size-4 transition-transform duration-300',
            isAnimating && 'animate-bounce'
          )}
        />
      </Button>
    </div>
  );
};

export default ScrollToBottomButton;
