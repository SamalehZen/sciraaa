export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { updateUserAgentMask } from '@/lib/db/queries';

export async function PUT(req: NextRequest) {
  const hdrs = await headers();
  const session = await auth.api.getSession({ headers: hdrs });
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { agentId, masked } = await req.json();

    if (!agentId || typeof masked !== 'boolean') {
      return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 });
    }

    const result = await updateUserAgentMask(session.user.id, agentId, masked);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to update agent mask:', error);
    return NextResponse.json({ error: 'Failed to update agent mask' }, { status: 500 });
  }
}
