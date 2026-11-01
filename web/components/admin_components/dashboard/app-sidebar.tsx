"use client";

import * as React from "react";
import {
  LayoutDashboard,
  FileText,
  Settings,
  Brain,
  Users,
  Layers,
  Trophy,
  Award,
  ListChecks,
  QrCode,
  Receipt,
  Compass,
  MonitorCog,
} from "lucide-react";

import { NavMain } from "@/components/admin_components/dashboard/nav-main";
import { NavSecondary } from "@/components/admin_components/dashboard/nav-secondary";
import { NavUser } from "@/components/admin_components/dashboard/nav-user";
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

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
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
      url: "/admin",
      icon: LayoutDashboard,
    },
    {
      title: "Members",
      url: "/admin/members",
      icon: Users,
    },
    {
      title: "Batches",
      url: "/admin/batches",
      icon: Layers,
    },
    {
      title: "Attendance",
      url: "/admin/attendance",
      icon: QrCode,
    },
    {
      title: "Quizzes",
      url: "/admin/quizzes",
      icon: Brain,
    },
    {
      title: "Tasks",
      url: "/admin/tasks",
      icon: ListChecks,
    },
    {
      title: "Leaderboard",
      url: "/admin/leaderboard",
      icon: Trophy,
    },
    {
      title: "Points Management",
      url: "/admin/points",
      icon: Award,
    },
    {
      title: "Forms",
      url: "/admin/forms",
      icon: FileText,
    },
    {
      title: "Roadmaps",
      url: "/admin/roadmaps",
      icon: Compass,
    },
    {
      title: "Transactions",
      url: "/admin/transactions",
      icon: Receipt,
    },
  ],
  navSecondary: [
    {
      title: "System Settings",
      url: "/admin/system-settings",
      icon: MonitorCog,
    },
    {
      title: "Settings",
      url: "/admin/settings",
      icon: Settings,
    },
  ],
};

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  // Create user data with proper formatting
  const userData = user
    ? {
        name: user.name || "User",
        email: user.email,
        avatar: user.image || "/default-avatar.png",
      }
    : {
        name: "Admin User",
        email: "admin@example.com",
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
              tooltip="CodeBreakers"
              className="data-[slot=sidebar-menu-button]:p-1.5 hover:bg-sidebar-accent transition-colors"
            >
              <Link
                href="/admin"
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

        {/* Workspace Switcher Below Logo */}
        <WorkspaceSwitcher currentWorkspace="admin" userRole={user?.role} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}