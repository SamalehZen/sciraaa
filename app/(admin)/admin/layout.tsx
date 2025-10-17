import { AdminSidebar } from '@/components/admin/sidebar';
import { SidebarInset } from '@/components/ui/sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminSidebar>
      <SidebarInset>
        <div className="p-4">{children}</div>
      </SidebarInset>
    </AdminSidebar>
  );
}
