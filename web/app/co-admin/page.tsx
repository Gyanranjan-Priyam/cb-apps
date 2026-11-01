import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardStats } from "@/app/data/admin/dashboard";
import { DashboardStats } from "@/components/admin_components/dashboard/DashboardStats";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Co-Admin Portal | CodeBreakers",
  description: "CodeBreakers Co-Admin Console - Manage tasks, attendance, quiz systems, roadmaps, and students",
};

function CoAdminStatsLoading() {
  return (
    <div className="space-y-8 animate-pulse">
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

async function DashboardStatsSection() {
  const stats = await getDashboardStats();
  return <DashboardStats stats={stats} />;
}

export default function CoAdminDashboardPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-8xl mx-auto w-full space-y-8">
      <div className="flex items-center justify-between pb-2 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Co-Admin Console</h1>
          <p className="text-muted-foreground text-sm">
            Operational dashboard for tasks, attendance, quiz systems, roadmaps, and student assignment.
          </p>
        </div>
      </div>

      <Suspense fallback={<CoAdminStatsLoading />}>
        <DashboardStatsSection />
      </Suspense>
    </div>
  );
}
