'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useCouple } from '@/hooks/use-couple';
import { Heart } from '@phosphor-icons/react';

export default function DateSpotLanding() {
    const router = useRouter();
    const { couple, isLoading } = useCouple();

    useEffect(() => {
        if (!isLoading && couple) {
            router.push(`/datespot/couple/${couple.id}`);
        }
    }, [couple, isLoading, router]);

    if (isLoading) return <div className="h-screen flex items-center justify-center">
        <Heart size={48} weight="fill" className="text-pink-500 animate-pulse" />
    </div>;

    return (
        <div className="flex flex-col items-center justify-center h-full p-8 space-y-8 flex-1 bg-gradient-to-b from-pink-50 to-background dark:from-pink-950/30 dark:to-background">
            <div className="space-y-2 text-center">
                <div className="mx-auto w-24 h-24 bg-pink-100 dark:bg-pink-900/50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <Heart size={48} weight="fill" className="text-pink-500" />
                </div>
                <h1 className="text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-orange-400">DateSpot</h1>
                <p className="text-muted-foreground text-xl font-medium">Find your perfect date,<br/>together.</p>
            </div>

            <div className="grid gap-4 w-full max-w-xs mt-12">
                <Button 
                    size="lg" 
                    className="w-full h-16 text-lg font-bold rounded-2xl bg-pink-600 hover:bg-pink-700 shadow-xl shadow-pink-500/20 transition-transform active:scale-95"
                    onClick={() => router.push('/datespot/couple/create')}
                >
                    Create New Couple
                </Button>
                <Button 
                    size="lg" 
                    variant="outline"
                    className="w-full h-16 text-lg font-bold rounded-2xl border-2 transition-transform active:scale-95"
                    onClick={() => router.push('/datespot/couple/join')}
                >
                    Have a Code? Join
                </Button>
            </div>
            
            <p className="text-xs text-muted-foreground absolute bottom-8 opacity-50">
                © 2025 Capy Inc.
            </p>
        </div>
    );
}
