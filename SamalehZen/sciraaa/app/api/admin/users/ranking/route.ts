import { NextResponse } from 'next/server';
import { assertAdmin } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { user, chat, message } from '@/lib/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';

export async function GET() {
  const adminUser = await assertAdmin({ headers: await headers() });
  if (!adminUser) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const topUsers = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        totalMessages: sql<number>`COUNT(DISTINCT ${message.id})`,
        messages24h: sql<number>`COUNT(DISTINCT CASE WHEN ${message.createdAt} > NOW() - INTERVAL '24 hours' THEN ${message.id} END)`,
        lastSeen: user.lastSeen,
      })
      .from(user)
      .leftJoin(chat, eq(chat.userId, user.id))
      .leftJoin(message, eq(message.chatId, chat.id))
      .where(eq(user.status, 'active'))
      .groupBy(user.id)
      .orderBy(desc(sql`COUNT(DISTINCT ${message.id})`))
      .limit(50);

    const details = await Promise.all(
      topUsers.map(async (u) => {
        const agentStats = await db
          .select({
            model: message.model,
            count: sql<number>`COUNT(*)`,
          })
          .from(message)
          .innerJoin(chat, eq(chat.id, message.chatId))
          .where(and(eq(chat.userId, u.id), eq(message.role, 'assistant')))
          .groupBy(message.model)
          .orderBy(desc(sql`COUNT(*)`))
          .limit(1);

        return {
          ...u,
          totalMessages: Number(u.totalMessages) || 0,
          messages24h: Number(u.messages24h) || 0,
          favoriteAgent: agentStats[0]?.model || 'N/A',
        };
      })
    );

    const ranking = details.map((u) => ({
      name: u.name || u.email,
      messageCount: u.totalMessages,
    }));

    return NextResponse.json({
      ranking,
      details,
    });
  } catch (error: any) {
    console.error('Error fetching user ranking:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch ranking' },
      { status: 500 }
    );
  }
}
