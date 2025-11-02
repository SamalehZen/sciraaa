'use client';

import { cn } from '@/lib/utils';
import { buttonVariants } from './button';
import { useCallback, useEffect, useState, type HTMLAttributes } from 'react';

interface BannerProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'rainbow' | 'normal';
  href?: string;
  target?: string;
  rel?: string;
  changeLayout?: boolean;
  message?: string;
  height?: string;
}

export function Banner({
  id,
  variant = 'normal',
  changeLayout = true,
  message,
  href,
  target = '_blank',
  rel,
  height = '3rem',
  className,
  style,
  children,
  ...rest
}: BannerProps) {
  const [open, setOpen] = useState(true);
  const globalKey = id ? `banner-${id}` : undefined;

  useEffect(() => {
    if (globalKey) setOpen(localStorage.getItem(globalKey) !== 'true');
  }, [globalKey]);

  const onClose = useCallback(() => {
    setOpen(false);
    if (globalKey) localStorage.setItem(globalKey, 'true');
  }, [globalKey]);

  const ComponentTag = (href ? 'a' : 'div') as keyof JSX.IntrinsicElements;
  const componentProps = href
    ? { href, target, rel: rel ?? (target === '_blank' ? 'noreferrer' : undefined) }
    : {};

  return (
    <ComponentTag
      id={id}
      {...componentProps}
      {...rest}
      style={{ ...style, height: open ? height : '0' }}
      className={cn(
        'group relative z-50 flex items-center justify-center px-4 text-center text-sm font-medium transition-all duration-300',
        variant === 'rainbow' && 'dark:bg-zinc-950 bg-zinc-50',
        !open && 'hidden',
        className
      )}
    >
      {changeLayout && open && globalKey ? (
        <style>{`:root:not(.${globalKey}) { --banner-height: ${height}; }`}</style>
      ) : null}
      {globalKey ? <style>{`.${globalKey} #${id} { display: none; }`}</style> : null}
      {id ? (
        <script
          dangerouslySetInnerHTML={{
            __html: globalKey ? `if (localStorage.getItem('${globalKey}') === 'true') document.documentElement.classList.add('${globalKey}');` : '',
          }}
        />
      ) : null}
      {variant === 'rainbow' ? <RainbowLayer /> : null}
      {message || children}
      {id ? (
        <button
          type="button"
          aria-label="Close Banner"
          onClick={onClose}
          className={cn(
            buttonVariants({
              variant: 'ghost',
              size: 'icon',
              className: 'absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground',
            })
          )}
        >
          ×
        </button>
      ) : null}
    </ComponentTag>
  );
}

function RainbowLayer() {
  return (
    <>
      <div className="rainbow-banner-gradient-1 absolute inset-0 z-[-1]" />
      <div className="rainbow-banner-gradient-2 absolute inset-0 z-[-1]" />
    </>
  );
}
