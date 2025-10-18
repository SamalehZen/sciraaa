import Pusher from 'pusher-js';
import { clientEnv } from '@/env/client';

export const pusherClientUser = new Pusher(String(clientEnv.NEXT_PUBLIC_PUSHER_KEY || ''), {
  cluster: String(clientEnv.NEXT_PUBLIC_PUSHER_CLUSTER || ''),
  authEndpoint: '/api/realtime/pusher/auth',
});