"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Link as LinkIcon, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoadmapNodeData, RoadmapResource } from "@/lib/roadmaps/types";

export const LinksNode = memo((props: NodeProps) => {
  const { data, selected } = props;
  const nodeData = data as unknown as RoadmapNodeData;
  const resources: RoadmapResource[] = nodeData.resources || [];

  return (
    <div
      className={cn(
        "relative rounded-xl border-2 border-border/80 bg-card/95 backdrop-blur-md p-3 shadow-md min-w-[200px] max-w-[260px] select-none space-y-2",
        selected && "ring-2 ring-primary ring-offset-2"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2.5 !h-2.5 !bg-muted-foreground !border-2 !border-background"
      />

      <div className="flex items-center gap-1.5 pb-1.5 border-b border-border/60 text-muted-foreground">
        <LinkIcon className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-bold text-foreground truncate">
          {nodeData.label || "Curated Links"}
        </span>
      </div>

      <div className="space-y-1">
        {resources.length === 0 ? (
          <span className="text-[11px] text-muted-foreground italic block">No links attached</span>
        ) : (
          resources.map((res) => (
            <a
              key={res.id}
              href={res.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-between gap-1.5 p-1.5 rounded-md bg-muted/40 hover:bg-primary/10 hover:text-primary transition-colors text-[11px] font-medium text-foreground group"
            >
              <span className="truncate">{res.title}</span>
              <ExternalLink className="w-3 h-3 shrink-0 opacity-60 group-hover:opacity-100" />
            </a>
          ))
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2.5 !h-2.5 !bg-muted-foreground !border-2 !border-background"
      />
    </div>
  );
});

LinksNode.displayName = "LinksNode";
