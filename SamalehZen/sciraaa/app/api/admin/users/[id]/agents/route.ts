import { NextResponse } from 'next/server';
import { assertAdmin } from '@/lib/auth';
import { headers } from 'next/headers';
import { getUserAgentAccess, updateUserAgentAccess, logEvent } from '@/lib/db/queries';
import { pusher } from '@/lib/pusher';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const adminUser = await assertAdmin({ headers: await headers() });
  if (!adminUser) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const access = await getUserAgentAccess(params.id);
    return NextResponse.json(access);
  } catch (error: any) {
    console.error('Error fetching user agent access:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch agent access' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const adminUser = await assertAdmin({ headers: await headers() });
  if (!adminUser) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { agents } = await req.json();

    if (!agents || typeof agents !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    await Promise.all(
      Object.entries(agents).map(([agentId, enabled]) =>
        updateUserAgentAccess(params.id, agentId, enabled as boolean)
      )
    );

    if (pusher) {
      await pusher.trigger('private-admin-users', 'updated', { userId: params.id });
    }

    await logEvent({
      category: 'user',
      type: 'agent_access_updated',
      message: `Mise à jour accès agents pour utilisateur ${params.id}`,
      metadata: { by: adminUser.id, agents },
      userId: params.id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating user agent access:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update agent access' },
      { status: 500 }
    );
  }
}
