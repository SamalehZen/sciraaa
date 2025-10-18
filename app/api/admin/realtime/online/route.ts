export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { getOnlineUsers } from '@/lib/realtime/pusher-server';

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const users = await getOnlineUsers();
  return NextResponse.json({ users });
}