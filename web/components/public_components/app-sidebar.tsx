"use client";

import * as React from "react";
import {
  Calendar,
  LayoutDashboard,
  Settings,
  Users,
  Trophy,
  FolderGit,
  ListChecks,
  ReceiptText,
  FileText,
  Compass,
} from "lucide-react";
import { IconUserShield } from "@tabler/icons-react";
import {
  isSystemAdminRole,
  isCoAdminRole,
  hasAdminOrCoAdminAccess,
} from "@/lib/member-roles";

import { NavMain } from "@/components/public_components/nav-main";
import { NavSecondary } from "@/components/public_components/nav-secondary";
import { NavUser } from "@/components/public_components/nav-user";
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
    profileImageKey?: string | null;
    role?: string | null;
  };
}

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Quizzes",
      url: "/dashboard/activities/quizzes",
      icon: Calendar,
    },
    {
      title: "Tasks",
      url: "/dashboard/activities/tasks",
      icon: ListChecks,
    },

    {
      title: "Achievements",
      url: "/dashboard/achievements",
      icon: Trophy,
    },
    {
      title: "Leaderboards",
      url: "/dashboard/leaderboard",
      icon: Users,
    },
    {
      title: "Resume Builder (Beta)",
      url: "/dashboard/resume-builder",
      icon: FileText,
    },
    {
      title: "Roadmaps (Beta)",
      url: "/dashboard/roadmaps",
      icon: Compass,
    },
    {
      title: "Transactions",
      url: "/dashboard/transactions",
      icon: ReceiptText,
    },
    {
      title: "Projects",
      url: "/dashboard/projects",
      icon: FolderGit,
      isCollapsible: true,
      items: [
        {
          title: "My Projects",
          url: "/dashboard/projects/my-projects",
        },
        {
          title: "My Submissions",
          url: "/dashboard/projects/my-submissions",
        },
        {
          title: "Collaborative Projects",
          url: "/dashboard/projects/collaborative-projects",
        },
      ],
    },
  ],

  navSecondary: [
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings,
    },
  ],
};

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const isAdmin = isSystemAdminRole(user?.role);
  const isCoAdmin = isCoAdminRole(user?.role);
  const hasElevatedAccess = hasAdminOrCoAdminAccess(user?.role);

  const secondaryNav = React.useMemo(() => {
    const items = [...data.navSecondary];
    if (isAdmin) {
      items.unshift({
        title: "Admin Panel",
        url: "/admin",
        icon: IconUserShield,
      });
    } else if (isCoAdmin) {
      items.unshift({
        title: "Co-Admin Console",
        url: "/co-admin",
        icon: IconUserShield,
      });
    }
    return items;
  }, [isAdmin, isCoAdmin]);

  // Create user data with proper formatting
  const userData = user
    ? {
        name: user.name || "User",
        email: user.email,
        avatar: user.image || "/default-avatar.png",
        profileImageKey: user.profileImageKey || null,
        role: user.role || null,
      }
    : {
        name: "User",
        email: "user@example.com",
        avatar: "/default-avatar.png",
        profileImageKey: null,
        role: null,
      };

  return (
    <Sidebar variant="floating" collapsible="icon" {...props}>
      <SidebarHeader className="gap-3 pb-1">
        {/* Brand Logo & Name */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              tooltip="CodeBreakers"
              className="data-[slot=sidebar-menu-button]:p-1.5 hover:bg-sidebar-accent transition-colors"
            >
              <Link href="/dashboard" className="flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0">
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

        {/* Workspace Switcher Below Logo (Only shown for admins) */}
        {isAdmin && (
          <WorkspaceSwitcher currentWorkspace="member" userRole={user?.role} />
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={secondaryNav} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
