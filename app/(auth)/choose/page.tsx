'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, Zap } from 'lucide-react';

export default function ChoosePage() {
  return (
    <div className="w-full max-w-[600px]">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Choose Your Login Style</h1>
        <p className="text-muted-foreground">Select the login design you prefer</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 cursor-pointer hover:border-primary transition-colors">
          <Link href="/sign-in">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 p-3 bg-primary/10 rounded-lg">
                <Sparkles className="size-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Classic</h2>
              <p className="text-sm text-muted-foreground">
                The traditional login interface with clean design
              </p>
              <Button className="w-full mt-6">Use Classic</Button>
            </div>
          </Link>
        </Card>

        <Card className="p-6 cursor-pointer hover:border-primary transition-colors">
          <Link href="/animated">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 p-3 bg-primary/10 rounded-lg">
                <Zap className="size-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Animated</h2>
              <p className="text-sm text-muted-foreground">
                Interactive login with animated cartoon characters
              </p>
              <Button className="w-full mt-6">Use Animated</Button>
            </div>
          </Link>
        </Card>
      </div>
    </div>
  );
}
