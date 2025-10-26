'use client';

import { Sidebar, SidebarBody, DesktopSidebar, MobileSidebar, SidebarLink, useSidebar } from '@/components/ui/animated-sidebar';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Home, Settings, Users, LogOut, Mail, Bell } from 'lucide-react';
import Link from 'next/link';
import AuthCard from '@/components/auth-card';

const links = [
  {
    label: "Accueil",
    href: "/",
    icon: <Home className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
  },
  {
    label: "Paramètres",
    href: "/admin/settings",
    icon: <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
  },
  {
    label: "Utilisateurs",
    href: "/admin/users",
    icon: <Users className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
  },
  {
    label: "Notifications",
    href: "#",
    icon: <Bell className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
  },
  {
    label: "Messages",
    href: "#",
    icon: <Mail className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
  },
];

function SidebarContent() {
  const { open } = useSidebar();
  return (
    <div className="flex flex-col h-full justify-between">
      <div className="flex flex-col gap-4">
        {links.map((link, idx) => (
          <SidebarLink key={idx} link={link} />
        ))}
      </div>
      <div>
        <SidebarLink
          link={{
            label: "Déconnexion",
            href: "/api/auth/logout",
            icon: <LogOut className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
          }}
        />
      </div>
    </div>
  );
}

export default function LoginAlternativePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem('scira:selected-profile');
      if (raw) {
        const data = JSON.parse(raw) as { label?: string } | null;
        if (data?.label) {
          toast.success('Profil sélectionné', { description: data.label, duration: 3000 });
        } else {
          toast.success('Profil sélectionné', { duration: 3000 });
        }
        localStorage.removeItem('scira:selected-profile');
      }
    } catch {}
  }, []);

  if (!mounted) return null;

  return (
    <Sidebar>
      <SidebarBody>
        <SidebarContent />
      </SidebarBody>
      <div className="flex-1 flex items-center justify-center p-4">
        <AuthCard title="Bon retour" description="Connectez-vous pour continuer vers Hyper AI" />
      </div>
    </Sidebar>
  );
}
