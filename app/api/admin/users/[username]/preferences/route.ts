import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSessionFromHeaders } from '@/lib/local-session';
import { db } from '@/lib/db';
import { users, userPreferences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logAudit } from '@/lib/audit';

async function requireAdmin() {
  const hdrs = await headers();
  const sess = getSessionFromHeaders(hdrs as any);
  if (!sess?.userId?.startsWith('local:')) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const actor = sess.userId.slice('local:'.length);
  const [admin] = await db.select().from(users).where(eq(users.username, actor)).limit(1);
  if (!admin || admin.role !== 'admin') return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { actor, role: admin.role };
}

export async function GET(_req: Request, ctx: { params: { username: string } }) {
  const admin = await requireAdmin();
  if ('error' in admin) return admin.error;

  const { username } = ctx.params;
  const prefs = await db.query.userPreferences.findFirst({ where: eq(userPreferences.username, username) });
  return NextResponse.json({ preferences: prefs ?? { username, language: 'fr', theme: 'system', prefs: {} } });
}

export async function PUT(req: Request, ctx: { params: { username: string } }) {
  const admin = await requireAdmin();
  if ('error' in admin) return admin.error;
  const { actor, role } = admin;

  const { username } = ctx.params;
  const body = await req.json().catch(() => ({}));
  const { language = 'fr', theme = 'system', prefs = {} } = body || {};

  await db
    .insert(userPreferences)
    .values({ username, language, theme, prefs, updatedAt: new Date() })
    .onConflictDoUpdate({ target: userPreferences.username, set: { language, theme, prefs, updatedAt: new Date() } });

  await logAudit({ actorUsername: actor, actorRole: role, targetUsername: username, action: 'UPDATE_PREFS', metadata: { language, theme } });

  return NextResponse.json({ ok: true });
}
