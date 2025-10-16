import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/auth-utils';
import { deleteCustomAgent, getCustomAgentById, listAgentKnowledgeFiles, updateCustomAgent } from '@/lib/db/queries';

const UpdateAgentSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  systemPrompt: z.string().min(1).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = params.id;
    const agent = await getCustomAgentById({ id, userId: user.id });
    if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const files = await listAgentKnowledgeFiles({ agentId: id, userId: user.id });
    return NextResponse.json({ agent, files });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch agent' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = params.id;
    const body = await req.json();
    const parsed = UpdateAgentSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

    const updated = await updateCustomAgent({ id, userId: user.id, ...parsed.data });
    return NextResponse.json({ agent: updated });
  } catch (err: any) {
    if (err?.type === 'forbidden:ownership') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = params.id;
    const deleted = await deleteCustomAgent({ id, userId: user.id });
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err?.type === 'forbidden:ownership') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Failed to delete agent' }, { status: 500 });
  }
}
