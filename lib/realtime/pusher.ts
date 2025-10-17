import Pusher from 'pusher';
import { serverEnv } from '@/env/server';

export const pusher = new Pusher({
  appId: serverEnv.PUSHER_APP_ID || '',
  key: serverEnv.PUSHER_KEY || '',
  secret: serverEnv.PUSHER_SECRET || '',
  cluster: serverEnv.PUSHER_CLUSTER || 'eu',
  useTLS: true,
});
