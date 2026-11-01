"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { RoadmapNodeData } from "@/lib/roadmaps/types";

export const ButtonNode = memo((props: NodeProps) => {
  const { data, selected } = props;
  const nodeData = data as unknown as RoadmapNodeData;
  const router = useRouter();

  const targetSlug = nodeData.targetRoadmapSlug || "";
  const targetUrl =
    targetSlug ? `/dashboard/roadmaps/${targetSlug}` : nodeData.url || (nodeData.resources && nodeData.resources[0]?.url) || "";

  const handleClick = (e: React.MouseEvent) => {
    if (typeof window !== "undefined" && window.location.pathname.includes("/admin/")) {
      // In admin editor, clicking selects the node for property editing
      return;
    }

    if (targetUrl) {
      e.stopPropagation();
      if (targetUrl.startsWith("/") || targetUrl.includes("/dashboard/roadmaps/")) {
        router.push(targetUrl);
      } else {
        window.open(targetUrl, "_blank", "noopener,noreferrer");
      }
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group relative px-4 py-2 rounded-md border-2 transition-all duration-150 select-none",
        "bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-xs sm:text-sm flex items-center justify-center text-center",
        "shadow-xs hover:shadow-md active:scale-98 cursor-pointer min-w-[150px] max-w-[280px]",
        "border-[#1d4ed8] dark:border-blue-400",
        selected && "ring-2 ring-blue-400 ring-offset-2 ring-offset-background"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2.5 !h-2.5 !bg-white !border-2 !border-[#1d4ed8] z-20"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2.5 !h-2.5 !bg-white !border-2 !border-[#1d4ed8] z-20"
      />

      <span className="truncate leading-snug">{nodeData.label || "Roadmap Link"}</span>

      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2.5 !h-2.5 !bg-white !border-2 !border-[#1d4ed8] z-20"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2.5 !h-2.5 !bg-white !border-2 !border-[#1d4ed8] z-20"
      />
    </div>
  );
});

ButtonNode.displayName = "ButtonNode";
