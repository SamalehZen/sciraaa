import { ReactNode } from 'react';
import Link from 'next/link';
import { AdminSidebarCompact } from '@/components/ui/sidebar-compact';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { UserProfile } from '@/components/user-profile';
import { PresenceConnector } from '@/components/admin/presence-connector';
import { AdminMetricsListener } from '@/components/admin/metrics-listener';
import { getSessionFromRequestCookies } from '@/lib/local-session';
import { db } from '@/lib/db';
import { user as appUser } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSessionFromRequestCookies();
  if (!session) redirect('/sign-in');
  const u = await db.query.user.findFirst({ where: eq(appUser.id, session.userId) });
  if (!u || (u as any).role !== 'admin' || (u as any).suspendedAt || (u as any).deletedAt) redirect('/');
  return (
    <AdminSidebarCompact>
      <SidebarInset>
        <header className="flex h-12 items-center gap-3 border-b px-3">
          <SidebarTrigger />
          <nav className="text-sm text-muted-foreground">
            <Link href="/admin" className="hover:text-foreground">Admin</Link>
          </nav>
          <div className="ml-auto">
            <UserProfile />
          </div>
        </header>
        <div className="p-4">{children}</div>
        <PresenceConnector />
        <AdminMetricsListener />
      </SidebarInset>
    </AdminSidebarCompact>
  );
}