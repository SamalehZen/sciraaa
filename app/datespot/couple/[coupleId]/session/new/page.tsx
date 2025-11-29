'use client';
import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useDateSpotSession } from '@/hooks/use-datespot-session';
import { LocationPicker } from '@/components/datespot/location-picker';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Coffee, Martini, ForkKnife } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function NewSessionPage({ params }: { params: Promise<{ coupleId: string }> }) {
  const { coupleId } = use(params);
  const router = useRouter();
  const { startSession } = useDateSpotSession(coupleId);
  
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address: string; radius: number } | null>(null);
  const [placeType, setPlaceType] = useState<'restaurant' | 'cafe' | 'bar'>('restaurant');

  const handleCreate = async () => {
    if (!selectedLocation) {
        toast.error('Please select a location');
        return;
    }

    try {
        const session = await startSession.mutateAsync({
            location: { 
                lat: selectedLocation.lat, 
                lng: selectedLocation.lng, 
                address: selectedLocation.address 
            },
            radius: selectedLocation.radius,
            placeType
        });
        
        router.push(`/datespot/couple/${coupleId}/session/${session.id}`);
    } catch (e) {
        console.error(e);
        toast.error('Failed to start session');
    }
  };

  return (
    <div className="flex flex-col h-full bg-background max-w-md mx-auto w-full">
        <div className="p-4 flex items-center gap-4 border-b">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft size={20} />
            </Button>
            <h1 className="font-bold text-lg">New Date Session</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    What's the vibe?
                </label>
                <div className="grid grid-cols-3 gap-3">
                    <button 
                        onClick={() => setPlaceType('restaurant')}
                        className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                            placeType === 'restaurant' 
                                ? "border-pink-500 bg-pink-50 text-pink-600 dark:bg-pink-900/20" 
                                : "border-transparent bg-secondary hover:bg-secondary/80"
                        )}
                    >
                        <ForkKnife size={32} weight={placeType === 'restaurant' ? 'fill' : 'regular'} />
                        <span className="text-xs font-medium">Eat</span>
                    </button>
                    
                    <button 
                        onClick={() => setPlaceType('cafe')}
                        className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                            placeType === 'cafe' 
                                ? "border-orange-500 bg-orange-50 text-orange-600 dark:bg-orange-900/20" 
                                : "border-transparent bg-secondary hover:bg-secondary/80"
                        )}
                    >
                        <Coffee size={32} weight={placeType === 'cafe' ? 'fill' : 'regular'} />
                        <span className="text-xs font-medium">Coffee</span>
                    </button>
                    
                    <button 
                        onClick={() => setPlaceType('bar')}
                        className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                            placeType === 'bar' 
                                ? "border-purple-500 bg-purple-50 text-purple-600 dark:bg-purple-900/20" 
                                : "border-transparent bg-secondary hover:bg-secondary/80"
                        )}
                    >
                        <Martini size={32} weight={placeType === 'bar' ? 'fill' : 'regular'} />
                        <span className="text-xs font-medium">Drinks</span>
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Where?
                </label>
                <LocationPicker 
                    onLocationSelect={setSelectedLocation}
                    defaultRadius={3000}
                />
            </div>
        </div>

        <div className="p-6 border-t bg-background/80 backdrop-blur-sm">
            <Button 
                size="lg" 
                className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20"
                onClick={handleCreate}
                disabled={!selectedLocation || startSession.isPending}
            >
                {startSession.isPending ? 'Creating...' : 'Start Swiping! 🚀'}
            </Button>
        </div>
    </div>
  );
}
