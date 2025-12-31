import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';
import { UserProvider } from '@/contexts/user-context';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://hyper.fun'),
  title: {
    default: 'Hyper',
    template: '%s - Hyper',
  },
  description: 'AI-powered search and management engine for businesses.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('antialiased', inter.className)}>
        <NuqsAdapter>
          <UserProvider>
            {children}
            <Toaster position="bottom-right" />
          </UserProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
