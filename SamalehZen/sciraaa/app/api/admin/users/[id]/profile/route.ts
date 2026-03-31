import { NextResponse } from 'next/server';
import { assertAdmin } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { user, chat, message } from '@/lib/db/schema';
import { eq, desc, sql, and, asc } from 'drizzle-orm';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const adminUser = await assertAdmin({ headers: await headers() });
  if (!adminUser) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const [userInfo] = await db
      .select()
      .from(user)
      .where(eq(user.id, params.id))
      .limit(1);

    if (!userInfo) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const totalMessagesResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(message)
      .innerJoin(chat, eq(chat.id, message.chatId))
      .where(and(eq(chat.userId, params.id), eq(message.role, 'user')));

    const messages24hResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(message)
      .innerJoin(chat, eq(chat.id, message.chatId))
      .where(
        and(
          eq(chat.userId, params.id),
          eq(message.role, 'user'),
          sql`${message.createdAt} > NOW() - INTERVAL '24 hours'`
        )
      );

    const totalCostResult = await db
      .select({
        cost: sql<number>`SUM((${message.totalTokens} / 1000.0) * 5)`,
      })
      .from(message)
      .innerJoin(chat, eq(chat.id, message.chatId))
      .where(eq(chat.userId, params.id));

    const activityData = await db
      .select({
        date: sql<string>`DATE(${message.createdAt})`,
        messages: sql<number>`COUNT(*)`,
      })
      .from(message)
      .innerJoin(chat, eq(chat.id, message.chatId))
      .where(
        and(
          eq(chat.userId, params.id),
          eq(message.role, 'user'),
          sql`${message.createdAt} > NOW() - INTERVAL '30 days'`
        )
      )
      .groupBy(sql`DATE(${message.createdAt})`)
      .orderBy(asc(sql`DATE(${message.createdAt})`));

    const agentData = await db
      .select({
        agent: message.model,
        count: sql<number>`COUNT(*)`,
      })
      .from(message)
      .innerJoin(chat, eq(chat.id, message.chatId))
      .where(and(eq(chat.userId, params.id), eq(message.role, 'assistant')))
      .groupBy(message.model)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(10);

    const conversations = await db
      .select({
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt,
        messageCount: sql<number>`COUNT(${message.id})`,
      })
      .from(chat)
      .leftJoin(message, eq(message.chatId, chat.id))
      .where(eq(chat.userId, params.id))
      .groupBy(chat.id)
      .orderBy(desc(chat.createdAt))
      .limit(50);

    return NextResponse.json({
      user: userInfo,
      stats: {
        totalMessages: Number(totalMessagesResult[0]?.count) || 0,
        messages24h: Number(messages24hResult[0]?.count) || 0,
        totalCost: Number(totalCostResult[0]?.cost) || 0,
      },
      charts: {
        activity: activityData.map((d) => ({
          date: d.date,
          messages: Number(d.messages),
        })),
        agents: agentData.map((a) => ({
          agent: a.agent || 'Unknown',
          count: Number(a.count),
        })),
      },
      conversations: conversations.map((c) => ({
        id: c.id,
        title: c.title,
        createdAt: c.createdAt,
        messageCount: Number(c.messageCount),
      })),
    });
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
