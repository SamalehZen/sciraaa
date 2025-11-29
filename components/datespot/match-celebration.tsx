'use client';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Place } from '@/lib/types/datespot';
import { Button } from '@/components/ui/button';
import { MapPin } from '@phosphor-icons/react';

interface MatchCelebrationProps {
    place: Place;
    onContinue: () => void;
}

export function MatchCelebration({ place, onContinue }: MatchCelebrationProps) {
    useEffect(() => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-6 text-white animate-in fade-in duration-500 backdrop-blur-sm">
            <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', bounce: 0.5 }}
                className="text-center space-y-8 w-full max-w-md"
            >
                <div className="space-y-2">
                    <h1 className="text-6xl font-black bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent pb-2">IT'S A MATCH!</h1>
                    <p className="text-xl text-gray-300">You both liked this place!</p>
                </div>
                
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border-4 border-pink-500 shadow-2xl shadow-pink-500/40 bg-neutral-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={place.photos?.[0]?.url || '/placeholder.png'} className="object-cover w-full h-full" alt={place.name} />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 pt-20 text-left">
                         <h2 className="text-2xl font-bold text-white">{place.name}</h2>
                         <div className="flex items-center gap-2 text-sm text-gray-300 mt-1">
                             <MapPin weight="fill" className="text-pink-500 shrink-0" />
                             <span className="truncate">{place.formatted_address}</span>
                         </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 w-full">
                    <Button size="lg" className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl h-14" onClick={() => {
                         window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + (place.formatted_address || ''))}`);
                    }}>
                        Get Directions
                    </Button>
                    <Button size="lg" variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 rounded-xl h-14" onClick={onContinue}>
                        Back to Session
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
