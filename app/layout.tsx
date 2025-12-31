import type { Metadata, Viewport } from 'next';
import dynamic from 'next/dynamic';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';
import { UserProvider } from '@/contexts/user-context';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

const ThemeProvider = dynamic(
  () => import('next-themes').then((mod) => mod.ThemeProvider),
  { ssr: false },
);

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
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster position="bottom-right" />
            </ThemeProvider>
          </UserProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
