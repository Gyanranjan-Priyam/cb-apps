import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AdminSettingsLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 container mx-auto max-w-4xl">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Tabs Skeleton */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-2">
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      {/* Settings Form Skeleton */}
      <Card className="border-border/70 p-6 space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-5 w-40" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border/40">
          <Skeleton className="h-5 w-44" />
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/60">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-5 w-10 rounded-full" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/60">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-5 w-10 rounded-full" />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border/40">
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </Card>
    </div>
  );
}
