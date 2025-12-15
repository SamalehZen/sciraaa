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
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'txt';

    const [chatData] = await db
      .select({
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt,
        userId: chat.userId,
        userName: user.name,
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

    let content = '';

    if (format === 'markdown') {
      content = `# ${chatData.title}\n\n`;
      content += `**Utilisateur:** ${chatData.userName}\n`;
      content += `**Date:** ${new Date(chatData.createdAt).toLocaleString('fr-FR')}\n\n`;
      content += `---\n\n`;

      messages.forEach((msg: any) => {
        const role = msg.role === 'user' ? '👤 Utilisateur' : '🤖 Assistant';
        content += `## ${role} (${new Date(msg.createdAt).toLocaleString('fr-FR')})\n\n`;

        if (msg.model) content += `*Agent: ${msg.model}*\n\n`;

        msg.parts?.forEach((part: any) => {
          if (part.type === 'text') {
            content += `${part.text}\n\n`;
          }
        });

        content += `---\n\n`;
      });
    } else {
      content = `${chatData.title}\n`;
      content += `Utilisateur: ${chatData.userName}\n`;
      content += `Date: ${new Date(chatData.createdAt).toLocaleString('fr-FR')}\n`;
      content += `${'='.repeat(60)}\n\n`;

      messages.forEach((msg: any) => {
        const role = msg.role === 'user' ? 'UTILISATEUR' : 'ASSISTANT';
        content += `[${role}] ${new Date(msg.createdAt).toLocaleString('fr-FR')}`;
        if (msg.model) content += ` (${msg.model})`;
        content += `\n`;

        msg.parts?.forEach((part: any) => {
          if (part.type === 'text') {
            content += `${part.text}\n`;
          }
        });

        content += `\n${'-'.repeat(60)}\n\n`;
      });
    }

    await logEvent({
      category: 'security',
      type: 'admin_export_conversation',
      message: `Admin ${adminUser.name} a exporté conversation ${params.id} (${format})`,
      metadata: { adminId: adminUser.id, chatId: params.id, format },
      userId: adminUser.id,
    });

    return new Response(content, {
      headers: {
        'Content-Type': format === 'markdown' ? 'text/markdown' : 'text/plain',
        'Content-Disposition': `attachment; filename="conversation-${params.id}.${format === 'markdown' ? 'md' : 'txt'}"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting chat:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export chat' },
      { status: 500 }
    );
  }
}
