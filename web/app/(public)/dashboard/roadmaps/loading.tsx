import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function RoadmapsLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-8xl mx-auto w-full animate-in fade-in-50 duration-300">
      {/* ── Page Header Skeleton ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div className="space-y-2">
          <Skeleton className="h-5 w-44 rounded-full" />
          <Skeleton className="h-8 sm:h-9 w-64 sm:w-80 rounded-xl" />
          <Skeleton className="h-4 w-full max-w-lg rounded-lg" />
        </div>
      </div>

      {/* ── Stats Summary Grid Skeleton ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="border-border/60 bg-linear-to-br from-card to-muted/20">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-24 rounded-md" />
                <Skeleton className="h-7 w-16 rounded-lg" />
              </div>
              <Skeleton className="w-11 h-11 rounded-2xl" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Toolbar Skeleton (Search, 2 Dropdowns, Grid/List switcher) ── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card/60 p-3 sm:p-4 rounded-2xl border border-border/60">
        <Skeleton className="h-9.5 flex-1 min-w-[200px] rounded-xl" />
        <div className="flex items-center gap-2.5 flex-wrap justify-between lg:justify-end">
          <Skeleton className="h-9.5 flex-1 sm:flex-initial min-w-[140px] sm:w-[170px] rounded-xl" />
          <Skeleton className="h-9.5 flex-1 sm:flex-initial min-w-[140px] sm:w-[160px] rounded-xl" />
          <Skeleton className="h-9.5 w-28 rounded-xl shrink-0" />
        </div>
      </div>

      {/* ── Results Header Skeleton ── */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>

      {/* ── Roadmaps Cards Grid Skeleton ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card
            key={i}
            className="border-border/60 bg-card/80 flex flex-col justify-between overflow-hidden rounded-2xl shadow-xs"
          >
            <div className="p-5 pb-3 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <Skeleton className="w-12 h-12 rounded-2xl" />
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <Skeleton className="h-5 w-3/4 rounded-md" />
                <Skeleton className="h-3.5 w-full rounded-md" />
                <Skeleton className="h-3.5 w-5/6 rounded-md" />
              </div>
            </div>

            <div className="p-5 pt-0 space-y-3.5">
              <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/40">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-24 rounded-md" />
                  <Skeleton className="h-3.5 w-8 rounded-md" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
                <div className="flex items-center justify-between pt-0.5">
                  <Skeleton className="h-3 w-28 rounded-md" />
                  <Skeleton className="h-3 w-12 rounded-md" />
                </div>
              </div>

              <Skeleton className="h-9 w-full rounded-xl" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
