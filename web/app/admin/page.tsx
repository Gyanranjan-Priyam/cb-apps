import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getDashboardStats } from "@/app/data/admin/dashboard";
import { DashboardStats } from "@/components/admin_components/dashboard/DashboardStats";
import { 
    LayoutDashboard,
    Plus,
    Compass,
    FileText,
    QrCode,
    BrainCircuit,
    Sparkles,
    Shield,
    Terminal
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard | CodeBreakers",
  description: "CodeBreakers central administrative command center - Manage roadmaps, forms, members, attendance, and activities",
};

// Fast-action navigation buttons
const primaryShortcuts = [
  {
    label: "New Roadmap",
    icon: Compass,
    href: "/admin/roadmaps",
    variant: "default" as const,
  },
  {
    label: "Build Form",
    icon: FileText,
    href: "/admin/forms/new",
    variant: "outline" as const,
  },
  {
    label: "QR Attendance",
    icon: QrCode,
    href: "/admin/attendance",
    variant: "outline" as const,
  },
  {
    label: "Create Quiz",
    icon: BrainCircuit,
    href: "/admin/quizzes/create",
    variant: "outline" as const,
  },
];

// Geometric Loading Fallback
function AdminStatsLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* KPI Matrix Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl border border-border/60 bg-card space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>

      {/* Pillars Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-4 w-36" />
            <div className="space-y-2.5">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Data fetching component
async function DashboardStatsSection() {
  const stats = await getDashboardStats();
  return <DashboardStats stats={stats} />;
}

export default function AdminPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-8xl mx-auto w-full space-y-8">

      {/* ── Main Dashboard Modular Analytics & Module Hub ── */}
      <Suspense fallback={<AdminStatsLoading />}>
        <DashboardStatsSection />
      </Suspense>
    </div>
  );
}
