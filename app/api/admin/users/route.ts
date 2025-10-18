
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { listUsersWithStats } from '@/lib/db/admin-queries';
import { db } from '@/lib/db';
import { users, user as appUser } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  const items = await listUsersWithStats(limit, offset);
  return NextResponse.json({ items, limit, offset });
}

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json().catch(() => ({} as any));
  const username = String(body.username || '').trim();
  const password = String(body.password || '');
  const email = String(body.email || '').trim();
  const name = String(body.name || username);
  const role = (body.role === 'admin' ? 'admin' : 'user') as 'admin' | 'user';
  if (!username || password.length < 3 || !email) return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  const existing = await db.query.users.findFirst({ where: eq(users.username, username) });
  if (existing) return NextResponse.json({ error: 'Username exists' }, { status: 400 });
  const argon2 = await import('argon2');
  const passwordHash = await argon2.hash(password);
  await db.insert(users).values({ username, passwordHash });
  const id = `local:${username}`;
  const now = new Date();
  const existingUser = await db.query.user.findFirst({ where: eq(appUser.id, id) });
  if (!existingUser) {
    await db.insert(appUser).values({ id, name, email, emailVerified: false, image: null, role, createdAt: now, updatedAt: now });
  }
  return NextResponse.json({ id });
}