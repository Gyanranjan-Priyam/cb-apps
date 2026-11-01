"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Check, Clock, Flame, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoadmapNodeData, NodePriority, NodeColorTheme } from "@/lib/roadmaps/types";

// ── Vibrant Color Presets & Gradient Glows for Light & Dark Mode ──
export const VIBRANT_COLOR_THEMES: Record<
  NodeColorTheme,
  {
    border: string;
    bg: string;
    glow: string;
    text: string;
    accentBg: string;
    dot: string;
    name: string;
  }
> = {
  default: {
    border: "border-border/80 group-hover:border-primary/60",
    bg: "bg-card/90 backdrop-blur-md",
    glow: "shadow-xs group-hover:shadow-md",
    text: "text-foreground font-bold",
    accentBg: "bg-muted/70 text-foreground",
    dot: "bg-muted-foreground",
    name: "Default Card",
  },
  gold: {
    border: "border-amber-500/70 dark:border-amber-400/80 group-hover:border-amber-500",
    bg: "bg-linear-to-r from-amber-500/15 via-amber-500/10 to-card dark:from-amber-500/20 dark:via-amber-500/10 dark:to-card/90 backdrop-blur-md",
    glow: "shadow-[0_0_18px_rgba(245,158,11,0.22)] group-hover:shadow-[0_0_24px_rgba(245,158,11,0.35)]",
    text: "text-amber-950 dark:text-amber-200 font-bold",
    accentBg: "bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/40",
    dot: "bg-amber-500 dark:bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]",
    name: "Gold Cyber",
  },
  emerald: {
    border: "border-emerald-500/70 dark:border-emerald-400/80 group-hover:border-emerald-500",
    bg: "bg-linear-to-r from-emerald-500/15 via-emerald-500/10 to-card dark:from-emerald-500/20 dark:via-emerald-500/10 dark:to-card/90 backdrop-blur-md",
    glow: "shadow-[0_0_18px_rgba(16,185,129,0.22)] group-hover:shadow-[0_0_24px_rgba(16,185,129,0.35)]",
    text: "text-emerald-950 dark:text-emerald-200 font-bold",
    accentBg: "bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 border border-emerald-500/40",
    dot: "bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]",
    name: "Neon Emerald",
  },
  blue: {
    border: "border-blue-500/70 dark:border-blue-400/80 group-hover:border-blue-500",
    bg: "bg-linear-to-r from-blue-500/15 via-blue-500/10 to-card dark:from-blue-500/20 dark:via-blue-500/10 dark:to-card/90 backdrop-blur-md",
    glow: "shadow-[0_0_18px_rgba(59,130,246,0.22)] group-hover:shadow-[0_0_24px_rgba(59,130,246,0.35)]",
    text: "text-blue-950 dark:text-blue-200 font-bold",
    accentBg: "bg-blue-500/20 text-blue-900 dark:text-blue-300 border border-blue-500/40",
    dot: "bg-blue-500 dark:bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]",
    name: "Electric Blue",
  },
  purple: {
    border: "border-purple-500/70 dark:border-purple-400/80 group-hover:border-purple-500",
    bg: "bg-linear-to-r from-purple-500/15 via-purple-500/10 to-card dark:from-purple-600/25 dark:via-purple-500/10 dark:to-card/90 backdrop-blur-md",
    glow: "shadow-[0_0_18px_rgba(168,85,247,0.25)] group-hover:shadow-[0_0_24px_rgba(168,85,247,0.4)]",
    text: "text-purple-950 dark:text-purple-200 font-bold",
    accentBg: "bg-purple-500/20 text-purple-900 dark:text-purple-300 border border-purple-500/40",
    dot: "bg-purple-500 dark:bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]",
    name: "Royal Purple",
  },
  rose: {
    border: "border-rose-500/70 dark:border-rose-400/80 group-hover:border-rose-500",
    bg: "bg-linear-to-r from-rose-500/15 via-rose-500/10 to-card dark:from-rose-500/20 dark:via-rose-500/10 dark:to-card/90 backdrop-blur-md",
    glow: "shadow-[0_0_18px_rgba(244,63,94,0.22)] group-hover:shadow-[0_0_24px_rgba(244,63,94,0.35)]",
    text: "text-rose-950 dark:text-rose-200 font-bold",
    accentBg: "bg-rose-500/20 text-rose-900 dark:text-rose-300 border border-rose-500/40",
    dot: "bg-rose-500 dark:bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]",
    name: "Vibrant Rose",
  },
  cyan: {
    border: "border-cyan-500/70 dark:border-cyan-400/80 group-hover:border-cyan-500",
    bg: "bg-linear-to-r from-cyan-500/15 via-cyan-500/10 to-card dark:from-cyan-500/20 dark:via-cyan-500/10 dark:to-card/90 backdrop-blur-md",
    glow: "shadow-[0_0_18px_rgba(6,182,212,0.22)] group-hover:shadow-[0_0_24px_rgba(6,182,212,0.35)]",
    text: "text-cyan-950 dark:text-cyan-200 font-bold",
    accentBg: "bg-cyan-500/20 text-cyan-900 dark:text-cyan-300 border border-cyan-500/40",
    dot: "bg-cyan-500 dark:bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]",
    name: "Aqua Cyan",
  },
  orange: {
    border: "border-orange-500/70 dark:border-orange-400/80 group-hover:border-orange-500",
    bg: "bg-linear-to-r from-orange-500/15 via-orange-500/10 to-card dark:from-orange-500/20 dark:via-orange-500/10 dark:to-card/90 backdrop-blur-md",
    glow: "shadow-[0_0_18px_rgba(249,115,22,0.22)] group-hover:shadow-[0_0_24px_rgba(249,115,22,0.35)]",
    text: "text-orange-950 dark:text-orange-200 font-bold",
    accentBg: "bg-orange-500/20 text-orange-900 dark:text-orange-300 border border-orange-500/40",
    dot: "bg-orange-500 dark:bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.8)]",
    name: "Sunset Orange",
  },
  lime: {
    border: "border-lime-500/70 dark:border-lime-400/80 group-hover:border-lime-500",
    bg: "bg-linear-to-r from-lime-500/15 via-lime-500/10 to-card dark:from-lime-500/20 dark:via-lime-500/10 dark:to-card/90 backdrop-blur-md",
    glow: "shadow-[0_0_18px_rgba(132,204,22,0.22)] group-hover:shadow-[0_0_24px_rgba(132,204,22,0.35)]",
    text: "text-lime-950 dark:text-lime-200 font-bold",
    accentBg: "bg-lime-500/20 text-lime-900 dark:text-lime-300 border border-lime-500/40",
    dot: "bg-lime-500 dark:bg-lime-400 shadow-[0_0_8px_rgba(132,204,22,0.8)]",
    name: "Neon Lime",
  },
  indigo: {
    border: "border-indigo-500/70 dark:border-indigo-400/80 group-hover:border-indigo-500",
    bg: "bg-linear-to-r from-indigo-500/15 via-indigo-500/10 to-card dark:from-indigo-600/25 dark:via-indigo-500/10 dark:to-card/90 backdrop-blur-md",
    glow: "shadow-[0_0_18px_rgba(99,102,241,0.22)] group-hover:shadow-[0_0_24px_rgba(99,102,241,0.35)]",
    text: "text-indigo-950 dark:text-indigo-200 font-bold",
    accentBg: "bg-indigo-500/20 text-indigo-900 dark:text-indigo-300 border border-indigo-500/40",
    dot: "bg-indigo-500 dark:bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]",
    name: "Galaxy Indigo",
  },
  crimson: {
    border: "border-red-500/70 dark:border-red-400/80 group-hover:border-red-500",
    bg: "bg-linear-to-r from-red-500/15 via-red-500/10 to-card dark:from-red-600/25 dark:via-red-500/10 dark:to-card/90 backdrop-blur-md",
    glow: "shadow-[0_0_18px_rgba(239,68,68,0.25)] group-hover:shadow-[0_0_24px_rgba(239,68,68,0.4)]",
    text: "text-red-950 dark:text-red-200 font-bold",
    accentBg: "bg-red-500/20 text-red-900 dark:text-red-300 border border-red-500/40",
    dot: "bg-red-500 dark:bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]",
    name: "Crimson Red",
  },
  teal: {
    border: "border-teal-500/70 dark:border-teal-400/80 group-hover:border-teal-500",
    bg: "bg-linear-to-r from-teal-500/15 via-teal-500/10 to-card dark:from-teal-500/20 dark:via-teal-500/10 dark:to-card/90 backdrop-blur-md",
    glow: "shadow-[0_0_18px_rgba(20,184,166,0.22)] group-hover:shadow-[0_0_24px_rgba(20,184,166,0.35)]",
    text: "text-teal-950 dark:text-teal-200 font-bold",
    accentBg: "bg-teal-500/20 text-teal-900 dark:text-teal-300 border border-teal-500/40",
    dot: "bg-teal-500 dark:bg-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.8)]",
    name: "Deep Teal",
  },
  fuchsia: {
    border: "border-fuchsia-500/70 dark:border-fuchsia-400/80 group-hover:border-fuchsia-500",
    bg: "bg-linear-to-r from-fuchsia-500/15 via-fuchsia-500/10 to-card dark:from-fuchsia-500/20 dark:via-fuchsia-500/10 dark:to-card/90 backdrop-blur-md",
    glow: "shadow-[0_0_18px_rgba(217,70,239,0.22)] group-hover:shadow-[0_0_24px_rgba(217,70,239,0.35)]",
    text: "text-fuchsia-950 dark:text-fuchsia-200 font-bold",
    accentBg: "bg-fuchsia-500/20 text-fuchsia-900 dark:text-fuchsia-300 border border-fuchsia-500/40",
    dot: "bg-fuchsia-500 dark:bg-fuchsia-400 shadow-[0_0_8px_rgba(217,70,239,0.8)]",
    name: "Cyber Fuchsia",
  },
};

// Priority styling fallback
const PRIORITY_FALLBACK: Record<NodePriority, NodeColorTheme> = {
  critical: "gold",
  important: "purple",
  normal: "blue",
  optional: "default",
};

export const MilestoneNode = memo((props: NodeProps) => {
  const { data, selected } = props;
  const nodeData = data as unknown as RoadmapNodeData;
  const status = nodeData.status || "not-started";
  const priority = nodeData.priority || "normal";
  
  // Color resolution: Custom color > Priority mapping
  const colorTheme = (nodeData.color && nodeData.color !== "default") 
    ? nodeData.color 
    : PRIORITY_FALLBACK[priority];

  const isCompleted = status === "completed";
  const isInProgress = status === "in-progress";

  const theme = VIBRANT_COLOR_THEMES[colorTheme] || VIBRANT_COLOR_THEMES.default;

  return (
    <div
      className={cn(
        "group relative px-4 py-2.5 rounded-2xl border-2 transition-all duration-200 cursor-pointer select-none",
        "min-w-[190px] max-w-[250px] flex items-center justify-between gap-3",
        "transform hover:-translate-y-0.5 active:translate-y-0",
        theme.border,
        theme.bg,
        theme.glow,
        isCompleted && [
          "!border-black dark:!border-white !bg-[#cccccc] dark:!bg-[#3f3f46] shadow-none",
        ],
        isInProgress && "!border-amber-500 !bg-amber-500/15 dark:!bg-amber-500/20 shadow-[0_0_24px_rgba(245,158,11,0.3)] animate-pulse",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
    >
      {/* Completed Purple Check Badge on Right Border */}
      {isCompleted && (
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4.5 h-4.5 rounded-full bg-[#8b5cf6] text-white flex items-center justify-center shadow-xs z-30 pointer-events-none">
          <Check className="w-2.5 h-2.5 text-white stroke-[3.5]" />
        </div>
      )}

      {/* Top Center Handle (Primary Target) */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background transition-transform group-hover:scale-125 group-hover:!bg-primary z-20"
      />

      {/* Left Icon Pill (when not completed) */}
      {!isCompleted && (
        <div className="shrink-0 flex items-center relative z-10">
          {isInProgress ? (
            <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500 flex items-center justify-center animate-spin">
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300" />
            </div>
          ) : priority === "critical" ? (
            <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/60 flex items-center justify-center">
              <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>
          ) : priority === "important" ? (
            <div className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/60 flex items-center justify-center">
              <Star className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            </div>
          ) : (
            <span className={cn("w-2.5 h-2.5 rounded-full", theme.dot)} />
          )}
        </div>
      )}

      {/* ONLY Heading / Title on Canvas (High-Contrast Light & Dark Mode) */}
      <span className={cn(
        "flex-1 text-xs sm:text-sm tracking-tight text-center line-clamp-2 leading-snug font-bold relative z-10",
        isCompleted
          ? "text-black dark:text-white line-through decoration-black dark:decoration-white decoration-[1.5px]"
          : isInProgress
          ? "text-amber-950 dark:text-amber-200"
          : theme.text
      )}>
        {nodeData.label}
      </span>

      {/* Bottom Center Handle (Primary Source) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background transition-transform group-hover:scale-125 group-hover:!bg-primary z-20"
      />

      {/* Side Handles for Lateral Branching */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2 !h-2 !bg-muted-foreground !border-2 !border-background transition-transform group-hover:scale-125 z-20"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2 !h-2 !bg-muted-foreground !border-2 !border-background transition-transform group-hover:scale-125"
      />
    </div>
  );
});

MilestoneNode.displayName = "MilestoneNode";
