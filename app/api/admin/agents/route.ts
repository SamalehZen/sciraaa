export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { assertAdmin } from '@/lib/auth';
import { getGlobalHiddenAgents, updateGlobalHiddenAgents } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { event } from '@/lib/db/schema';
import { pusher } from '@/lib/pusher';

// GET - Récupérer les agents masqués globalement
export async function GET(_req: NextRequest) {
  const hdrs = await headers();
  const adminUser = await assertAdmin({ headers: hdrs });
  if (!adminUser) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const hiddenAgents = await getGlobalHiddenAgents();
    return NextResponse.json({ hiddenAgents });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get global agent settings' }, { status: 500 });
  }
}

// PATCH - Mettre à jour les agents masqués globalement
export async function PATCH(req: NextRequest) {
  const hdrs = await headers();
  const adminUser = await assertAdmin({ headers: hdrs });
  if (!adminUser) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { hiddenAgents } = body;

  if (!Array.isArray(hiddenAgents)) {
    return NextResponse.json({ error: 'hiddenAgents must be an array' }, { status: 400 });
  }

  try {
    await updateGlobalHiddenAgents(hiddenAgents);

    // Déclencher événement Pusher pour tous les utilisateurs
    try {
      await pusher.trigger('private-global-settings', 'agents-updated', { hiddenAgents });
    } catch (pusherError) {
      console.error('Pusher trigger failed:', pusherError);
    }

    // Créer un événement dans les logs admin
    const evt = {
      id: crypto.randomUUID(),
      category: 'system' as any,
      type: 'global_agents_updated',
      message: `Agents masqués globalement mis à jour par ${adminUser.name}`,
      metadata: { by: adminUser.id, hiddenAgents },
      userId: adminUser.id,
      createdAt: new Date(),
    };
    await db.insert(event).values(evt);

    try {
      await pusher.trigger('private-admin-events', 'new', evt);
    } catch {}

    return NextResponse.json({ success: true, hiddenAgents });
  } catch (error) {
    console.error('Failed to update global agents:', error);
    return NextResponse.json({ error: 'Failed to update global agent settings' }, { status: 500 });
  }
}
