import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSessionFromHeaders } from '@/lib/local-session';
import { db } from '@/lib/db';
import { users, chat, message } from '@/lib/db/schema';
import { and, between, desc, eq, gte, lte } from 'drizzle-orm';

export async function GET(req: Request, ctx: { params: { username: string } }) {
  const { username } = ctx.params;
  const url = new URL(req.url);
  const format = (url.searchParams.get('format') || 'json').toLowerCase();
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  const hdrs = await headers();
  const sess = getSessionFromHeaders(hdrs as any);
  if (!sess?.userId?.startsWith('local:')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const actor = sess.userId.slice('local:'.length);

  const actorCred = await db.query.users.findFirst({ where: eq(users.username, actor) });
  if (!actorCred || actorCred.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const userId = `local:${username}`;
  const where = and(eq(chat.userId, userId));

  const rows = await db
    .select({
      chatId: chat.id,
      messageId: message.id,
      role: message.role,
      parts: message.parts,
      createdAt: message.createdAt,
    })
    .from(message)
    .leftJoin(chat, eq(message.chatId, chat.id))
    .where(
      and(
        eq(chat.userId, userId),
        from ? gte(message.createdAt, new Date(from)) : undefined,
        to ? lte(message.createdAt, new Date(to)) : undefined,
      ) as any,
    )
    .orderBy(desc(message.createdAt))
    .limit(5000);

  if (format === 'csv') {
    const headers = ['chatId', 'messageId', 'role', 'createdAt', 'text'];
    const lines = [headers.join(',')];
    for (const r of rows) {
      const text = Array.isArray(r.parts)
        ? r.parts
            .filter((p: any) => p.type === 'text' && typeof p.text === 'string')
            .map((p: any) => (p.text as string).replaceAll('\n', ' ').replaceAll('"', '""'))
            .join(' ')
        : '';
      lines.push([r.chatId, r.messageId, r.role, r.createdAt?.toISOString?.() || '', `"${text}"`].join(','));
    }
    return new NextResponse(lines.join('\n'), {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="messages-${username}.csv"`,
      },
    });
  }

  return NextResponse.json({ messages: rows });
}
