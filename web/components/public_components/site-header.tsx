/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { BackButton } from "@/components/ui/back-button"
import { usePathname } from "next/navigation"
import { useMemo } from "react"
import { ReceiptText } from "lucide-react";
import { IconUserShield } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { isSystemAdminRole } from "@/lib/member-roles";
import { useSession } from "@/lib/auth-client";

import { ThemeSelectorDropdown } from "@/components/ui/theme-selector-dropdown";

interface SiteHeaderProps {
  user?: {
    role?: string | null;
    [key: string]: any;
  };
}

export function SiteHeader({ user }: SiteHeaderProps = {}) {
  const pathname = usePathname();
  const session = useSession();

  const isAdmin =
    isSystemAdminRole(user?.role) ||
    isSystemAdminRole(session?.data?.user?.role);

  // Generate page title based on current path
  const pageTitle = useMemo(() => {
    if (!pathname) return "Dashboard";

    const segments = pathname.split("/").filter(Boolean);
    
    // Handle different routes
    if (segments.includes("admin")) {
      if (segments.includes("payments")) {
        if (segments.includes("accommodation-payments")) {
          return "Accommodation Payment Details";
        } else if (segments.includes("team-payments")) {
          return "Team Payment Details";
        }
        return "Payments Management";
      } else if (segments.includes("accommodations")) {
        return "Accommodation Management";
      } else if (segments.includes("events")) {
        return "Events Management";
      } else if (segments.includes("participants")) {
        return "Participants Management";
      } else if (segments.includes("team")) {
        return "Team Management";
      } else if (segments.includes("reports")) {
        return "Reports";
      } else if (segments.includes("settings")) {
        return "Settings";
      } else if (segments.includes("system")) {
        return "System Management";
      }
      return "Admin Dashboard";
    } else if (segments.includes("dashboard")) {
      if (segments.includes("events")) {
        return "Events";
      } else if (segments.includes("teams")) {
        return "Team Management";
      } else if (segments.includes("settings")) {
        return "Profile Settings";
      } else if (segments.includes("transactions")) {
        return "Transaction History";
      } else if (segments.includes("resume-builder")) {
        return "ATS Resume Builder";
      }
      return "Dashboard";
    } else if (segments.includes("events")) {
      return "Events";
    } else if (segments.includes("login")) {
      return "Login";
    } else if (segments.includes("verify-request")) {
      return "Verify Email";
    }

    // Fallback: capitalize the last segment
    const lastSegment = segments[segments.length - 1];
    return lastSegment ? lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1) : "Dashboard";
  }, [pathname]);

  // Determine if back button should be shown (not on main dashboard pages)
  const showBackButton = useMemo(() => {
    if (!pathname) return false;
    
    const mainPages = [
      "/dashboard",
      "/dashboard/events",
      "/dashboard/teams",
      "/dashboard/settings",
      "/dashboard/transactions",
      "/dashboard/resume-builder",
    ];
    
    return !mainPages.includes(pathname);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md supports-backdrop-filter:bg-background/80 print:hidden flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        {showBackButton && (
          <>
            <BackButton />
            <Separator
              orientation="vertical"
              className="mx-2 data-[orientation=vertical]:h-4"
            />
          </>
        )}
        <h1 className="text-base font-medium">{pageTitle}</h1>
      </div>
      <div className="mr-6 flex items-center gap-2">
        <ThemeSelectorDropdown />
        
        {/* Transactions Navbar Button */}
        <Button
          variant="ghost"
          size="icon"
          asChild
          aria-label="Transaction History"
          className="cursor-pointer relative"
          title="Transaction History"
        >
          <Link href="/dashboard/transactions">
            <ReceiptText size={18} />
          </Link>
        </Button>
      </div>
    </header>
  )
}
