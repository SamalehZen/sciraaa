'use client';
import { useState, useEffect } from 'react';
import { Place } from '@/lib/types/datespot';
import { SwipeCard } from './swipe-card';
import { AnimatePresence } from 'framer-motion';
import { X, Heart } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

interface SwipeStackProps {
  places: Place[];
  onSwipe: (place: Place, liked: boolean) => void;
  onFinished: () => void;
}

export function SwipeStack({ places: initialPlaces, onSwipe, onFinished }: SwipeStackProps) {
   const [places, setPlaces] = useState(initialPlaces);
   
   useEffect(() => {
       setPlaces(initialPlaces);
   }, [initialPlaces]);

   const handleSwipe = (liked: boolean) => {
       if (places.length === 0) return;
       const currentPlace = places[0];
       
       // Optimistic update
       setPlaces(prev => prev.slice(1));
       onSwipe(currentPlace, liked);
       
       if (places.length <= 1) {
           onFinished();
       }
   };

   if (places.length === 0) {
       return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 gap-4 animate-pulse">
           <div className="text-6xl">🎉</div>
           <h3 className="text-2xl font-bold">You've seen them all!</h3>
           <p className="text-muted-foreground">Waiting for your partner to decide...</p>
        </div>
       );
   }

   // We render the first 2 cards. The first one (index 0) is the active one on top.
   const visiblePlaces = places.slice(0, 2);

   return (
       <div className="relative w-full max-w-md h-[65vh] mx-auto flex flex-col">
           <div className="relative flex-1 w-full">
               <AnimatePresence mode='popLayout'> 
                   {visiblePlaces.reverse().map((place, index) => {
                        // Since we reversed, the last element in this map is the one at index 0 in original array (Top Card)
                        // Wait, visiblePlaces = [Top, Second]. reversed = [Second, Top].
                        // Map index 0 = Second, index 1 = Top.
                        const isTop = place.place_id === places[0].place_id;
                        
                        return (
                           <div key={place.place_id} className={`absolute inset-0 transition-transform duration-300 ${!isTop ? 'scale-95 translate-y-4 opacity-80 -z-10' : 'z-10'}`}>
                               {isTop ? (
                                   <SwipeCard 
                                     place={place}
                                     onSwipeLeft={() => handleSwipe(false)}
                                     onSwipeRight={() => handleSwipe(true)}
                                   />
                               ) : (
                                   <div className="w-full h-full rounded-3xl bg-gray-200 dark:bg-neutral-800 shadow-lg border border-border" />
                                   // Optionally render full card content for the one behind too, but simplified for perf
                               )}
                           </div>
                       )
                   })}
               </AnimatePresence>
           </div>
           
           {/* Controls */}
           <div className="flex justify-center items-center gap-8 pt-8 pb-4 z-20">
                <Button 
                    size="icon" 
                    variant="outline" 
                    className="h-16 w-16 rounded-full border-2 border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 shadow-lg"
                    onClick={() => handleSwipe(false)}
                >
                    <X size={32} weight="bold" />
                </Button>
                
                <Button 
                    size="icon" 
                    variant="outline" 
                    className="h-16 w-16 rounded-full border-2 border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20 shadow-lg"
                    onClick={() => handleSwipe(true)}
                >
                    <Heart size={32} weight="fill" />
                </Button>
           </div>
       </div>
   );
}
