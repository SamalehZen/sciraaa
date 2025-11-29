import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { couple } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, or } from 'drizzle-orm';

const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export async function POST(req: Request) {
  const session = await auth.api.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is already in a couple
  const existingCouple = await db.query.couple.findFirst({
    where: or(
      eq(couple.partner1Id, session.user.id),
      eq(couple.partner2Id, session.user.id)
    ),
  });

  if (existingCouple) {
      return NextResponse.json(existingCouple);
  }

  let code = generateCode();
  let isUnique = false;
  
  // Simple retry loop for uniqueness
  while (!isUnique) {
      const existing = await db.query.couple.findFirst({
          where: eq(couple.code, code)
      });
      if (!existing) {
          isUnique = true;
      } else {
          code = generateCode();
      }
  }
  
  const [newCouple] = await db.insert(couple).values({
      code,
      partner1Id: session.user.id,
      status: 'active',
  }).returning();

  return NextResponse.json(newCouple);
}

export async function GET(req: Request) {
  const session = await auth.api.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userCouple = await db.query.couple.findFirst({
    where: or(
      eq(couple.partner1Id, session.user.id),
      eq(couple.partner2Id, session.user.id)
    ),
  });
  
  if (!userCouple) {
      return NextResponse.json(null);
  }
  
  return NextResponse.json(userCouple);
}
