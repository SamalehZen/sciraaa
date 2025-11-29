'use client';
import { useState, useEffect, use } from 'react';
import { useDateSpotSession } from '@/hooks/use-datespot-session';
import { SwipeStack } from '@/components/datespot/swipe-stack';
import { MatchCelebration } from '@/components/datespot/match-celebration';
import { Place } from '@/lib/types/datespot';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';

export default function SessionPage({ params }: { params: Promise<{ coupleId: string, sessionId: string }> }) {
    const { sessionId, coupleId } = use(params);
    const router = useRouter();
    const { session, swipe } = useDateSpotSession(coupleId);
    
    const [match, setMatch] = useState<Place | null>(null);
    const [places, setPlaces] = useState<Place[]>([]);
    const [loadingPlaces, setLoadingPlaces] = useState(true);

    useEffect(() => {
        if (session?.status === 'completed' && session.matchedPlaceId) {
            // Ideally redirect to result page, but for now match celebration is enough
            // router.push(`/datespot/couple/${coupleId}/session/${sessionId}/result`);
        }
    }, [session, router, coupleId, sessionId]);

    useEffect(() => {
        const fetchPlaces = async () => {
            if (!session?.location) return;
            setLoadingPlaces(true);
            try {
                 const res = await fetch('/api/datespot/places', {
                     method: 'POST',
                     body: JSON.stringify({ 
                         location: session.location, 
                         placeType: session.placeType, 
                         radius: session.radius 
                     })
                 });
                 const data = await res.json();
                 setPlaces(data.places || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingPlaces(false);
            }
        };

        if (session && places.length === 0) {
            fetchPlaces();
        }
    }, [session]); // Removing 'places' dependency to avoid loop if it clears

    const handleSwipe = async (place: Place, liked: boolean) => {
        try {
            const res = await swipe.mutateAsync({
                placeId: place.place_id,
                liked,
                placeData: place
            });
            
            if (res.matched) {
                setMatch(place);
            }
        } catch (e) {
            console.error('Swipe failed', e);
        }
    };

    if (!session || loadingPlaces) return <div className="h-full flex flex-col gap-4 items-center justify-center">
        <Spinner className="w-8 h-8 text-pink-500" />
        <p className="text-muted-foreground animate-pulse">Finding best spots for you...</p>
    </div>;

    if (match) {
        return <MatchCelebration place={match} onContinue={() => setMatch(null)} />;
    }

    return (
        <div className="h-full flex flex-col bg-neutral-50 dark:bg-black">
            <div className="p-4 text-center font-bold text-lg bg-white dark:bg-neutral-900 shadow-sm z-20 relative flex justify-between items-center px-6">
                <span>Date Session</span>
                <div className="text-xs bg-secondary px-2 py-1 rounded-lg font-normal text-muted-foreground">
                    {places.length} places left
                </div>
            </div>
             <div className="flex-1 flex items-center pt-4 overflow-hidden">
                 <SwipeStack 
                    places={places} 
                    onSwipe={handleSwipe} 
                    onFinished={() => { /* Maybe show "Waiting for partner" screen */ }}
                 />
            </div>
        </div>
    );
}
