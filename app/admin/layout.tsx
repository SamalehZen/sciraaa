import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/orcish/app-sidebar';
import { SiteHeader } from '@/components/orcish/site-header';
import { ActiveThemeProvider } from '@/components/orcish/active-theme';
import { PresenceConnector } from '@/components/admin/presence-connector';
import { AdminMetricsListener } from '@/components/admin/metrics-listener';

import { getSessionFromRequestCookies } from '@/lib/local-session';
import { db } from '@/lib/db';
import { user as appUser } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSessionFromRequestCookies();
  if (!session) redirect('/sign-in');
  const u = await db.query.user.findFirst({ where: eq(appUser.id, session.userId) });
  if (!u || (u as any).role !== 'admin' || (u as any).suspendedAt || (u as any).deletedAt) redirect('/');

  const cookieStore = cookies();
  const activeThemeValue = cookieStore.get('active_theme')?.value;

  return (
    <ActiveThemeProvider initialTheme={activeThemeValue}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="p-4">{children}</div>
          <PresenceConnector />
          <AdminMetricsListener />
        </SidebarInset>
      </SidebarProvider>
    </ActiveThemeProvider>
  );
}
