import { NextResponse } from 'next/server';
import { serverEnv } from '@/env/server';
import { db } from '@/lib/db';
import { auditLog, userPresence, session } from '@/lib/db/schema';
import { lt } from 'drizzle-orm';

export async function POST(req: Request) {
  const auth = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!serverEnv.CRON_SECRET || auth !== serverEnv.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await db.delete(auditLog).where(lt(auditLog.createdAt, cutoff));
  await db.delete(userPresence).where(lt(userPresence.lastSeenAt as any, cutoff as any));
  await db.delete(session).where(lt(session.expiresAt, new Date()));
  return NextResponse.json({ ok: true, cutoff: cutoff.toISOString() });
}
