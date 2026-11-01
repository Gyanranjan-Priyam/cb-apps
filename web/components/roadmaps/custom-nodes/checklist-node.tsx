/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { memo, useEffect, useState } from "react";
import { Handle, Position, NodeProps, useReactFlow } from "@xyflow/react";
import { CheckSquare, Square, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoadmapNodeData } from "@/lib/roadmaps/types";

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export const ChecklistNode = memo((props: NodeProps) => {
  const { id, data, selected } = props;
  const nodeData = data as unknown as RoadmapNodeData;
  const { setNodes } = useReactFlow();

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsAdmin(window.location.pathname.includes("/admin"));
    }
  }, []);

  const [items, setItems] = useState<ChecklistItem[]>(
    (nodeData as any).checklistItems || [
      { id: "c-1", text: nodeData.label || "Checklist Task 1", completed: false },
      { id: "c-2", text: "Complete practice problem", completed: false },
    ]
  );

  useEffect(() => {
    if ((nodeData as any).checklistItems) {
      setItems((nodeData as any).checklistItems);
    }
  }, [(nodeData as any).checklistItems]);

  const toggleItem = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = items.map((it) =>
      it.id === itemId ? { ...it, completed: !it.completed } : it
    );
    setItems(updated);
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            data: {
              ...n.data,
              checklistItems: updated,
            },
          };
        }
        return n;
      })
    );
  };

  const deleteItem = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) return;
    const updated = items.filter((it) => it.id !== itemId);
    setItems(updated);
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            data: {
              ...n.data,
              checklistItems: updated,
            },
          };
        }
        return n;
      })
    );
  };

  const addItem = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) return;
    const newItem: ChecklistItem = {
      id: `c-${Date.now()}`,
      text: `Task ${items.length + 1}`,
      completed: false,
    };
    const updated = [...items, newItem];
    setItems(updated);
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            data: {
              ...n.data,
              checklistItems: updated,
            },
          };
        }
        return n;
      })
    );
  };

  const allCompleted = items.length > 0 && items.every((i) => i.completed);

  return (
    <div
      className={cn(
        "relative rounded-xl border-2 bg-card/95 backdrop-blur-md p-3.5 shadow-md min-w-[210px] max-w-[280px] select-none transition-all duration-150 space-y-2 z-10",
        allCompleted
          ? "border-emerald-500/80 shadow-[0_0_16px_rgba(16,185,129,0.2)]"
          : "border-border/80",
        selected && "ring-2 ring-primary ring-offset-2"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2.5 !h-2.5 !bg-muted-foreground !border-2 !border-background"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2.5 !h-2.5 !bg-muted-foreground !border-2 !border-background"
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-border/50">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <CheckSquare className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-bold text-foreground truncate">
            {nodeData.label || "Checklist"}
          </span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground font-semibold">
          {items.filter((i) => i.completed).length}/{items.length}
        </span>
      </div>

      {/* Items List */}
      <div className="space-y-1.5">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={(e) => toggleItem(item.id, e)}
            className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-muted/40 hover:bg-muted/70 cursor-pointer transition-colors text-xs group/item"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {item.completed ? (
                <CheckSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <Square className="w-3.5 h-3.5 text-muted-foreground shrink-0 group-hover/item:text-primary" />
              )}
              <span
                className={cn(
                  "flex-1 text-[11px] leading-tight truncate",
                  item.completed
                    ? "line-through text-muted-foreground font-normal"
                    : "text-foreground font-medium"
                )}
              >
                {item.text}
              </span>
            </div>

            {/* Admin-only Delete Button on Hover */}
            {isAdmin && (
              <button
                type="button"
                onClick={(e) => deleteItem(item.id, e)}
                title="Delete task"
                className="opacity-0 group-hover/item:opacity-100 p-0.5 rounded text-muted-foreground hover:text-rose-500 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Admin-only Add Item Button */}
      {isAdmin && (
        <button
          type="button"
          onClick={addItem}
          className="w-full flex items-center justify-center gap-1 py-1 rounded-md border border-dashed border-border hover:border-primary/60 text-[10px] font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          <span>Add item</span>
        </button>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2.5 !h-2.5 !bg-muted-foreground !border-2 !border-background"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2.5 !h-2.5 !bg-muted-foreground !border-2 !border-background"
      />
    </div>
  );
});

ChecklistNode.displayName = "ChecklistNode";
