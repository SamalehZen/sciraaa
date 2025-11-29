import { useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';

export function useSwipeGesture({ onSwipeLeft, onSwipeRight }: { onSwipeLeft: () => void, onSwipeRight: () => void }) {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-30, 30]);
    
    const handleDragEnd = (event: any, info: PanInfo) => {
        const threshold = 100;
        if (info.offset.x > threshold) {
             // Swipe Right (Like)
            animate(x, 500, { duration: 0.2 }).then(() => {
                onSwipeRight();
                x.set(0); // Reset after callback, though usually component unmounts/remounts with new card
            });
        } else if (info.offset.x < -threshold) {
            // Swipe Left (Dislike)
            animate(x, -500, { duration: 0.2 }).then(() => {
                onSwipeLeft();
                x.set(0);
            });
        } else {
             // Return to center
             animate(x, 0, { type: 'spring', stiffness: 300, damping: 20 });
        }
    };

    return { x, rotate, handleDragEnd };
}
