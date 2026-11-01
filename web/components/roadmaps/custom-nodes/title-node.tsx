"use client";

import { memo } from "react";
import { NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { RoadmapNodeData } from "@/lib/roadmaps/types";

export const TitleNode = memo((props: NodeProps) => {
  const { data, selected } = props;
  const nodeData = data as unknown as RoadmapNodeData;
  const fontSize = nodeData.fontSize || "XL";

  const fontClasses: Record<string, string> = {
    S: "text-sm font-bold",
    M: "text-base font-extrabold",
    L: "text-lg font-extrabold tracking-tight",
    XL: "text-xl sm:text-2xl font-black tracking-tight",
    XXL: "text-3xl sm:text-4xl font-black tracking-tight",
  };

  return (
    <div
      className={cn(
        "p-2 select-none text-foreground text-center font-black cursor-pointer",
        fontClasses[fontSize] || fontClasses.XL,
        selected && "outline-dashed outline-2 outline-primary rounded-md"
      )}
    >
      <h2>{nodeData.label || "Title (Learning Path)"}</h2>
    </div>
  );
});

TitleNode.displayName = "TitleNode";
