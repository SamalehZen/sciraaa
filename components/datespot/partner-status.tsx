'use client';

import { useEffect, useState } from 'react';
import { pusherClient } from '@/lib/pusher-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface PartnerStatusProps {
  sessionId: string;
  partnerName: string;
  partnerId: string;
  totalPlaces?: number;
}

interface PartnerProgress {
  current: number;
  total: number;
  status: 'selecting' | 'completed' | 'offline';
}

export function PartnerStatus({ sessionId, partnerName, partnerId, totalPlaces = 0 }: PartnerStatusProps) {
  const [progress, setProgress] = useState<PartnerProgress>({
    current: 0,
    total: totalPlaces,
    status: 'selecting',
  });
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!sessionId || !pusherClient) return;

    const channelName = `private-session-${sessionId}`;
    const channel = pusherClient.subscribe(channelName);

    // Listen for swipe events from partner
    channel.bind('swipe', (data: any) => {
      if (data.userId === partnerId) {
        setProgress(prev => ({
          ...prev,
          current: data.progress.current,
          total: data.progress.total,
          status: data.progress.current >= data.progress.total ? 'completed' : 'selecting'
        }));
        setIsOnline(true);
      }
    });

    // Listen for generic presence or status updates if we implement them
    channel.bind('client-status', (data: any) => {
      if (data.userId === partnerId) {
         setIsOnline(data.status === 'online');
      }
    });

    return () => {
      pusherClient.unsubscribe(channelName);
    };
  }, [sessionId, partnerId]);

  // Calculate percentage
  const percentage = progress.total > 0 
    ? Math.min(100, Math.round((progress.current / progress.total) * 100)) 
    : 0;

  return (
    <div className="flex items-center gap-3 bg-background/80 backdrop-blur-sm p-3 rounded-full border shadow-sm">
      <div className="relative">
        <Avatar className="h-10 w-10 border-2 border-background">
          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${partnerName}`} />
          <AvatarFallback>{partnerName.charAt(0)}</AvatarFallback>
        </Avatar>
        
        {isOnline && (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
        )}
      </div>

      <div className="flex-1 min-w-[100px]">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium truncate max-w-[80px]">{partnerName}</span>
          <Badge variant={progress.status === 'completed' ? "default" : "outline"} className="text-[10px] h-5">
            {progress.status === 'completed' ? 'Terminé' : `${percentage}%`}
          </Badge>
        </div>
        
        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
      </div>
    </div>
  );
}
