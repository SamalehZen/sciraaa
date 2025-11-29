'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useCouple } from '@/hooks/use-couple';
import { useDateSpotSession } from '@/hooks/use-datespot-session';
import { Button } from '@/components/ui/button';
import { Users, MapPin, Clock, Plus } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function CoupleDashboard({ params }: { params: Promise<{ coupleId: string }> }) {
     const { coupleId } = use(params);
     const { couple } = useCouple();
     const { session, startSession, isLoading } = useDateSpotSession(coupleId);
     const router = useRouter();
     const [geoLoading, setGeoLoading] = useState(false);

     useEffect(() => {
         // If we have an active session, auto redirect? Maybe annoying. Let's just show the card.
     }, [session]);

     const handleStartSession = () => {
         if (!navigator.geolocation) {
             toast.error('Geolocation not supported');
             return;
         }
         
         setGeoLoading(true);
         navigator.geolocation.getCurrentPosition(async (pos) => {
             try {
                 const newSession = await startSession.mutateAsync({
                     location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
                     placeType: 'restaurant',
                     radius: 5000
                 });
                 router.push(`/datespot/couple/${coupleId}/session/${newSession.id}`);
             } catch (e) {
                 toast.error('Failed to start session');
             } finally {
                 setGeoLoading(false);
             }
         }, (err) => {
             toast.error('Location permission denied');
             setGeoLoading(false);
         });
     };
     
     const activeSession = session?.status === 'active';

     return (
         <div className="flex flex-col h-full p-6 space-y-8">
            <div className="flex justify-between items-center pt-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold">Hello, {couple?.partner1Id ? 'Lovebirds' : 'Pending...'}</h1>
                    <p className="text-muted-foreground">Ready for your next date?</p>
                </div>
                <div className="bg-secondary p-2 rounded-full">
                    <Users size={24} />
                </div>
            </div>
            
            {activeSession ? (
                <div className="bg-gradient-to-br from-pink-500 to-rose-600 text-white p-8 rounded-3xl shadow-xl shadow-pink-500/20 space-y-6 transform transition-all">
                     <div className="space-y-2">
                        <div className="flex items-center gap-2 opacity-80">
                            <span className="animate-pulse relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                            </span>
                            <h3 className="font-bold uppercase tracking-wider text-sm">Live Session</h3>
                        </div>
                        <p className="text-2xl font-bold">You have an active vote in progress!</p>
                     </div>
                     <Button 
                        className="w-full bg-white text-pink-600 hover:bg-gray-100 font-bold h-12 rounded-xl"
                        onClick={() => router.push(`/datespot/couple/${coupleId}/session/${session.id}`)}
                     >
                        Continue Swiping
                     </Button>
                </div>
            ) : (
                 <div className="bg-card p-8 rounded-3xl border shadow-sm space-y-8 text-center">
                     <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto text-secondary-foreground">
                         <Plus size={40} weight="bold" />
                     </div>
                     <div>
                        <h3 className="font-bold text-2xl mb-2">New Adventure</h3>
                        <p className="text-muted-foreground">Start a new voting session to find the perfect spot.</p>
                     </div>
                     
                     <Button 
                        size="lg" 
                        className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg" 
                        onClick={() => router.push(`/datespot/couple/${coupleId}/session/new`)} 
                     >
                         Find a Spot Nearby
                     </Button>
                 </div>
            )}
            
            <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">Recent Matches</h3>
                    <Button variant="ghost" size="sm">See All</Button>
                </div>
                <div className="p-8 text-center text-muted-foreground bg-secondary/30 rounded-2xl border-2 border-dashed border-border/50">
                    <div className="opacity-50 mb-2 text-4xl">📅</div>
                    No past dates yet.
                </div>
            </div>
         </div>
     );
}
