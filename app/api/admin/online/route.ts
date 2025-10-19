export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { and, desc, gte, isNotNull, ne, eq } from 'drizzle-orm';
import { db, maindb } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { assertAdmin } from '@/lib/auth';

export async function GET(_req: NextRequest) {
  const hdrs = await headers();
  const adminUser = await assertAdmin({ headers: hdrs });
  if (!adminUser) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const now = new Date();
  const since = new Date(now.getTime() - 5 * 1000);

  const rows = await maindb
    .select({ id: user.id, name: user.name, ipAddress: user.ipAddress, lastSeen: user.lastSeen, status: user.status })
    .from(user)
    .where(
      and(
        isNotNull(user.lastSeen),
        gte(user.lastSeen, since),
        ne(user.status, 'deleted')
      )
    )
    .orderBy(desc(user.lastSeen))
    .limit(10);

  return NextResponse.json({ users: rows });
}
