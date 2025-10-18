'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarSeparator, SidebarTrigger } from '@/components/ui/sidebar';
import { UserIcon, LayoutDashboardIcon, FileSpreadsheetIcon, FileTextIcon, SettingsIcon } from 'lucide-react';

export function AdminSidebarCompact({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const items = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboardIcon },
    { href: '/admin/users', label: 'Utilisateurs', icon: UserIcon },
    { href: '/admin/audit-logs', label: 'Journal d’audit', icon: FileTextIcon },
    { href: '/admin/exports', label: 'Exports', icon: FileSpreadsheetIcon },
    { href: '/admin/settings', label: 'Paramètres', icon: SettingsIcon },
  ];
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 h-8">
            <div className="text-lg font-bold">sciraaa</div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((it) => (
                  <SidebarMenuItem key={it.href}>
                    <SidebarMenuButton asChild isActive={pathname === it.href}>
                      <Link href={it.href} className="flex items-center gap-2">
                        <it.icon className="size-4" />
                        <span>{it.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter />
        <SidebarRail />
      </Sidebar>
      {children}
    </SidebarProvider>
  );
}