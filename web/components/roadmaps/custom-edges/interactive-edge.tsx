"use client";

import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  Position,
  type EdgeProps,
  useReactFlow,
} from "@xyflow/react";
import { Trash2 } from "lucide-react";

/**
 * Adaptive Dynamic Physics Path
 * - Draws a pure straight line when nodes are vertically or horizontally aligned (e.g. Center Spine).
 * - Draws an organic smooth curve for side-branching subtopics scaled dynamically based on distance & density.
 */
export function getDynamicPhysicsPath({
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
}: {
  sourceX: number;
  sourceY: number;
  sourcePosition: Position;
  targetX: number;
  targetY: number;
  targetPosition: Position;
}): [string, number, number] {
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  const midX = sourceX + dx / 2;
  const midY = sourceY + dy / 2;

  // 1. Pure Straight Vertical Path (aligned center spine)
  if (
    absDx <= 35 &&
    ((sourcePosition === Position.Bottom && targetPosition === Position.Top) ||
      (sourcePosition === Position.Top && targetPosition === Position.Bottom))
  ) {
    return [`M ${sourceX},${sourceY} L ${targetX},${targetY}`, midX, midY];
  }

  // 2. Pure Straight Horizontal Path
  if (
    absDy <= 20 &&
    ((sourcePosition === Position.Right && targetPosition === Position.Left) ||
      (sourcePosition === Position.Left && targetPosition === Position.Right))
  ) {
    return [`M ${sourceX},${sourceY} L ${targetX},${targetY}`, midX, midY];
  }

  // 3. Adaptive Density Curve for Side Branching
  let cp1x = sourceX;
  let cp1y = sourceY;
  let cp2x = targetX;
  let cp2y = targetY;

  // Density factor: scales curvature based on horizontal distance
  const curvatureFactor = Math.min(Math.max(absDx * 0.5, 30), 160);

  if (sourcePosition === Position.Right) {
    cp1x = sourceX + curvatureFactor;
  } else if (sourcePosition === Position.Left) {
    cp1x = sourceX - curvatureFactor;
  } else if (sourcePosition === Position.Bottom) {
    cp1y = sourceY + Math.min(Math.max(absDy * 0.4, 25), 70);
  } else if (sourcePosition === Position.Top) {
    cp1y = sourceY - Math.min(Math.max(absDy * 0.4, 25), 70);
  }

  if (targetPosition === Position.Right) {
    cp2x = targetX + curvatureFactor;
  } else if (targetPosition === Position.Left) {
    cp2x = targetX - curvatureFactor;
  } else if (targetPosition === Position.Top) {
    cp2y = targetY - Math.min(Math.max(absDy * 0.4, 25), 70);
  } else if (targetPosition === Position.Bottom) {
    cp2y = targetY + Math.min(Math.max(absDy * 0.4, 25), 70);
  }

  const path = `M ${sourceX},${sourceY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${targetX},${targetY}`;
  return [path, midX, midY];
}

export const InteractiveEdge = memo((props: EdgeProps) => {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    selected,
  } = props;

  const { setEdges } = useReactFlow();

  const [edgePath, labelX, labelY] = getDynamicPhysicsPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
  };

  const isStraight = edgePath.startsWith("M") && edgePath.includes("L");

  const isEditable = (props.data as any)?.editable === true;

  return (
    <>
      {/* Background wider invisible path for easier dragging/clicking */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={isEditable ? 24 : 0}
        className={isEditable ? "cursor-pointer" : "pointer-events-none"}
      />

      {/* Main Visible Wire */}
      <BaseEdge
        path={edgePath}
        style={{
          ...style,
          stroke: isEditable && selected ? "#ef4444" : style.stroke || "#3b82f6",
          strokeWidth: isEditable && selected ? 3 : isStraight ? 2.5 : 2,
          strokeDasharray: isStraight ? undefined : style.strokeDasharray || "4 4",
          transition: "stroke 0.2s, stroke-width 0.2s",
        }}
      />

      {/* Interactive Delete Button on selection (Admin only) */}
      {isEditable && selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan z-30"
          >
            <button
              type="button"
              onClick={handleDelete}
              title="Delete Connection Wire"
              className="w-6 h-6 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg border-2 border-white dark:border-black transition-transform hover:scale-125 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

InteractiveEdge.displayName = "InteractiveEdge";
