"use client";

import { memo } from "react";
import { BaseEdge, type EdgeProps } from "@xyflow/react";
import { getDynamicPhysicsPath } from "./interactive-edge";

export const AnimatedGlowEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
  }: EdgeProps) => {
    const [edgePath] = getDynamicPhysicsPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    const isStraight = edgePath.startsWith("M") && edgePath.includes("L");

    return (
      <>
        {/* Glow halo */}
        <path
          d={edgePath}
          fill="none"
          stroke={style.stroke || "#3b82f6"}
          strokeWidth={6}
          strokeOpacity={0.15}
          className="transition-opacity"
        />

        {/* Core animated wire */}
        <BaseEdge
          id={id}
          path={edgePath}
          markerEnd={markerEnd}
          style={{
            ...style,
            strokeWidth: isStraight ? 2.5 : 2,
            strokeDasharray: isStraight ? undefined : style.strokeDasharray || "4 4",
          }}
        />
      </>
    );
  }
);

AnimatedGlowEdge.displayName = "AnimatedGlowEdge";
