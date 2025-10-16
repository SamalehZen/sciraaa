import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/auth-utils';
import { createCustomAgent, listCustomAgentsForUser } from '@/lib/db/queries';

const CreateAgentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  systemPrompt: z.string().min(1),
});

export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const agents = await listCustomAgentsForUser({ userId: user.id });
    return NextResponse.json({ agents });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list agents' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = CreateAgentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { name, description, systemPrompt } = parsed.data;
    const agent = await createCustomAgent({ userId: user.id, name, description: description ?? null, systemPrompt });
    return NextResponse.json({ agent }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
  }
}
