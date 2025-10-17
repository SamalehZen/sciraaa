import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, user as appUser, session } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createSessionToken, createCookie } from '@/lib/local-session';
import { logAudit } from '@/lib/audit';
import { v4 as uuidv4 } from 'uuid';

function isArgon2(hash: string) {
  return hash.startsWith('$argon2');
}

function isBcrypt(hash: string) {
  return /^\$2[aby]\$/.test(hash);
}

async function verifyHybridPassword(hash: string, pwd: string) {
  if (isArgon2(hash)) {
    const argon2 = await import('argon2');
    return argon2.verify(hash, pwd);
  }
  if (isBcrypt(hash)) {
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(pwd, hash);
  }
  return false;
}

export async function POST(req: Request) {
  const hdrs = req.headers;
  const xfwd = hdrs.get('x-forwarded-for') || '';
  const ip = (xfwd.split(',')[0] || '').trim() || null;
  const userAgent = hdrs.get('user-agent') || null;

  try {
    const { username, password } = await req.json();

    const uname = (username || '').trim();
    const pwd = String(password || '');

    if (!/^[a-zA-Z0-9._-]{3,32}$/.test(uname)) {
      return NextResponse.json({ error: 'Nom d’utilisateur invalide' }, { status: 400 });
    }
    if (pwd.length < 3) {
      return NextResponse.json({ error: 'Mot de passe invalide' }, { status: 400 });
    }

    const cred = await db.query.users.findFirst({ where: eq(users.username, uname) });
    if (!cred) {
      await logAudit({ actorUsername: uname, actorRole: 'unknown', action: 'LOGIN_FAILED', metadata: { reason: 'UNKNOWN_USER' }, ip, userAgent });
      return NextResponse.json({ error: 'Nom d’utilisateur ou mot de passe incorrect' }, { status: 401 });
    }

    if (cred.isActive === false) {
      await logAudit({ actorUsername: uname, actorRole: cred.role, action: 'LOGIN_FAILED', metadata: { reason: 'SUSPENDED' }, ip, userAgent });
      return NextResponse.json({ error: 'Compte suspendu' }, { status: 403 });
    }

    const ok = await verifyHybridPassword(cred.passwordHash, pwd).catch(() => false);
    if (!ok) {
      await logAudit({ actorUsername: uname, actorRole: cred.role, action: 'LOGIN_FAILED', metadata: { reason: 'BAD_PASSWORD' }, ip, userAgent });
      return NextResponse.json({ error: 'Nom d’utilisateur ou mot de passe incorrect' }, { status: 401 });
    }

    const localUserId = `local:${uname}`;
    const localEmail = `${uname}@local`;

    const existing = await db.query.user.findFirst({ where: eq(appUser.id, localUserId) });

    if (!existing) {
      const now = new Date();
      await db.insert(appUser).values({
        id: localUserId,
        name: uname,
        email: localEmail,
        emailVerified: false,
        image: null,
        createdAt: now,
        updatedAt: now,
      });
    }

    const token = createSessionToken({ userId: localUserId, email: localEmail });
    const cookie = createCookie(token);

    // Persist session row (for admin security views)
    const now = new Date();
    const expiresAt = new Date(cookie.options.expires ?? now.getTime() + (cookie.options.maxAge || 0) * 1000);
    await db.insert(session).values({
      id: uuidv4(),
      token,
      userId: localUserId,
      createdAt: now,
      updatedAt: now,
      expiresAt,
      ipAddress: ip,
      userAgent: userAgent,
    });

    await logAudit({ actorUsername: uname, actorRole: cred.role, action: 'LOGIN', ip, userAgent });

    const res = NextResponse.json({ success: true }, { status: 200 });
    res.cookies.set(cookie.name, cookie.value, cookie.options);
    return res;
  } catch (e: any) {
    console.error('Local auth login error:', e);
    const message = e?.message || String(e);
    return NextResponse.json({ error: `Requête invalide: ${message}` }, { status: 400 });
  }
}