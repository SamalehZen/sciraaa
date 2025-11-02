'use client';

import { useMediaQuery } from '@/hooks/use-media-query';
import ThemeSwitch from '@/lib/theme-switch';
import { cn } from '@/lib/utils';
import { AlignJustify, Component, Layout, Wallet, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type CSSProperties, type SVGProps } from 'react';
import { Drawer } from 'vaul';

function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <title>X</title>
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}

interface HomeHeaderProps {
  localTheme: 'light' | 'dark';
  setLocalTheme: (theme: 'light' | 'dark') => void;
  className?: string;
}

export default function HomeHeader({ localTheme, setLocalTheme, className }: HomeHeaderProps) {
  const isMobile = useMediaQuery('(max-width: 992px)');
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'Home', icon: Component },
    { href: '/pricing', label: 'Pricing', icon: Wallet },
    { href: '/about', label: 'About', icon: Layout },
  ];

  return (
    <header className={cn('relative flex h-16 w-full items-center justify-between px-4 py-2', className)}>
      {isMobile && (
        <Drawer.Root direction="left" open={isOpen} onOpenChange={setIsOpen}>
          <Drawer.Trigger className="grid h-10 place-content-center rounded-lg bg-gradient-to-b from-blue-500 to-blue-700 px-3 text-white">
            <AlignJustify />
          </Drawer.Trigger>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
            <Drawer.Content
              className="fixed left-2 top-2 bottom-2 z-50 flex w-72 outline-none"
              style={{ '--initial-transform': 'calc(100% + 8px)' } as CSSProperties}
            >
              <div className="flex h-full w-full grow flex-col rounded-[16px] border border-neutral-200 bg-white p-2 dark:border-neutral-800 dark:bg-black">
                <div className="mb-2 flex w-full justify-between">
                  <Link href="/" className="flex items-center pl-2">
                    <div className="flex items-center gap-2 text-zinc-950 dark:text-white">
                      <svg width="374" height="421" viewBox="0 0 374 421" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-9">
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M0.0047092 107.365V28.695C0.0047092 20.8868 3.58018 14.0547 10.7311 8.19858C17.4054 2.73288 25.5098 0 35.0444 0H207.383C218.824 0 228.597 3.31849 236.702 9.95542C244.806 16.5923 248.858 24.4004 248.858 33.3798V62.6604C248.858 70.8589 251.242 78.4719 256.009 85.4992C260.776 92.5265 267.451 97.9922 276.032 101.896C284.136 106.191 293.194 108.533 303.205 108.924H333.239C344.204 108.924 353.739 112.047 361.843 118.293C369.948 124.93 374 132.934 374 142.303V299.501C374 299.846 373.998 300.192 373.995 300.537V391.529C373.995 399.549 370.42 406.565 363.269 412.58C356.595 418.193 348.49 421 338.956 421H166.617C155.176 421 145.403 417.592 137.298 410.776C129.194 403.959 125.142 395.94 125.142 386.718V356.646C125.142 348.226 122.758 340.407 117.991 333.19C113.224 325.973 106.549 320.359 97.9682 316.35C89.8638 311.939 80.8059 309.533 70.7945 309.133H40.7605C29.7957 309.133 20.2611 305.925 12.1566 299.509C4.05221 292.693 0 284.474 0 274.851V108.257C0 107.959 0.00157218 107.662 0.0047092 107.365ZM248.143 304.102V119.465C248.143 116.732 247.19 114.389 245.283 112.437C242.899 110.485 240.039 109.509 236.702 109.509H135.873C132.536 109.509 129.675 110.485 127.292 112.437C126.926 112.737 126.588 113.046 126.278 113.364L125.857 298.307C125.857 301.113 126.81 303.519 128.717 305.524C131.101 307.529 133.961 308.531 137.298 308.531H238.127C241.464 308.531 244.325 307.529 246.708 305.524C247.247 305.07 247.726 304.596 248.143 304.102Z"
                          fill="url(#paint0_radial_3946_30)"
                        />
                        <defs>
                          <radialGradient id="paint0_radial_3946_30" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(187 210.5) rotate(90) scale(210.5 187)">
                            <stop offset="0.445416" stopColor="#2994FD" />
                            <stop offset="1" stopColor="#1761FF" />
                          </radialGradient>
                        </defs>
                      </svg>
                      <span className="-translate-y-2 inline-block rounded-md border-2 border-blue-600 bg-blue-100 px-1 text-xs font-semibold uppercase text-blue-600 dark:bg-blue-50">
                        pro
                      </span>
                    </div>
                  </Link>
                  <button
                    type="button"
                    className="rounded-md bg-neutral-950 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
                    onClick={() => setIsOpen(false)}
                  >
                    <X />
                  </button>
                </div>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn('flex cursor-pointer select-none items-center gap-1 rounded-md p-2 text-left text-base text-neutral-900 transition-colors duration-200 hover:text-blue-600 dark:text-white dark:hover:text-blue-200')}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      )}
      {!isMobile && (
        <nav className="flex items-center gap-2 font-medium">
          <Link href="/" className="flex items-center pl-2">
            <div className="flex items-center gap-2 text-zinc-950 dark:text-white">
              <svg width="374" height="421" viewBox="0 0 374 421" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-9">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M0.0047092 107.365V28.695C0.0047092 20.8868 3.58018 14.0547 10.7311 8.19858C17.4054 2.73288 25.5098 0 35.0444 0H207.383C218.824 0 228.597 3.31849 236.702 9.95542C244.806 16.5923 248.858 24.4004 248.858 33.3798V62.6604C248.858 70.8589 251.242 78.4719 256.009 85.4992C260.776 92.5265 267.451 97.9922 276.032 101.896C284.136 106.191 293.194 108.533 303.205 108.924H333.239C344.204 108.924 353.739 112.047 361.843 118.293C369.948 124.93 374 132.934 374 142.303V299.501C374 299.846 373.998 300.192 373.995 300.537V391.529C373.995 399.549 370.42 406.565 363.269 412.58C356.595 418.193 348.49 421 338.956 421H166.617C155.176 421 145.403 417.592 137.298 410.776C129.194 403.959 125.142 395.94 125.142 386.718V356.646C125.142 348.226 122.758 340.407 117.991 333.19C113.224 325.973 106.549 320.359 97.9682 316.35C89.8638 311.939 80.8059 309.533 70.7945 309.133H40.7605C29.7957 309.133 20.2611 305.925 12.1566 299.509C4.05221 292.693 0 284.474 0 274.851V108.257C0 107.959 0.00157218 107.662 0.0047092 107.365ZM248.143 304.102V119.465C248.143 116.732 247.19 114.389 245.283 112.437C242.899 110.485 240.039 109.509 236.702 109.509H135.873C132.536 109.509 129.675 110.485 127.292 112.437C126.926 112.737 126.588 113.046 126.278 113.364L125.857 298.307C125.857 301.113 126.81 303.519 128.717 305.524C131.101 307.529 133.961 308.531 137.298 308.531H238.127C241.464 308.531 244.325 307.529 246.708 305.524C247.247 305.07 247.726 304.596 248.143 304.102Z"
                  fill="url(#paint0_radial_3946_30)"
                />
                <defs>
                  <radialGradient id="paint0_radial_3946_30" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(187 210.5) rotate(90) scale(210.5 187)">
                    <stop offset="0.445416" stopColor="#2994FD" />
                    <stop offset="1" stopColor="#1761FF" />
                  </radialGradient>
                </defs>
              </svg>
              <span className="-translate-y-2 inline-block rounded-md border-2 border-blue-600 bg-blue-100 px-1 text-xs font-semibold uppercase text-blue-600 dark:bg-blue-50">
                pro
              </span>
            </div>
          </Link>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex select-none items-center justify-center gap-1 rounded-md p-2 text-neutral-900 transition-colors duration-200 hover:text-blue-600 dark:text-white dark:hover:text-blue-200',
                pathname === item.href && 'bg-neutral-200 text-blue-700 dark:border dark:border-blue-950 dark:bg-neutral-900 dark:text-blue-200'
              )}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      )}
      <nav className="flex items-center gap-2">
        <a
          href="https://twitter.com/naymur_dev"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center justify-center rounded-md border border-neutral-200 px-3 dark:border-neutral-800"
        >
          <XIcon className="h-4 w-4 fill-zinc-950 dark:fill-white" />
        </a>
        <ThemeSwitch localTheme={localTheme} setLocalTheme={setLocalTheme} className="h-10 w-10 rounded-md border border-neutral-200 dark:border-neutral-800" />
        <a
          href="https://pro.ui-layouts.com/login"
          className="flex h-10 items-center justify-center rounded-md border border-neutral-200 bg-[#334cec] px-3 text-white dark:border-neutral-800"
        >
          Login
        </a>
      </nav>
    </header>
  );
}
