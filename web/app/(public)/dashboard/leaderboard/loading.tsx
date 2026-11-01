import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LeaderboardLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 container mx-auto">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-6 w-36 rounded-full" />
      </div>

      {/* Tabs Header Skeleton */}
      <div className="w-full space-y-6">
        <div className="grid w-full grid-cols-2 p-1 bg-muted rounded-lg h-10">
          <Skeleton className="h-8 rounded-md bg-background shadow-xs" />
          <Skeleton className="h-8 rounded-md bg-transparent" />
        </div>

        {/* Top Performers Card Skeleton */}
        <Card className="border-border/70 overflow-hidden">
          <CardHeader className="p-6 space-y-2 border-b border-border/60">
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-4 w-80" />
          </CardHeader>
          <CardContent className="p-0">
            {/* Table Header */}
            <div className="flex items-center justify-between p-4 bg-muted/40 border-b border-border/60 text-xs font-semibold">
              <div className="flex items-center gap-6">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="flex items-center gap-8 hidden sm:flex">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-border/40">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 gap-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-36" />
                        {i < 3 && <Skeleton className="h-4 w-10 rounded-full" />}
                      </div>
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>

                  <div className="flex items-center gap-8 hidden sm:flex">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-14" />
                  </div>

                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
