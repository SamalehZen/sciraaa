"use client";

import * as React from "react";
import { IconDashboard, IconListDetails, IconReport, IconSettings, IconUsers, IconDatabase, IconFileDescription, IconInnerShadowTop } from "@tabler/icons-react";

import { NavDocuments } from "@/components/orcish/nav-documents";
import { NavMain } from "@/components/orcish/nav-main";
import { NavSecondary } from "@/components/orcish/nav-secondary";
import { NavUser } from "@/components/orcish/nav-user";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

const data = {
  user: {
    name: "Admin",
    email: "admin@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    { title: "Dashboard", url: "/admin", icon: IconDashboard },
    { title: "Users", url: "/admin/users", icon: IconUsers },
    { title: "Audit Logs", url: "/admin/audit-logs", icon: IconReport },
    { title: "Exports", url: "/admin/exports", icon: IconFileDescription },
    { title: "Settings", url: "/admin/settings", icon: IconSettings },
  ],
  navSecondary: [
    { title: "Data", url: "#", icon: IconDatabase },
    { title: "Details", url: "#", icon: IconListDetails },
  ],
  documents: [
    { name: "Reports", url: "#", icon: IconReport },
    { name: "Datasets", url: "#", icon: IconDatabase },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="/admin">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Scira Admin</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
