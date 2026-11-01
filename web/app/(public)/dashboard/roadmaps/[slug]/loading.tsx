import { Skeleton } from "@/components/ui/skeleton";

export default function SingleRoadmapLoading() {
  return (
    <div className="w-full h-[calc(100vh-var(--header-height,3.5rem))] relative overflow-hidden flex flex-col bg-background">
      {/* Top Floating Canvas Controls Bar */}
      <div className="h-12 border-b border-border/70 bg-card/90 backdrop-blur-md px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>

      {/* Interactive Canvas Grid Skeleton */}
      <div className="flex-1 w-full relative flex items-center justify-center p-8 overflow-hidden bg-muted/10">
        {/* Animated Background Flowchart Spine Structure */}
        <div className="flex flex-col items-center space-y-12 max-w-lg w-full">
          {/* Root Title Node */}
          <Skeleton className="h-12 w-64 rounded-xl ring-2 ring-primary/20 shadow-md" />

          {/* Spine Connecting Line */}
          <div className="w-0.5 h-10 bg-border/60 animate-pulse" />

          {/* Main Topic 1 with Left/Right Subtopics */}
          <div className="relative flex items-center justify-center w-full">
            <Skeleton className="h-10 w-40 rounded-lg absolute -left-4 hidden sm:block" />
            <Skeleton className="h-14 w-52 rounded-xl shadow-lg ring-2 ring-blue-500/30" />
            <Skeleton className="h-10 w-40 rounded-lg absolute -right-4 hidden sm:block" />
          </div>

          <div className="w-0.5 h-10 bg-border/60 animate-pulse" />

          {/* Main Topic 2 */}
          <div className="relative flex items-center justify-center w-full">
            <Skeleton className="h-10 w-40 rounded-lg absolute -left-4 hidden sm:block" />
            <Skeleton className="h-14 w-52 rounded-xl shadow-lg ring-2 ring-emerald-500/30" />
          </div>

          <div className="w-0.5 h-10 bg-border/60 animate-pulse" />

          {/* Main Topic 3 */}
          <Skeleton className="h-14 w-52 rounded-xl shadow-lg" />
        </div>

        {/* Bottom Left Controls Skeleton */}
        <div className="absolute left-4 bottom-4 flex flex-col gap-1 p-1 bg-card/90 rounded-xl border border-border/70 shadow-md">
          <Skeleton className="w-7 h-7 rounded-md" />
          <Skeleton className="w-7 h-7 rounded-md" />
          <Skeleton className="w-7 h-7 rounded-md" />
        </div>

        {/* Bottom Right Minimap Skeleton */}
        <div className="absolute right-4 bottom-4 hidden sm:block">
          <Skeleton className="w-36 h-28 rounded-xl border border-border/70 shadow-md" />
        </div>
      </div>
    </div>
  );
}
