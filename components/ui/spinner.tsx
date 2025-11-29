import { CircleNotch } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export function Spinner({ className, size = 24 }: { className?: string, size?: number }) {
  return <CircleNotch size={size} className={cn("animate-spin", className)} weight="bold" />;
}
