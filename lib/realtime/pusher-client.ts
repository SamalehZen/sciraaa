import Pusher from 'pusher-js';
import { clientEnv } from '@/env/client';

export const pusherClient = new Pusher(String(clientEnv.NEXT_PUBLIC_PUSHER_KEY || ''), {
  cluster: String(clientEnv.NEXT_PUBLIC_PUSHER_CLUSTER || ''),
  authEndpoint: '/api/admin/realtime/pusher/auth',
});