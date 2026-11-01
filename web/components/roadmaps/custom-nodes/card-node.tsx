/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { memo, useState, useRef, useEffect } from "react";
import { NodeProps, NodeResizer, useReactFlow } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { RoadmapNodeData } from "@/lib/roadmaps/types";
import { FileText } from "lucide-react";

export const CardNode = memo((props: NodeProps) => {
  const { id, data, selected } = props;
  const nodeData = data as unknown as RoadmapNodeData;
  const { setNodes } = useReactFlow();

  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(nodeData.label || nodeData.description || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setText(nodeData.label || nodeData.description || "");
  }, [nodeData.label, nodeData.description]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            data: {
              ...n.data,
              label: text,
              description: text,
            },
          };
        }
        return n;
      })
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
  };

  return (
    <div
      onDoubleClick={() => setIsEditing(true)}
      className={cn(
        "relative p-4 rounded-xl border-2 border-border/80 bg-card/95 backdrop-blur-md shadow-xs select-none min-w-[220px] max-w-[360px] text-xs leading-relaxed transition-shadow z-10 cursor-pointer",
        selected && "ring-2 ring-primary ring-offset-2 shadow-md border-primary/70"
      )}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={180}
        minHeight={60}
        handleClassName="!w-2 !h-2 !bg-primary !border !border-background"
        lineClassName="!border-primary"
      />

      {nodeData.category && (
        <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-border/40">
          <FileText className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">
            {nodeData.category}
          </span>
        </div>
      )}

      {isEditing ? (
        <div className="space-y-1.5 nodrag">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            rows={3}
            className="w-full text-xs p-1.5 rounded-md border border-primary bg-background text-foreground resize-y focus:outline-hidden"
            placeholder="Type your notes here..."
          />
          <div className="text-[10px] text-muted-foreground flex justify-between">
            <span>Press Ctrl+Enter to save</span>
            <button
              type="button"
              onClick={handleSave}
              className="text-primary font-bold hover:underline"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <div className="text-foreground/90 whitespace-pre-line text-xs font-normal">
          {text || <span className="text-muted-foreground italic">Double-click to edit content...</span>}
        </div>
      )}
    </div>
  );
});

CardNode.displayName = "CardNode";
