export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { desc } from 'drizzle-orm';
import { maindb } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { assertAdmin } from '@/lib/auth';

export async function GET() {
  const hdrs = await headers();
  const adminUser = await assertAdmin({ headers: hdrs });
  if (!adminUser) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  console.log('[DEBUG /api/admin/users/debug] Fetching all users from maindb...');
  
  const rows = await maindb
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      lastSeen: user.lastSeen,
      ipAddress: user.ipAddress,
      geo: user.geo,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt));

  console.log(`[DEBUG /api/admin/users/debug] Found ${rows.length} users:`, rows.map(r => ({ id: r.id, name: r.name, role: r.role })));

  return NextResponse.json({ 
    count: rows.length,
    users: rows,
    debug: {
      adminUserId: adminUser.id,
      timestamp: new Date().toISOString(),
    }
  });
}
