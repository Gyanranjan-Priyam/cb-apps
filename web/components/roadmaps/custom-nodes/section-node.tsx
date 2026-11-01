"use client";

import { memo } from "react";
import { NodeProps, NodeResizer } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { RoadmapNodeData } from "@/lib/roadmaps/types";
import { Layers } from "lucide-react";

export const SectionNode = memo((props: NodeProps) => {
  const { data, selected } = props;
  const nodeData = data as unknown as RoadmapNodeData;

  return (
    <div
      className={cn(
        "relative rounded-2xl border-2 border-dashed border-border/80 bg-muted/20 backdrop-blur-xs transition-colors p-4 w-full h-full min-w-[240px] min-h-[160px] select-none z-0",
        selected && "border-primary/80 ring-2 ring-primary/20"
      )}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={200}
        minHeight={130}
        handleClassName="!w-2.5 !h-2.5 !bg-primary !border-2 !border-background !rounded-sm"
        lineClassName="!border-primary"
      />

      {/* Section Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/40 text-muted-foreground pointer-events-none">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">
            {nodeData.label || "Section Container"}
          </span>
        </div>
      </div>

      {nodeData.description && (
        <p className="text-[11px] text-muted-foreground mt-2 italic pointer-events-none">
          {nodeData.description}
        </p>
      )}
    </div>
  );
});

SectionNode.displayName = "SectionNode";
