export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { assertAdmin } from '@/lib/auth';
import { getUserAgentAccess, updateUserAgentAccess } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { event } from '@/lib/db/schema';
import { pusher } from '@/lib/pusher';
import { encodeChannelUserId } from '@/lib/pusher-utils';

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const hdrs = await headers();
  const adminUser = await assertAdmin({ headers: hdrs });
  if (!adminUser) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const params = await props.params;
  const userId = decodeURIComponent(params.id);

  try {
    const access = await getUserAgentAccess(userId);
    return NextResponse.json(access);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get agent access' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const hdrs = await headers();
  const adminUser = await assertAdmin({ headers: hdrs });
  if (!adminUser) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const params = await props.params;
  const userId = decodeURIComponent(params.id);
  const body = await req.json().catch(() => ({}));
  const agents = body.agents || {};

  try {
    // Update agent access in database
    await Promise.all(
      Object.entries(agents).map(([agentId, enabled]) =>
        updateUserAgentAccess(userId, agentId, enabled as boolean)
      )
    );

    // Trigger Pusher events for real-time updates
    try {
      const channelName = `private-user-${encodeChannelUserId(userId)}`;
      console.log(`[AGENT-ACCESS] Triggering Pusher event on channel: ${channelName}`);
      
      await pusher.trigger('private-admin-users', 'updated', { userId });
      await pusher.trigger(channelName, 'agent-access-updated', { 
        userId,
        agents,
        timestamp: new Date().toISOString() 
      });
      
      console.log(`[AGENT-ACCESS] Pusher event sent successfully for user ${userId}`);
    } catch (pusherError) {
      console.error(`[AGENT-ACCESS] Pusher error for user ${userId}:`, pusherError);
      // Don't fail the request if Pusher fails - still important to update DB
    }

    // Log the event
    const evt = {
      id: crypto.randomUUID(),
      category: 'user' as any,
      type: 'agent_access_updated',
      message: `Mise à jour accès agents pour utilisateur ${userId}`,
      metadata: { by: adminUser.id, agents },
      userId: userId,
      createdAt: new Date(),
    };
    await db.insert(event).values(evt);

    try {
      await pusher.trigger('private-admin-events', 'new', evt);
    } catch (err) {
      console.error('[AGENT-ACCESS] Failed to trigger admin events:', err);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Agent access updated successfully'
    });
  } catch (error) {
    console.error('[AGENT-ACCESS] Database error:', error);
    return NextResponse.json({ error: 'Failed to update agent access' }, { status: 500 });
  }
}
