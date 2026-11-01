"use client";

import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface DynamicBreadcrumbProps {
  className?: string;
  homeUrl?: string;
  homeLabel?: string;
}

export function DynamicBreadcrumb({ 
  className = "", 
  homeUrl = "/dashboard",
  homeLabel = "Home"
}: DynamicBreadcrumbProps) {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    if (!pathname) return [];

    const segments = pathname.split("/").filter(Boolean);
    const items: BreadcrumbItem[] = [];
    
    // Always start with home
    items.push({ label: homeLabel, href: homeUrl });

    let currentPath = "";
    
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Generate label based on segment
      let label = segment;
      
      // Custom labels for known segments
      const segmentLabels: Record<string, string> = {
        admin: "Admin",
        dashboard: "Dashboard",
        accommodations: "Accommodations",
        payments: "Payments",
        events: "Events",
        participants: "Participants",
        team: "Team",
        teams: "Teams",
        reports: "Reports",
        settings: "Settings",
        system: "System",
        participate: "Participate",
        edit: "Edit",
        "accommodation-payments": "Accommodation Payments",
        "team-payments": "Team Payments"
      };

      if (segmentLabels[segment]) {
        label = segmentLabels[segment];
      } else if (segment.length > 10) {
        // Likely an ID, truncate it
        label = `${segment.substring(0, 8)}...`;
      } else {
        // Capitalize first letter
        label = segment.charAt(0).toUpperCase() + segment.slice(1);
      }

      items.push({ label, href: currentPath });
    });

    return items;
  }, [pathname, homeUrl, homeLabel]);

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className={`flex items-center space-x-1 text-sm text-muted-foreground ${className}`}>
      {breadcrumbs.map((item, index) => (
        <div key={item.href} className="flex items-center space-x-1">
          {index === 0 && <Home className="w-4 h-4" />}
          {index < breadcrumbs.length - 1 ? (
            <Link 
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
          {index < breadcrumbs.length - 1 && (
            <ChevronRight className="w-4 h-4" />
          )}
        </div>
      ))}
    </nav>
  );
}