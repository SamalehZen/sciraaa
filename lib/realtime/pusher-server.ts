import Pusher from 'pusher';
import { serverEnv } from '@/env/server';

export const ONLINE_USERS_CHANNEL = 'presence-online-users';

export const pusherServer = new Pusher({
  appId: serverEnv.PUSHER_APP_ID as string,
  key: serverEnv.PUSHER_KEY as string,
  secret: serverEnv.PUSHER_SECRET as string,
  cluster: serverEnv.PUSHER_CLUSTER as string,
  useTLS: true,
});

export async function getOnlineUsers() {
  try {
    const res = await pusherServer.get({ path: `/channels/${ONLINE_USERS_CHANNEL}/users` });
    const body = typeof res.body === 'string' ? JSON.parse(res.body) : res.body;
    return Array.isArray(body?.users) ? body.users : [];
  } catch {
    return [];
  }
}