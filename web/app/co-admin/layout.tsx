import { CoAdminSidebar } from "@/components/co_admin_components/co-admin-sidebar";
import { SiteHeader } from "@/components/admin_components/dashboard/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { requireCoAdmin } from "@/app/data/admin/require-co-admin";

export default async function CoAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ensure only co-admin or full admin users can access this layout
  const session = await requireCoAdmin();

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <CoAdminSidebar user={session.user} />
      <SidebarInset>
        <SiteHeader user={session.user} />
        <div className="flex-1 flex flex-col min-w-0 w-full">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
