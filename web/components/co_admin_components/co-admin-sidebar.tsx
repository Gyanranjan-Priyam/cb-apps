"use client";

import * as React from "react";
import {
  LayoutDashboard,
  FileText,
  Brain,
  Users,
  Layers,
  Trophy,
  ListChecks,
  QrCode,
  Compass,
} from "lucide-react";

import { NavMain } from "@/components/admin_components/dashboard/nav-main";
import { NavUser } from "@/components/admin_components/dashboard/nav-user";
import { isSystemAdminRole } from "@/lib/member-roles";
import { WorkspaceSwitcher } from "@/components/dashboard/workspace-switcher";
import Link from "next/link";
import Image from "next/image";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface CoAdminSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    role?: string | null;
  };
}

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/co-admin",
      icon: LayoutDashboard,
    },
    {
      title: "Members",
      url: "/co-admin/members",
      icon: Users,
    },
    {
      title: "Batches",
      url: "/co-admin/batches",
      icon: Layers,
    },
    {
      title: "Attendance",
      url: "/co-admin/attendance",
      icon: QrCode,
    },
    {
      title: "Quizzes",
      url: "/co-admin/quizzes",
      icon: Brain,
    },
    {
      title: "Tasks",
      url: "/co-admin/tasks",
      icon: ListChecks,
    },
    {
      title: "Leaderboard",
      url: "/co-admin/leaderboard",
      icon: Trophy,
    },
    {
      title: "Forms",
      url: "/co-admin/forms",
      icon: FileText,
    },
    {
      title: "Roadmaps",
      url: "/co-admin/roadmaps",
      icon: Compass,
    },
  ],
};

export function CoAdminSidebar({ user, ...props }: CoAdminSidebarProps) {
  const isAdmin = isSystemAdminRole(user?.role);

  const userData = user
    ? {
        name: user.name || "Co-Admin",
        email: user.email,
        avatar: user.image || "/default-avatar.png",
      }
    : {
        name: "Co-Admin User",
        email: "coadmin@example.com",
        avatar: "/default-avatar.png",
      };

  return (
    <Sidebar variant="floating" collapsible="icon" {...props}>
      <SidebarHeader className="gap-4 pb-1">
        {/* Brand Logo & Name */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              tooltip="CodeBreakers Co-Admin"
              className="data-[slot=sidebar-menu-button]:p-1.5 hover:bg-sidebar-accent transition-colors"
            >
              <Link
                href="/co-admin"
                className="flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg shrink-0">
                  <Image
                    src="/assets/logo.png"
                    alt="CodeBreakers Logo"
                    width={28}
                    height={28}
                    className="size-7 object-contain shrink-0"
                    priority
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-bold text-lg leading-none tracking-tight">
                    CodeBreakers
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Workspace Switcher Below Logo (Only shown for full admins) */}
        {isAdmin && (
          <WorkspaceSwitcher currentWorkspace="co-admin" userRole={user?.role} />
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
