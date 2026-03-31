import { NextResponse } from 'next/server';
import { assertAdmin } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { chat, user, message } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { logEvent } from '@/lib/db/queries';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const adminUser = await assertAdmin({ headers: await headers() });
  if (!adminUser) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const [chatData] = await db
      .select({
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        visibility: chat.visibility,
        userId: chat.userId,
        userName: user.name,
        userEmail: user.email,
        userImage: user.image,
      })
      .from(chat)
      .innerJoin(user, eq(chat.userId, user.id))
      .where(eq(chat.id, params.id))
      .limit(1);

    if (!chatData) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    const messages = await db
      .select()
      .from(message)
      .where(eq(message.chatId, params.id))
      .orderBy(asc(message.createdAt));

    await logEvent({
      category: 'security',
      type: 'admin_view_conversation',
      message: `Admin ${adminUser.name} a consulté conversation ${params.id}`,
      metadata: { adminId: adminUser.id, chatId: params.id, userId: chatData.userId },
      userId: adminUser.id,
    });

    return NextResponse.json({
      chat: {
        id: chatData.id,
        title: chatData.title,
        createdAt: chatData.createdAt,
        updatedAt: chatData.updatedAt,
        visibility: chatData.visibility,
        userId: chatData.userId,
      },
      user: {
        name: chatData.userName,
        email: chatData.userEmail,
        image: chatData.userImage,
      },
      messages,
    });
  } catch (error: any) {
    console.error('Error fetching chat:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chat' },
      { status: 500 }
    );
  }
}
