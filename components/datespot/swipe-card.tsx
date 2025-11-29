'use client';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Place } from '@/lib/types/datespot';
import { useSwipeGesture } from '@/hooks/use-swipe-gesture';
import { Star, MapPin } from '@phosphor-icons/react';

interface SwipeCardProps {
  place: Place;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

export function SwipeCard({ place, onSwipeLeft, onSwipeRight }: SwipeCardProps) {
  const { x, rotate, handleDragEnd } = useSwipeGesture({ onSwipeLeft, onSwipeRight });
  
  const rotateStyle = useTransform(x, [-200, 200], [-20, 20]);
  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-50, -150], [0, 1]);

  return (
    <motion.div
      style={{ x, rotate: rotateStyle }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 h-full w-full rounded-3xl bg-white dark:bg-neutral-900 shadow-xl overflow-hidden cursor-grab active:cursor-grabbing border border-border/50 select-none"
      initial={{ scale: 0.95, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.95, opacity: 0 }} // Handled by parent slightly differently usually for stack but this works for single top card
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
        <div className="relative h-[65%] w-full bg-gray-200 dark:bg-gray-800">
            {place.photos?.[0]?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={place.photos[0].url} alt={place.name} className="h-full w-full object-cover pointer-events-none" />
            ) : (
                <div className="h-full w-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-neutral-400">
                    <span className="text-lg">No Image Available</span>
                </div>
            )}
            
            {/* Overlays for Swipe */}
            <motion.div style={{ opacity: likeOpacity }} className="absolute top-8 left-8 rotate-[-15deg] border-4 border-green-500 rounded-lg px-4 py-2 z-10 bg-black/20">
                <span className="text-4xl font-bold text-green-500 uppercase tracking-wider">YES</span>
            </motion.div>
            <motion.div style={{ opacity: nopeOpacity }} className="absolute top-8 right-8 rotate-[15deg] border-4 border-red-500 rounded-lg px-4 py-2 z-10 bg-black/20">
                <span className="text-4xl font-bold text-red-500 uppercase tracking-wider">NOPE</span>
            </motion.div>

             <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/70 to-transparent" />
        </div>

        <div className="p-5 flex flex-col gap-2 h-[35%] bg-card relative z-20">
            <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold leading-tight line-clamp-2">{place.name}</h2>
                <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded-md shrink-0">
                    <Star weight="fill" className="text-yellow-500" />
                    <span className="font-medium text-sm">{place.rating || 'N/A'}</span>
                </div>
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <MapPin size={16} />
                <span className="truncate">{place.formatted_address?.split(',')[0]}</span>
            </div>

             <div className="flex items-center gap-4 mt-auto pt-4 border-t border-border/50">
                 {place.price_level !== undefined && (
                     <div className="flex text-green-600 dark:text-green-400 font-medium text-sm">
                         {Array(place.price_level || 1).fill('$').join('')}
                     </div>
                 )}
                 <div className="flex gap-2 overflow-hidden">
                     {place.types?.slice(0, 3).map(t => (
                         <span key={t} className="px-2 py-0.5 bg-accent rounded-full text-xs capitalize text-foreground/80 whitespace-nowrap">
                             {t.replace(/_/g, ' ')}
                         </span>
                     ))}
                 </div>
             </div>
        </div>
    </motion.div>
  );
}
