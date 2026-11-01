"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  BookOpen,
  Video,
  FileText,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { MarkdownRenderer } from "./markdown-renderer";
import type { RoadmapGraphNode, RoadmapStatus } from "@/lib/roadmaps/types";

interface TopicDrawerProps {
  node: RoadmapGraphNode | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (nodeId: string, status: RoadmapStatus) => void;
}

export function TopicDrawer({
  node,
  isOpen,
  onClose,
  onStatusChange,
}: TopicDrawerProps) {
  if (!node) return null;

  const data = node.data;
  const status = data.status || "not-started";
  const isCompleted = status === "completed";
  const isInProgress = status === "in-progress";

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:w-[40vw] sm:max-w-[40vw] p-0 flex flex-col h-full max-h-screen overflow-hidden bg-card border-l z-50 shadow-2xl transition-all duration-300"
      >
        {/* ── Fixed Header ── */}
        <div className="shrink-0 p-6 border-b border-border/60 bg-background/95 backdrop-blur-sm space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline" className="text-xs uppercase font-mono tracking-wider">
              {data.category || "Topic Milestone"}
            </Badge>

            {data.difficulty && (
              <Badge
                variant="secondary"
                className={`text-[10px] uppercase font-bold ${
                  data.difficulty === "advanced"
                    ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                    : data.difficulty === "intermediate"
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                }`}
              >
                {data.difficulty}
              </Badge>
            )}
          </div>

          <SheetHeader className="p-0">
            <SheetTitle className="text-xl font-bold tracking-tight text-foreground">
              {data.label}
            </SheetTitle>
            {data.estimatedHours && (
              <SheetDescription className="text-xs flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                Estimated Learning Time: ~{data.estimatedHours} hours
              </SheetDescription>
            )}
          </SheetHeader>
        </div>

        {/* ── Scrollable Body with hidden scrollbar ── */}
        <div
          data-lenis-prevent
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 space-y-6 select-text [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          onWheel={(e) => e.stopPropagation()}
          onTouchMoveCapture={(e) => e.stopPropagation()}
        >
          {/* Status Actions Banner */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-3">
            <span className="text-xs font-bold text-foreground block">
              Your Learning Status
            </span>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={isCompleted ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  onStatusChange(node.id, isCompleted ? "not-started" : "completed")
                }
                className={`h-9 text-xs gap-1.5 font-semibold ${
                  isCompleted
                    ? "bg-zinc-700 hover:bg-zinc-800 dark:bg-zinc-600 dark:hover:bg-zinc-500 text-white shadow-xs"
                    : "border-border/80 hover:border-zinc-500/50 hover:text-foreground"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {isCompleted ? "Learned / Done" : "Mark as Learned"}
              </Button>

              <Button
                variant={isInProgress ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  onStatusChange(node.id, isInProgress ? "not-started" : "in-progress")
                }
                className={`h-9 text-xs gap-1.5 font-medium ${
                  isInProgress
                    ? "bg-amber-600 hover:bg-amber-500 text-white"
                    : "border-border/80 hover:border-amber-500/50 hover:text-amber-500"
                }`}
              >
                <Clock className="w-4 h-4" />
                {isInProgress ? "In Progress" : "Start Learning"}
              </Button>
            </div>

            {(isCompleted || isInProgress) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onStatusChange(node.id, "not-started")}
                className="w-full h-7 text-[11px] text-muted-foreground hover:text-foreground gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Progress
              </Button>
            )}
          </div>

          {/* Description / Article Content */}
          {data.description && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between pb-1 border-b border-border/40">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Overview & Key Concepts
                </h4>
              </div>
              <div className="prose prose-zinc dark:prose-invert max-w-none">
                <MarkdownRenderer content={data.description} />
              </div>
            </div>
          )}

          {/* Curated Resources */}
          {data.resources && data.resources.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                Recommended Learning Resources ({data.resources.length})
              </h4>

              <div className="space-y-2">
                {data.resources.map((res) => (
                  <a
                    key={res.id}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start justify-between gap-3 p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/50 hover:border-primary/40 transition-all group"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-background border border-border/70 mt-0.5 text-muted-foreground group-hover:text-primary shrink-0">
                        {res.type === "video" ? (
                          <Video className="w-3.5 h-3.5" />
                        ) : (
                          <FileText className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors block truncate">
                          {res.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {res.isOfficial ? "Official Documentation" : res.type.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 mt-1" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* CodeBreakers Community Tip */}
          <div className="p-4 rounded-2xl bg-linear-to-br from-primary/5 via-primary/10 to-transparent border border-primary/20 space-y-1.5">
            <div className="flex items-center gap-1.5 text-primary font-bold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>Practice & Earn Points</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Build a project or complete a club task related to <strong>{data.label}</strong> to earn CodeBreakers leaderboard points and level up!
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
