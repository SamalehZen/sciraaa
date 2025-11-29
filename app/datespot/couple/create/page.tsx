'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCouple } from '@/hooks/use-couple';
import { CoupleCodeDisplay } from '@/components/datespot/couple-code-display';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export default function CreateCouplePage() {
    const { createCouple, couple, isLoading } = useCouple();
    const router = useRouter();

    useEffect(() => {
        // Try to create couple if not exists
        if (!isLoading && !couple) {
            createCouple.mutate();
        }
    }, [isLoading, couple]); // removed createCouple from deps to avoid loop if function reference changes, though useMutation usually stable

    if (isLoading || !couple) {
        return <div className="h-full flex flex-col items-center justify-center gap-4">
            <Spinner className="w-8 h-8 text-pink-500" />
            <p className="text-muted-foreground">Setting up your romantic space...</p>
        </div>;
    }

    return (
        <div className="flex flex-col h-full p-8 space-y-8 justify-center flex-1">
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold">You're All Set! 💘</h1>
                <p className="text-muted-foreground">Send this code to your partner to connect your accounts.</p>
            </div>
            
            <CoupleCodeDisplay code={couple.code} />
            
            <Button 
                size="lg" 
                className="w-full h-14 rounded-xl text-lg font-semibold mt-8"
                onClick={() => router.push(`/datespot/couple/${couple.id}`)}
            >
                Enter Dashboard
            </Button>
        </div>
    );
}
