import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { couple } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, and, isNull } from 'drizzle-orm';
import { pusher } from '@/lib/pusher';

export async function POST(req: Request) {
  const session = await auth.api.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  
  const { code } = body;
  if (!code) {
      return NextResponse.json({ error: 'Code required' }, { status: 400 });
  }

  const targetCouple = await db.query.couple.findFirst({
      where: and(
          eq(couple.code, code),
          isNull(couple.partner2Id)
      )
  });

  if (!targetCouple) {
      return NextResponse.json({ error: 'Invalid code or couple is full' }, { status: 404 });
  }
  
  if (targetCouple.partner1Id === session.user.id) {
      return NextResponse.json({ error: 'Cannot join your own couple' }, { status: 400 });
  }

  const [updatedCouple] = await db.update(couple)
      .set({ partner2Id: session.user.id, status: 'active' })
      .where(eq(couple.id, targetCouple.id))
      .returning();

  try {
      await pusher.trigger(`private-couple-${targetCouple.id}`, 'partner-joined', { 
          userId: session.user.id,
          name: session.user.name 
      });
  } catch (error) {
      console.error('Pusher trigger failed', error);
  }
  
  return NextResponse.json(updatedCouple);
}
