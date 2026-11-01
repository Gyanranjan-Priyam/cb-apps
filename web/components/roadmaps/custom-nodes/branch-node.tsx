"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Check, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoadmapNodeData } from "@/lib/roadmaps/types";

export const BranchNode = memo((props: NodeProps) => {
  const { data, selected } = props;
  const nodeData = data as unknown as RoadmapNodeData;
  const isCompleted = nodeData.status === "completed";

  return (
    <div
      className={cn(
        "group relative px-3 py-2 rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer shadow-xs select-none",
        "min-w-[150px] max-w-[200px] flex items-center justify-between gap-2",
        "bg-card/80 backdrop-blur-sm text-foreground",
        isCompleted
          ? [
              "!border-black dark:!border-white !bg-[#cccccc] dark:!bg-[#3f3f46] text-black dark:text-white shadow-none",
            ]
          : "border-border/80 hover:border-primary/50 text-foreground",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
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
        className="!w-2.5 !h-2.5 !bg-muted-foreground !border-2 !border-background z-20"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2.5 !h-2.5 !bg-muted-foreground !border-2 !border-background z-20"
      />

      {!isCompleted && (
        <div className="shrink-0 flex items-center relative z-10">
          <GitBranch className="w-3 h-3 text-muted-foreground shrink-0" />
        </div>
      )}

      <span className={cn(
        "flex-1 text-xs font-bold text-center line-clamp-1 leading-snug relative z-10",
        isCompleted && "line-through decoration-black dark:decoration-white decoration-[1.5px]"
      )}>
        {nodeData.label}
      </span>

      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2.5 !h-2.5 !bg-muted-foreground !border-2 !border-background z-20"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2.5 !h-2.5 !bg-muted-foreground !border-2 !border-background z-20"
      />
    </div>
  );
});

BranchNode.displayName = "BranchNode";
