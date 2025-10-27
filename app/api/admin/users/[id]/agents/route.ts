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
    console.log(`[ADMIN-AGENTS] Fetching agent access for user ${userId}`);
    let access = await getUserAgentAccess(userId);
    
    // If no access records exist, initialize them
    if (!access || access.length === 0) {
      console.log(`[ADMIN-AGENTS] No access records found for user ${userId}, initializing...`);
      try {
        const { initializeUserAgentAccess } = await import('@/lib/db/queries');
        await initializeUserAgentAccess(userId);
        access = await getUserAgentAccess(userId);
        console.log(`[ADMIN-AGENTS] Initialized ${access.length} agents for user ${userId}`);
      } catch (initError) {
        console.error(`[ADMIN-AGENTS] Failed to initialize access for user ${userId}:`, initError);
        // Continue with empty array if initialization fails
      }
    }
    
    return NextResponse.json({
      success: true,
      data: access,
      count: access.length,
    });
  } catch (error) {
    console.error(`[ADMIN-AGENTS] Failed to get agent access for user ${userId}:`, error);
    return NextResponse.json({ error: 'Failed to get agent access', details: String(error) }, { status: 500 });
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

  if (Object.keys(agents).length === 0) {
    return NextResponse.json({ error: 'No agents provided' }, { status: 400 });
  }

  try {
    console.log(`[ADMIN-AGENTS] Admin ${adminUser.id} updating agents for user ${userId}`, agents);

    // Update agent access in database
    const updatePromises = Object.entries(agents).map(([agentId, enabled]) =>
      updateUserAgentAccess(userId, agentId, enabled as boolean)
    );
    
    const results = await Promise.all(updatePromises);
    console.log(`[ADMIN-AGENTS] Database updated for ${results.length} agents`);

    // Prepare event data
    const eventData = {
      userId,
      agents,
      timestamp: new Date().toISOString(),
      adminId: adminUser.id,
    };

    // Trigger Pusher events for real-time updates
    let pusherSuccess = false;
    try {
      const channelName = `private-user-${encodeChannelUserId(userId)}`;
      console.log(`[ADMIN-AGENTS] Triggering Pusher on channel: ${channelName}`);
      
      // Send to user's private channel
      await pusher.trigger(channelName, 'agent-access-updated', eventData);
      console.log(`[ADMIN-AGENTS] Pusher event sent to user ${userId}`);
      
      // Also send to admin channel
      await pusher.trigger('private-admin-users', 'user-updated', { userId, agents });
      console.log(`[ADMIN-AGENTS] Pusher event sent to admin channel`);
      
      pusherSuccess = true;
    } catch (pusherError) {
      console.error(`[ADMIN-AGENTS] Pusher error for user ${userId}:`, pusherError);
      // Don't fail - polling fallback will handle it
    }

    // Log the event in database for audit
    try {
      const evt = {
        id: crypto.randomUUID(),
        category: 'user' as any,
        type: 'agent_access_updated',
        message: `Agent access updated by admin ${adminUser.id} for user ${userId}`,
        metadata: { by: adminUser.id, agents, pusherSuccess },
        userId: userId,
        createdAt: new Date(),
      };
      await db.insert(event).values(evt);
      console.log(`[ADMIN-AGENTS] Event logged for user ${userId}`);
    } catch (logError) {
      console.error('[ADMIN-AGENTS] Failed to log event:', logError);
    }

    // Send response
    const disabledCount = Object.values(agents).filter((v) => v === false).length;
    const enabledCount = Object.values(agents).filter((v) => v === true).length;

    return NextResponse.json({
      success: true,
      message: `${enabledCount} agents enabled, ${disabledCount} agents disabled`,
      data: {
        userId,
        agents,
        pusherTriggered: pusherSuccess,
        timestamp: eventData.timestamp,
      },
    });
  } catch (error) {
    console.error('[ADMIN-AGENTS] Database error:', error);
    return NextResponse.json(
      { error: 'Failed to update agent access', details: String(error) },
      { status: 500 }
    );
  }
}
