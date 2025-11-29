import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dateSession, placeSwipe, dateMatch, couple } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { pusher } from '@/lib/pusher';

export async function POST(req: Request) {
    const session = await auth.api.getSession();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, placeId, placeData, liked } = await req.json();

    // Check valid session
    const currentSession = await db.query.dateSession.findFirst({
        where: eq(dateSession.id, sessionId)
    });
    
    if (!currentSession || currentSession.status !== 'active') {
         return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
    }
    
    await db.insert(placeSwipe).values({
        sessionId,
        userId: session.user.id,
        placeId,
        placeData,
        liked
    });

    // Trigger swipe event for progress update
    try {
        await pusher.trigger(`private-session-${sessionId}`, 'swipe', {
            userId: session.user.id,
            placeId,
            liked
        });
    } catch (e) {
        console.error('Pusher swipe trigger error', e);
    }

    // Check for match if liked
    if (liked) {
        const swipes = await db.query.placeSwipe.findMany({
            where: and(
                eq(placeSwipe.sessionId, sessionId),
                eq(placeSwipe.placeId, placeId),
                eq(placeSwipe.liked, true)
            )
        });
        
        if (swipes.length >= 2) {
             // Create match record
             const [newMatch] = await db.insert(dateMatch).values({
                 sessionId,
                 coupleId: currentSession.coupleId,
                 placeId,
                 placeData,
                 status: 'confirmed'
             }).returning();
             
             // Update session
             await db.update(dateSession)
                 .set({ matchedPlaceId: placeId, status: 'completed', completedAt: new Date() })
                 .where(eq(dateSession.id, sessionId));
                 
             // Notify via Pusher
             try {
                 await pusher.trigger(`private-session-${sessionId}`, 'match', {
                     placeId,
                     placeData,
                     matchId: newMatch.id
                 });
             } catch (e) {
                 console.error('Pusher match trigger error', e);
             }
             
             return NextResponse.json({ matched: true, match: newMatch });
        }
    }

    return NextResponse.json({ matched: false });
}
