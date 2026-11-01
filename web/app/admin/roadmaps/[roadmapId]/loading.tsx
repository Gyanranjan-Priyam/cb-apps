import { Skeleton } from "@/components/ui/skeleton";

export default function AdminRoadmapStudioLoading() {
  return (
    <div className="w-full h-[calc(100vh-var(--header-height,3.5rem))] relative overflow-hidden flex flex-col bg-background select-none">
      {/* Top Navbar Skeleton */}
      <div className="h-12 border-b border-border/70 bg-card/95 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="h-6 w-56 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
      </div>

      {/* Main Studio Area: Left Palette + Canvas + Right Inspector Space */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Palette Drawer Skeleton */}
        <div className="w-52 border-r border-border/70 bg-card/90 flex flex-col shrink-0 p-3 space-y-3 z-20">
          <Skeleton className="h-4 w-32" />
          <div className="space-y-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-lg" />
            ))}
          </div>
        </div>

        {/* Central Canvas Flowchart Skeleton */}
        <div className="flex-1 h-full relative flex items-center justify-center p-8 bg-muted/10">
          <div className="flex flex-col items-center space-y-10 max-w-md w-full">
            <Skeleton className="h-12 w-60 rounded-xl ring-2 ring-primary/20 shadow-md" />
            <div className="w-0.5 h-8 bg-border/60 animate-pulse" />
            <div className="relative flex items-center justify-center w-full">
              <Skeleton className="h-10 w-36 rounded-lg absolute -left-8 hidden md:block" />
              <Skeleton className="h-14 w-48 rounded-xl shadow-lg ring-2 ring-blue-500/20" />
              <Skeleton className="h-10 w-36 rounded-lg absolute -right-8 hidden md:block" />
            </div>
            <div className="w-0.5 h-8 bg-border/60 animate-pulse" />
            <Skeleton className="h-14 w-48 rounded-xl shadow-lg" />
          </div>

          {/* Canvas Controls Skeleton */}
          <div className="absolute left-4 bottom-4 flex flex-col gap-1 p-1 bg-card/90 rounded-xl border border-border/70">
            <Skeleton className="w-7 h-7 rounded-md" />
            <Skeleton className="w-7 h-7 rounded-md" />
            <Skeleton className="w-7 h-7 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
