'use client';

import { AnimatedCharacters } from '@/components/animated-characters';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between h-screen bg-background">
      <div className="hidden lg:flex lg:w-1/2 h-full bg-muted/30 flex-col">
        <div className="w-full h-full flex items-center justify-center p-12">
          <AnimatedCharacters />
        </div>
      </div>
      <div className="w-full lg:w-1/2 h-full flex flex-col items-center justify-center px-4 md:px-8">{children}</div>
    </div>
  );
}
