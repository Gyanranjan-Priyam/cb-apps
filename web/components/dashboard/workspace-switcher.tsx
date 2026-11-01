"use client";

import * as React from "react";
import {
  IconUserShield,
  IconUsers,
} from "@tabler/icons-react";
import {
  ChevronsUpDown,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { isSystemAdminRole, isCoAdminRole } from "@/lib/member-roles";

interface WorkspaceSwitcherProps {
  currentWorkspace: "admin" | "co-admin" | "member";
  userRole?: string | null;
}

export function WorkspaceSwitcher({
  currentWorkspace,
  userRole,
}: WorkspaceSwitcherProps) {
  const { isMobile } = useSidebar();
  const router = useRouter();

  const isAdmin = isSystemAdminRole(userRole) || currentWorkspace === "admin";
  const isCoAdmin = isCoAdminRole(userRole) || currentWorkspace === "co-admin";

  const allWorkspaces = [
    {
      id: "admin",
      title: "Admin Console",
      subtitle: "Management & Operations",
      url: "/admin",
      icon: IconUserShield,
    },
    {
      id: "co-admin",
      title: "Co-Admin Console",
      subtitle: "Operational Access",
      url: "/co-admin",
      icon: IconUserShield,
    },
    {
      id: "member",
      title: "Member Portal",
      subtitle: "Activities & Profile",
      url: "/dashboard",
      icon: IconUsers,
    },
  ];

  const workspaces = allWorkspaces.filter((ws) => {
    if (ws.id === "admin") return isAdmin;
    if (ws.id === "co-admin") return isAdmin || isCoAdmin;
    if (ws.id === "member") return true;
    return true;
  });

  const activeWs =
    workspaces.find((w) => w.id === currentWorkspace) ||
    allWorkspaces.find((w) => w.id === currentWorkspace) ||
    workspaces[0];
  const ActiveIcon = activeWs.icon;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="default"
              tooltip={`Workspace: ${activeWs.title}`}
              className="h-9 px-2.5 rounded-lg border border-border bg-muted/40 hover:bg-muted/70 data-[state=open]:bg-muted/80 transition-all cursor-pointer group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8"
            >
              <div className="flex size-5 items-center justify-center rounded-md bg-muted text-foreground border border-border/80 shrink-0 group-data-[collapsible=icon]:size-6">
                <ActiveIcon className="size-3.5 group-data-[collapsible=icon]:size-4" />
              </div>

              <div className="grid flex-1 text-left text-xs leading-tight group-data-[collapsible=icon]:hidden min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-medium text-foreground">
                    {activeWs.title}
                  </span>
                </div>
              </div>

              <ChevronsUpDown className="ml-auto size-3.5 text-muted-foreground group-data-[collapsible=icon]:hidden shrink-0" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-60 rounded-xl p-1.5 shadow-xl border-border"
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={6}
          >
            <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
              Switch Workspace
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="my-1" />

            <div className="space-y-1">
              {workspaces.map((ws) => {
                const isActive = ws.id === currentWorkspace;
                const IconComponent = ws.icon;

                return (
                  <DropdownMenuItem
                    key={ws.id}
                    onClick={() => router.push(ws.url)}
                    className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-all ${
                      isActive
                        ? "bg-accent text-accent-foreground font-medium"
                        : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="size-7 rounded-md bg-muted text-foreground border border-border/80 flex items-center justify-center shrink-0">
                      <IconComponent className="size-4" />
                    </div>

                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-foreground truncate">
                          {ws.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {ws.subtitle}
                      </p>
                    </div>

                    {isActive && (
                      <Check className="size-4 text-foreground shrink-0 ml-1" />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
