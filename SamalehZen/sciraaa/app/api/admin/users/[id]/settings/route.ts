import { NextResponse } from 'next/server';
import { assertAdmin } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { customInstructions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logEvent } from '@/lib/db/queries';
import { generateId } from 'ai';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const adminUser = await assertAdmin({ headers: await headers() });
  if (!adminUser) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const [instructions] = await db
      .select()
      .from(customInstructions)
      .where(eq(customInstructions.userId, params.id))
      .limit(1);

    return NextResponse.json({
      customInstructions: instructions?.content || '',
      searchProvider: 'parallel',
      agentOrder: [],
    });
  } catch (error: any) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch settings' },
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
    const body = await req.json();

    if ('customInstructions' in body) {
      await db
        .insert(customInstructions)
        .values({
          id: generateId(),
          userId: params.id,
          content: body.customInstructions,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: customInstructions.userId,
          set: { content: body.customInstructions, updatedAt: new Date() },
        });
    }

    await logEvent({
      category: 'user',
      type: 'settings_updated_by_admin',
      message: `Admin ${adminUser.name} a modifié les paramètres de l'utilisateur ${params.id}`,
      metadata: { by: adminUser.id, changes: Object.keys(body) },
      userId: params.id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating user settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}
