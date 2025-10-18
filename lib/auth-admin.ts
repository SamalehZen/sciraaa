import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { getSessionFromHeaders } from '@/lib/local-session';

export async function getUserRole(userId: string): Promise<'admin' | 'user'> {
  const u = await db.query.user.findFirst({ where: eq(user.id, userId) });
  if (!u) return 'user';
  const r = (u as any).role as string | null | undefined;
  return r === 'admin' ? 'admin' : 'user';
}

export async function requireAdmin(request: Request): Promise<false | { userId: string }> {
  const session = getSessionFromHeaders(request.headers);
  if (!session) return false;
  const u = await db.query.user.findFirst({ where: eq(user.id, session.userId) });
  if (!u) return false;
  if ((u as any).suspendedAt || (u as any).deletedAt) return false;
  const role = (u as any).role as string | null | undefined;
  if (role !== 'admin') return false;
  return { userId: u.id };
}