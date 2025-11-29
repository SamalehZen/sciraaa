'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCouple } from '@/hooks/use-couple';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function JoinCouplePage() {
    const { joinCouple, couple } = useCouple();
    const router = useRouter();
    const [code, setCode] = useState('');

    useEffect(() => {
        if (couple) {
            router.push(`/datespot/couple/${couple.id}`);
        }
    }, [couple, router]);

    const handleJoin = async () => {
        if (code.length !== 6) {
            toast.error('Code must be 6 characters');
            return;
        }
        try {
            await joinCouple.mutateAsync(code.toUpperCase());
            toast.success('Joined successfully! Redirecting...');
            // Reroute is handled by useEffect when 'couple' data is refreshed
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    return (
        <div className="flex flex-col h-full p-8 space-y-8 justify-center flex-1">
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold">Join Partner</h1>
                <p className="text-muted-foreground">Enter the 6-character code your partner shared.</p>
            </div>
            
            <div className="space-y-4">
                <Input 
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="AB12CD"
                    className="text-center text-5xl tracking-[0.2em] h-24 uppercase font-mono rounded-2xl font-bold"
                    maxLength={6}
                />
                <p className="text-xs text-center text-muted-foreground">Case insensitive</p>
            </div>
            
            <Button 
                size="lg" 
                className="w-full h-16 rounded-2xl text-lg font-bold bg-pink-600 hover:bg-pink-700"
                onClick={handleJoin}
                disabled={joinCouple.isPending || code.length !== 6}
            >
                {joinCouple.isPending ? 'Connecting...' : 'Connect with Partner'}
            </Button>
        </div>
    );
}
