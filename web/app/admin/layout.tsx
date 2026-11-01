import { AppSidebar } from "@/components/admin_components/dashboard/app-sidebar"
import { SiteHeader } from "@/components/admin_components/dashboard/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { requireAdmin } from "@/app/data/admin/require-admin"


export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Ensure only admin users can access this layout and get user data
  const session = await requireAdmin();

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar user={session.user} />
      <SidebarInset>
        <SiteHeader user={session.user} />
        <div className="flex-1 flex flex-col min-w-0 w-full">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
