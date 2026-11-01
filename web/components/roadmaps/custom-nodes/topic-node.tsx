"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoadmapNodeData } from "@/lib/roadmaps/types";

// Palette mapping matching roadmap.sh color swatches
export const PALETTE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  A: { bg: "bg-[#18181b] text-white", border: "border-black dark:border-white", text: "text-white" },
  B: { bg: "bg-[#facc15] text-black", border: "border-black", text: "text-black" },
  C: { bg: "bg-[#fdba74] text-black", border: "border-black", text: "text-black" },
  D: { bg: "bg-[#86efac] text-black", border: "border-black", text: "text-black" },
  E: { bg: "bg-[#93c5fd] text-black", border: "border-black", text: "text-black" },
  F: { bg: "bg-[#c4b5fd] text-black", border: "border-black", text: "text-black" },
  G: { bg: "bg-[#f472b6] text-black", border: "border-black", text: "text-black" },
  H: { bg: "bg-[#e2e8f0] text-black", border: "border-black", text: "text-black" },
};

export const TopicNode = memo((props: NodeProps) => {
  const { data, selected } = props;
  const nodeData = data as unknown as RoadmapNodeData;
  const colorKey = (nodeData.colorKey || "B") as string;
  const palette = PALETTE_COLORS[colorKey] || PALETTE_COLORS.B;
  const fontSize = nodeData.fontSize || "M";
  const status = nodeData.status || "not-started";

  const fontClasses: Record<string, string> = {
    S: "text-[11px] py-1 px-3 min-w-[140px]",
    M: "text-xs py-2 px-4 min-w-[180px]",
    L: "text-sm py-2.5 px-5 min-w-[200px] font-bold",
    XL: "text-base py-3 px-6 min-w-[240px] font-bold",
    XXL: "text-lg py-3.5 px-7 min-w-[280px] font-extrabold",
  };

  const isCompleted = status === "completed";
  const isInProgress = status === "in-progress";

  return (
    <div
      className={cn(
        "relative rounded-md border-2 transition-all duration-150 cursor-pointer select-none font-bold text-center shadow-xs",
        fontClasses[fontSize] || fontClasses.M,
        palette.bg,
        palette.border,
        palette.text,
        isCompleted && [
          "!bg-[#cccccc] dark:!bg-[#3f3f46] !text-black dark:!text-white !border-black dark:!border-white",
          "shadow-none",
        ],
        isInProgress && "!bg-amber-400 !text-black !border-black animate-pulse",
        selected && "ring-2 ring-blue-500 ring-offset-2"
      )}
    >
      {/* Completed Purple Check Badge on Right Border */}
      {isCompleted && (
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4.5 h-4.5 rounded-full bg-[#8b5cf6] text-white flex items-center justify-center shadow-xs z-30 pointer-events-none">
          <Check className="w-2.5 h-2.5 text-white stroke-[3.5]" />
        </div>
      )}

      {/* 4 Handles for Multi-directional Child Connections */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2.5 !h-2.5 !bg-black dark:!bg-white !border-2 !border-white z-20"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2.5 !h-2.5 !bg-black dark:!bg-white !border-2 !border-white z-20"
      />

      <div className="flex items-center justify-center gap-1.5 relative z-10">
        {isInProgress && <Clock className="w-3.5 h-3.5 shrink-0 animate-spin" />}
        <span className={cn("truncate", isCompleted && "line-through decoration-black dark:decoration-white decoration-[1.5px]")}>
          {nodeData.label || "Topic"}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2.5 !h-2.5 !bg-black dark:!bg-white !border-2 !border-white z-20"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2.5 !h-2.5 !bg-black dark:!bg-white !border-2 !border-white z-20"
      />
    </div>
  );
});

TopicNode.displayName = "TopicNode";
