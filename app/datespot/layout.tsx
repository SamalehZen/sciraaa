import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DateSpot | Find the perfect date',
  description: 'Choose your next date spot together.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
};

export default function DateSpotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 w-full flex justify-center">
        <main className="w-full max-w-[480px] min-h-screen bg-background relative shadow-2xl overflow-hidden flex flex-col border-x border-border">
            {children}
        </main>
    </div>
  );
}
