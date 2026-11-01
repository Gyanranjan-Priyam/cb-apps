import { Metadata } from "next";
import { getPublishedRoadmaps } from "./actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Compass,
  Sparkles,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { RoadmapsView } from "./_components/roadmaps-view";

export const metadata: Metadata = {
  title: "Developer Roadmaps | CodeBreakers",
  description: "Step-by-step interactive learning roadmaps for frontend, backend, DevOps, AI, and systems engineering.",
};

export const dynamic = "force-dynamic";

export default async function RoadmapsPage() {
  const result = await getPublishedRoadmaps();
  const roadmaps = result.status === "success" ? result.data : [];

  // Summary Metrics
  const totalRoadmaps = roadmaps.length;
  const completedRoadmapsCount = roadmaps.filter((r) => r.userProgress?.percentage === 100).length;
  const totalCompletedTopics = roadmaps.reduce(
    (acc, curr) => acc + (curr.userProgress?.completedNodeIds?.length || 0),
    0
  );

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-8xl mx-auto w-full">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs gap-1.5 bg-primary/5 text-primary border-primary/20">
              <Compass className="w-3.5 h-3.5" />
              <span>Interactive Learning Paths</span>
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Developer Roadmaps
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Interactive node-graph curricula with guided milestones, video resources, and progress tracking.
          </p>
        </div>
      </div>

      {/* ── Stats Summary Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="border-border/60 bg-linear-to-br from-card to-muted/20">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-medium">Available Tracks</span>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-0.5">{totalRoadmaps}</h3>
            </div>
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <Layers className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-linear-to-br from-card to-muted/20">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-medium">Topics Mastered</span>
              <h3 className="text-xl sm:text-2xl font-bold text-emerald-500 mt-0.5">{totalCompletedTopics}</h3>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-linear-to-br from-card to-muted/20">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-medium">Completed Tracks</span>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-0.5">{completedRoadmapsCount}</h3>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
              <Sparkles className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Roadmaps Explorer (Grid & List View, Search & Filtering) ── */}
      <RoadmapsView roadmaps={roadmaps} />
    </div>
  );
}

