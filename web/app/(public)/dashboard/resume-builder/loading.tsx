import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ResumeBuilderLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 container mx-auto">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-60" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      {/* Main Resume Workspace Skeleton (Sidebar + Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form / Editor Section */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-border/70 p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-full rounded-md" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-full rounded-md" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-20 w-full rounded-md" />
            </div>
          </Card>

          <Card className="border-border/70 p-4 space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </Card>
        </div>

        {/* Right Resume Canvas Preview */}
        <div className="lg:col-span-7">
          <Card className="border-border/70 p-8 min-h-[600px] flex flex-col justify-between shadow-lg bg-card/60">
            <div className="space-y-6">
              {/* Resume Header */}
              <div className="space-y-2 text-center flex flex-col items-center">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-3 w-80" />
              </div>

              {/* Resume Sections */}
              <div className="space-y-4 pt-4 border-t border-border/60">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>

              <div className="space-y-4 pt-4 border-t border-border/60">
                <Skeleton className="h-5 w-32" />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
