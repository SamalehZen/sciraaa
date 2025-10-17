import { db } from '@/lib/db';
import { user as appUser, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export function makeLocalUserId(username: string) {
  return `local:${username}`;
}

export function parseLocalUsername(userId: string | null | undefined) {
  if (!userId) return null;
  if (!userId.startsWith('local:')) return null;
  return userId.slice('local:'.length);
}

export async function getAppUserByUsername(username: string) {
  const id = makeLocalUserId(username);
  const [u] = await db.select().from(appUser).where(eq(appUser.id, id)).limit(1);
  return u ?? null;
}

export async function isAdmin(username: string) {
  const cred = await db.query.users.findFirst({ where: eq(users.username, username) });
  return cred?.role === 'admin';
}
