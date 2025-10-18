import { db } from '@/lib/db';
import { chat, message, user as appUser } from '@/lib/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { getSessionFromRequestCookies } from '@/lib/local-session';
import { eq as eqOp } from 'drizzle-orm';

export default async function AdminUserDetail({ params }: { params: { id: string } }) {
  const session = await getSessionFromRequestCookies();
  if (!session) redirect('/sign-in');
  const me = await db.query.user.findFirst({ where: eqOp(appUser.id, session.userId) });
  if (!me || (me as any).role !== 'admin') redirect('/');
  const id = params.id;
  const u = await db.query.user.findFirst({ where: eq(appUser.id, id) });
  if (!u) redirect('/admin/users');
  const msgs = await db
    .select()
    .from(message)
    .leftJoin(chat, eq(message.chatId, chat.id))
    .where(eq(chat.userId, id))
    .orderBy(desc(message.createdAt))
    .limit(100);
  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">{u.name} ({u.email})</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-md p-3">
          <div className="font-medium mb-2">Profil</div>
          <div className="text-sm">ID: {u.id}</div>
          <div className="text-sm">Rôle: {(u as any).role || 'user'}</div>
          <div className="text-sm">Statut: {(u as any).deletedAt ? 'deleted' : (u as any).suspendedAt ? 'suspended' : 'active'}</div>
          <div className="text-sm">Créé: {u.createdAt?.toString()}</div>
          <div className="text-sm">MAJ: {u.updatedAt?.toString()}</div>
        </div>
        <div className="border rounded-md p-3">
          <div className="font-medium mb-2">Derniers messages</div>
          <div className="space-y-2 max-h-[500px] overflow-auto">
            {msgs.map((row, i) => (
              <div key={i} className="border rounded p-2">
                <div className="text-xs text-muted-foreground">{row.message?.createdAt?.toString()} • {row.message?.role}</div>
                <pre className="text-xs whitespace-pre-wrap break-words">{JSON.stringify(row.message?.parts, null, 2)}</pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}