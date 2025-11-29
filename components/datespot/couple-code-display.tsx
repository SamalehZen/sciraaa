'use client';
import { Button } from '@/components/ui/button';
import { Copy, Check } from '@phosphor-icons/react';
import { useState } from 'react';

export function CoupleCodeDisplay({ code }: { code: string }) {
    const [copied, setCopied] = useState(false);

    const copy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col items-center space-y-6 p-8 bg-secondary/30 rounded-3xl border-2 border-dashed border-primary/20">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Your Couple Code</h3>
            
            <div 
                className="text-6xl font-black tracking-[0.2em] text-primary cursor-pointer select-all font-mono"
                onClick={copy}
            >
                {code}
            </div>
            
            <Button onClick={copy} className="w-full max-w-[200px] rounded-full" size="lg">
                {copied ? <Check size={18} className="mr-2" /> : <Copy size={18} className="mr-2" />}
                {copied ? 'Copied!' : 'Copy & Share'}
            </Button>
            
            <p className="text-sm text-muted-foreground text-center max-w-xs">
                Share this code with your partner to join your session and start matching!
            </p>
        </div>
    );
}
