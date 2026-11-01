"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoadmapNodeData } from "@/lib/roadmaps/types";
import { PALETTE_COLORS } from "./topic-node";

export const SubtopicNode = memo((props: NodeProps) => {
  const { data, selected } = props;
  const nodeData = data as unknown as RoadmapNodeData;
  const colorKey = (nodeData.colorKey || "C") as string;
  const palette = PALETTE_COLORS[colorKey] || PALETTE_COLORS.C;
  const fontSize = nodeData.fontSize || "S";
  const status = nodeData.status || "not-started";

  const fontClasses: Record<string, string> = {
    S: "text-[11px] py-1.5 px-3 min-w-[150px]",
    M: "text-xs py-2 px-3.5 min-w-[180px]",
    L: "text-sm py-2.5 px-4 min-w-[210px] font-semibold",
    XL: "text-base py-3 px-5 min-w-[240px] font-bold",
    XXL: "text-lg py-3.5 px-6 min-w-[270px] font-extrabold",
  };

  const isCompleted = status === "completed";
  const isInProgress = status === "in-progress";

  return (
    <div
      className={cn(
        "relative rounded-md border-2 transition-all duration-150 cursor-pointer select-none font-medium text-center shadow-2xs",
        fontClasses[fontSize] || fontClasses.S,
        palette.bg,
        palette.border,
        palette.text,
        isCompleted && [
          "!bg-[#cccccc] dark:!bg-[#3f3f46] !text-black dark:!text-white !border-black dark:!border-white",
          "shadow-none",
        ],
        isInProgress && "!bg-amber-300 !text-black !border-black animate-pulse",
        selected && "ring-2 ring-blue-500 ring-offset-2"
      )}
    >
      {/* Completed Purple Check Badge on Right Border */}
      {isCompleted && (
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#8b5cf6] text-white flex items-center justify-center shadow-xs z-30 pointer-events-none">
          <Check className="w-2.5 h-2.5 text-white stroke-[3.5]" />
        </div>
      )}

      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2 !h-2 !bg-black dark:!bg-white !border !border-white z-20"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2 !h-2 !bg-black dark:!bg-white !border !border-white z-20"
      />

      <div className="flex items-center justify-center gap-1 relative z-10">
        {isInProgress && <Clock className="w-3 h-3 shrink-0 animate-spin text-amber-900" />}
        <span className={cn("truncate", isCompleted && "line-through decoration-black dark:decoration-white decoration-[1.5px]")}>
          {nodeData.label || "Subtopic"}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2 !h-2 !bg-black dark:!bg-white !border !border-white z-20"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2 !h-2 !bg-black dark:!bg-white !border !border-white z-20"
      />
    </div>
  );
});

SubtopicNode.displayName = "SubtopicNode";
