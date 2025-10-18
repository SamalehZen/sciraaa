import { ReactNode } from 'react';
import Link from 'next/link';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar-animated';
import { LayoutDashboardIcon, UserIcon, FileSpreadsheetIcon, FileTextIcon, SettingsIcon } from 'lucide-react';
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
  const links = [
    { href: '/admin', label: 'Dashboard', icon: <LayoutDashboardIcon className="h-5 w-5 text-neutral-700 dark:text-neutral-200" /> },
    { href: '/admin/users', label: 'Utilisateurs', icon: <UserIcon className="h-5 w-5 text-neutral-700 dark:text-neutral-200" /> },
    { href: '/admin/audit-logs', label: 'Journal d’audit', icon: <FileTextIcon className="h-5 w-5 text-neutral-700 dark:text-neutral-200" /> },
    { href: '/admin/exports', label: 'Exports', icon: <FileSpreadsheetIcon className="h-5 w-5 text-neutral-700 dark:text-neutral-200" /> },
    { href: '/admin/settings', label: 'Paramètres', icon: <SettingsIcon className="h-5 w-5 text-neutral-700 dark:text-neutral-200" /> },
  ];

  return (
    <div className="flex w-full min-h-screen">
      <Sidebar>
        <SidebarBody className="justify-between gap-6">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            <div className="mt-2 flex flex-col gap-2">
              {links.map((link) => (
                <SidebarLink key={link.href} link={link} />
              ))}
            </div>
          </div>
        </SidebarBody>
      </Sidebar>
      <div className="flex-1 flex flex-col">
        <header className="flex h-12 items-center gap-3 border-b px-3">
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
      </div>
    </div>
  );
}