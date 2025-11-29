import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dateSession, couple, dateMatch } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, desc, and, or } from 'drizzle-orm';
import { pusher } from '@/lib/pusher';

export async function POST(req: Request) {
  const session = await auth.api.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { coupleId, location, placeType, radius } = body;

  // Verify user belongs to couple
  const userCouple = await db.query.couple.findFirst({
      where: and(
          eq(couple.id, coupleId),
          or(
             eq(couple.partner1Id, session.user.id),
             eq(couple.partner2Id, session.user.id)
          )
      )
  });

  if (!userCouple) {
      return NextResponse.json({ error: 'Invalid couple' }, { status: 403 });
  }

  // Deactivate previous sessions
  await db.update(dateSession)
      .set({ status: 'cancelled' })
      .where(and(eq(dateSession.coupleId, coupleId), eq(dateSession.status, 'active')));

  const [newSession] = await db.insert(dateSession).values({
      coupleId,
      location,
      placeType,
      radius,
      status: 'active'
  }).returning();
  
  try {
      await pusher.trigger(`private-couple-${coupleId}`, 'session-started', newSession);
  } catch (e) {
      console.error('Pusher error', e);
  }

  return NextResponse.json(newSession);
}

export async function GET(req: Request) {
    const session = await auth.api.getSession();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const coupleId = url.searchParams.get('coupleId');

    if (!coupleId) return NextResponse.json({error: 'Missing coupleId'}, {status: 400});

    const activeSession = await db.query.dateSession.findFirst({
        where: and(
            eq(dateSession.coupleId, coupleId), 
            or(
                eq(dateSession.status, 'active'),
                eq(dateSession.status, 'completed')
            )
        ),
        orderBy: [desc(dateSession.createdAt)],
        with: {
            // We need to define relations in schema.ts to use 'with' properly,
            // or we can just manual query.
            // Since schema relations might not be set up, let's do a manual query if matched.
        }
    });

    if (activeSession?.status === 'completed' && activeSession.matchedPlaceId) {
        // Fetch match details
        const match = await db.query.dateMatch.findFirst({
            where: and(
                eq(dateMatch.sessionId, activeSession.id),
                eq(dateMatch.placeId, activeSession.matchedPlaceId)
            )
        });
        return NextResponse.json({ ...activeSession, match });
    }

    return NextResponse.json(activeSession || null);
}
