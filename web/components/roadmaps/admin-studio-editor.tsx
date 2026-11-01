/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  addEdge,
  reconnectEdge,
  SelectionMode,
  type Node,
  type Edge,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { TopicNode, PALETTE_COLORS } from "./custom-nodes/topic-node";
import { SubtopicNode } from "./custom-nodes/subtopic-node";
import { TitleNode } from "./custom-nodes/title-node";
import { CardNode } from "./custom-nodes/card-node";
import { SectionNode } from "./custom-nodes/section-node";
import { ButtonNode } from "./custom-nodes/button-node";
import { LinksNode } from "./custom-nodes/links-node";
import { ChecklistNode } from "./custom-nodes/checklist-node";
import { MilestoneNode } from "./custom-nodes/milestone-node";
import { BranchNode } from "./custom-nodes/branch-node";
import { InteractiveEdge } from "./custom-edges/interactive-edge";
import { MarkdownEditor } from "./markdown-editor";
import { MermaidImportModal } from "./mermaid-import-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Save,
  Plus,
  Trash2,
  ArrowLeft,
  Link as LinkIcon,
  Heading1,
  Type,
  Square,
  MessageSquare,
  Layers,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  CheckSquare,
  GitBranch,
  Move,
  ArrowUpRight,
  Undo2,
  Redo2,
  Copy,
  GripVertical,
  X,
  Compass,
  ExternalLink,
  Maximize2,
  Minimize2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";
import { updateAdminRoadmap } from "@/app/admin/roadmaps/actions";
import type {
  RoadmapData,
  RoadmapGraphNode,
  RoadmapGraphEdge,
  RoadmapNodeData,
  RoadmapResource,
} from "@/lib/roadmaps/types";

export interface AvailableRoadmapOption {
  id: string;
  slug: string;
  title: string;
  category?: string;
}

interface AdminStudioEditorProps {
  roadmap: RoadmapData;
  availableRoadmaps?: AvailableRoadmapOption[];
}

// Left Palette Component Definitions
const PALETTE_COMPONENTS = [
  { type: "title", label: "Title", icon: Heading1, defaultText: "Title (Learning Path)" },
  { type: "topic", label: "Topic", icon: Square, defaultText: "New Topic" },
  { type: "subtopic", label: "Sub Topic", icon: GitBranch, defaultText: "Subtopic 1" },
  { type: "button", label: "Roadmap Link", icon: Compass, defaultText: "Prompt Engineering Roadmap" },
  { type: "paragraph", label: "Paragraph", icon: MessageSquare, defaultText: "Add instructional notes or text description here..." },
  { type: "label", label: "Label", icon: Type, defaultText: "Label" },
  { type: "checklist", label: "Checklist", icon: CheckSquare, defaultText: "Checklist Item" },
  { type: "links", label: "Links Group", icon: LinkIcon, defaultText: "Documentation" },
  { type: "section", label: "Section", icon: Layers, defaultText: "Section Container" },
];

function AdminStudioEditorInternal({ roadmap, availableRoadmaps = [] }: AdminStudioEditorProps) {
  const { fitView, screenToFlowPosition } = useReactFlow();
  const [title, setTitle] = useState(roadmap.title);
  const [description, setDescription] = useState(roadmap.description);
  const [category, setCategory] = useState<string>(roadmap.category || "web-dev");
  const [badgeText, setBadgeText] = useState(roadmap.badgeText || "");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"properties" | "content">("properties");

  // Selected Node for editing in right sidebar
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [previewDrawerNode, setPreviewDrawerNode] = useState<RoadmapGraphNode | null>(null);
  const [isMarkdownExpanded, setIsMarkdownExpanded] = useState(false);

  // Registered Custom Nodes
  const nodeTypes = useMemo(
    () => ({
      topic: TopicNode,
      subtopic: SubtopicNode,
      title: TitleNode,
      paragraph: CardNode,
      section: SectionNode,
      button: ButtonNode,
      links: LinksNode,
      checklist: ChecklistNode,
      milestone: MilestoneNode,
      branch: BranchNode,
    }),
    []
  );

  const edgeTypes = useMemo(
    () => ({
      animated: InteractiveEdge,
      interactive: InteractiveEdge,
      default: InteractiveEdge,
    }),
    []
  );

  // Initial Nodes & Edges with proper z-index layering for sections
  const initialNodes: Node[] = useMemo(() => {
    return roadmap.nodes.map((n) => ({
      id: n.id,
      type: n.type || "topic",
      position: n.position,
      data: n.data,
      zIndex: n.type === "section" ? -1 : 10,
    }));
  }, [roadmap.nodes]);

  const initialEdges: Edge[] = useMemo(() => {
    return roadmap.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: (e as any).sourceHandle,
      targetHandle: (e as any).targetHandle,
      type: "interactive",
      data: { editable: true },
      animated: e.animated !== false,
      style: { stroke: "#3b82f6", strokeWidth: 2 },
    }));
  }, [roadmap.edges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Selected Node Data
  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  // Connect Handler
  const onConnect = useCallback(
    (params: Connection) => {
      const sourceHandle = params.sourceHandle || "bottom";
      const targetHandle = params.targetHandle || "top";
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            sourceHandle,
            targetHandle,
            type: "interactive",
            data: { editable: true },
            animated: true,
            style: { stroke: "#3b82f6", strokeWidth: 2 },
          },
          eds
        )
      );
      toast.success("Connected nodes!");
    },
    [setEdges]
  );

  // Edge Reconnection / Reassignment Handler
  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
      toast.success("Wire reconnected to new node!");
    },
    [setEdges]
  );

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    flowX: number;
    flowY: number;
    targetNodeId: string | null;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    flowX: 0,
    flowY: 0,
    targetNodeId: null,
  });

  // Click node handler
  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNodeId(node.id);
    setContextMenu((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev));
  }, []);

  // Click canvas background
  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setIsMarkdownExpanded(false);
    setContextMenu((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev));
  }, []);

  // Right Click on Canvas Pane
  const onPaneContextMenu = useCallback(
    (event: any) => {
      event.preventDefault();
      const flowPos = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      setContextMenu({
        isOpen: true,
        x: event.clientX,
        y: event.clientY,
        flowX: flowPos.x,
        flowY: flowPos.y,
        targetNodeId: null,
      });
    },
    [screenToFlowPosition]
  );

  // Right Click on a Node
  const onNodeContextMenu = useCallback(
    (event: any, node: Node) => {
      event.preventDefault();
      const flowPos = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      setSelectedNodeId(node.id);
      if (!node.selected) {
        setNodes((nds) =>
          nds.map((n) => ({ ...n, selected: n.id === node.id }))
        );
      }
      setContextMenu({
        isOpen: true,
        x: event.clientX,
        y: event.clientY,
        flowX: flowPos.x,
        flowY: flowPos.y,
        targetNodeId: node.id,
      });
    },
    [screenToFlowPosition, setNodes]
  );

  // Add Node from Context Menu at Right-Clicked location
  const handleContextMenuAddNode = (type: string, defaultText: string) => {
    takeSnapshot();
    const newId = `node-${Date.now()}`;
    const validNodeTypes = [
      "topic",
      "subtopic",
      "title",
      "paragraph",
      "section",
      "button",
      "links",
      "checklist",
    ];
    const nodeType = validNodeTypes.includes(type) ? type : "topic";

    const newNode: Node = {
      id: newId,
      type: nodeType,
      position: { x: contextMenu.flowX, y: contextMenu.flowY },
      zIndex: nodeType === "section" ? -1 : 10,
      data: {
        label: defaultText,
        colorKey: type === "subtopic" ? "C" : "B",
        fontSize: type === "title" ? "XL" : type === "subtopic" ? "S" : "M",
        resources:
          type === "links"
            ? [
                {
                  id: `r-${Date.now()}-1`,
                  title: "Official Documentation",
                  url: "https://developer.mozilla.org",
                  type: "docs",
                },
              ]
            : [],
      } as RoadmapNodeData,
    };

    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(newId);
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
    toast.success(`Created ${type} at clicked spot!`);
  };

  // Double Click canvas background to add Paragraph Note
  const onPaneDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newId = `paragraph-${Date.now()}`;
      const newNode: Node = {
        id: newId,
        type: "paragraph",
        position,
        data: {
          label: "New note... (double click to edit)",
          description: "New note...",
          fontSize: "M",
        } as RoadmapNodeData,
        zIndex: 10,
      };

      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(newId);
      toast.success("Added paragraph note at double-clicked location!");
    },
    [screenToFlowPosition, setNodes]
  );

  // ── Undo / Redo History Stack ──
  const historyRef = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const futureRef = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const clipboardRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null);

  // Take Snapshot before mutating state
  const takeSnapshot = useCallback(() => {
    historyRef.current.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    });
    if (historyRef.current.length > 50) {
      historyRef.current.shift();
    }
    futureRef.current = []; // Clear redo stack on new action
  }, [nodes, edges]);

  // Undo Action (Ctrl+Z / Cmd+Z)
  const handleUndo = useCallback(() => {
    if (historyRef.current.length === 0) {
      toast.info("Nothing to undo");
      return;
    }
    const previous = historyRef.current.pop()!;
    futureRef.current.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    });
    setNodes(previous.nodes);
    setEdges(previous.edges);
    toast.success("Undo performed");
  }, [nodes, edges, setNodes, setEdges]);

  // Redo Action (Ctrl+Y / Cmd+Shift+Z)
  const handleRedo = useCallback(() => {
    if (futureRef.current.length === 0) {
      toast.info("Nothing to redo");
      return;
    }
    const next = futureRef.current.pop()!;
    historyRef.current.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    });
    setNodes(next.nodes);
    setEdges(next.edges);
    toast.success("Redo performed");
  }, [nodes, edges, setNodes, setEdges]);

  // Select All Action (Ctrl+A / Cmd+A)
  const handleSelectAll = useCallback(() => {
    setNodes((nds) => nds.map((n) => ({ ...n, selected: true })));
    setEdges((eds) => eds.map((e) => ({ ...e, selected: true })));
    toast.info("Selected all canvas items");
  }, [setNodes, setEdges]);

  // Duplicate Selection Action (Ctrl+D / Cmd+D)
  const handleDuplicateSelection = useCallback(() => {
    const selected = nodes.filter((n) => n.selected);
    if (selected.length === 0) return;

    takeSnapshot();
    const idMap = new Map<string, string>();
    const duplicatedNodes: Node[] = selected.map((n) => {
      const newId = `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      idMap.set(n.id, newId);
      return {
        ...n,
        id: newId,
        selected: true,
        position: {
          x: n.position.x + 40,
          y: n.position.y + 40,
        },
      };
    });

    setNodes((nds) => [
      ...nds.map((n) => ({ ...n, selected: false })),
      ...duplicatedNodes,
    ]);
    toast.success(`Duplicated ${selected.length} items`);
  }, [nodes, setNodes, takeSnapshot]);

  // Copy Action (Ctrl+C / Cmd+C)
  const handleCopy = useCallback(() => {
    const selected = nodes.filter((n) => n.selected);
    if (selected.length === 0) return;
    const selectedIds = new Set(selected.map((n) => n.id));
    const internalEdges = edges.filter(
      (e) => selectedIds.has(e.source) && selectedIds.has(e.target)
    );
    clipboardRef.current = {
      nodes: JSON.parse(JSON.stringify(selected)),
      edges: JSON.parse(JSON.stringify(internalEdges)),
    };
    toast.success(`Copied ${selected.length} items to clipboard`);
  }, [nodes, edges]);

  // Paste Action (Ctrl+V / Cmd+V)
  const handlePaste = useCallback(() => {
    if (!clipboardRef.current || clipboardRef.current.nodes.length === 0) return;

    takeSnapshot();
    const idMap = new Map<string, string>();
    const pastedNodes: Node[] = clipboardRef.current.nodes.map((n) => {
      const newId = `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      idMap.set(n.id, newId);
      return {
        ...n,
        id: newId,
        selected: true,
        position: {
          x: n.position.x + 50,
          y: n.position.y + 50,
        },
      };
    });

    const pastedEdges: Edge[] = clipboardRef.current.edges.map((e) => ({
      ...e,
      id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      source: idMap.get(e.source) || e.source,
      target: idMap.get(e.target) || e.target,
      selected: true,
    }));

    setNodes((nds) => [
      ...nds.map((n) => ({ ...n, selected: false })),
      ...pastedNodes,
    ]);
    setEdges((eds) => [
      ...eds.map((e) => ({ ...e, selected: false })),
      ...pastedEdges,
    ]);
    toast.success(`Pasted ${pastedNodes.length} items`);
  }, [setNodes, setEdges, takeSnapshot]);

  // Mermaid.js to Roadmap Generator Handler
  const [isMermaidModalOpen, setIsMermaidModalOpen] = useState(false);

  const handleApplyMermaidRoadmap = useCallback(
    (
      newNodes: RoadmapGraphNode[],
      newEdges: RoadmapGraphEdge[],
      mode: "replace" | "append"
    ) => {
      takeSnapshot();
      if (mode === "replace") {
        const formattedNodes: Node[] = newNodes.map((n) => ({
          id: n.id,
          type: n.type || "topic",
          position: n.position,
          data: n.data,
          zIndex: n.type === "section" ? -1 : 10,
        }));
        const formattedEdges: Edge[] = newEdges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          type: "interactive",
          animated: e.animated !== false,
          label: e.label,
          style: e.style || { stroke: "#3b82f6", strokeWidth: 2 },
        }));
        setNodes(formattedNodes);
        setEdges(formattedEdges);
      } else {
        const maxY = nodes.length > 0 ? Math.max(...nodes.map((n) => n.position.y)) : 0;
        const yOffset = maxY + 220;

        const idMap = new Map<string, string>();
        const formattedNodes: Node[] = newNodes.map((n) => {
          const newId = `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          idMap.set(n.id, newId);
          return {
            id: newId,
            type: n.type || "topic",
            position: { x: n.position.x, y: n.position.y + yOffset },
            data: n.data,
            zIndex: n.type === "section" ? -1 : 10,
          };
        });

        const formattedEdges: Edge[] = newEdges.map((e) => ({
          id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          source: idMap.get(e.source) || e.source,
          target: idMap.get(e.target) || e.target,
          type: "interactive",
          animated: e.animated !== false,
          label: e.label,
          style: e.style || { stroke: "#3b82f6", strokeWidth: 2 },
        }));

        setNodes((nds) => [...nds, ...formattedNodes]);
        setEdges((eds) => [...eds, ...formattedEdges]);
      }

      setTimeout(() => {
        fitView({ padding: 0.2, duration: 800 });
      }, 120);
    },
    [takeSnapshot, nodes, fitView, setNodes, setEdges]
  );

  // Multi-Selection Tracking
  const selectedNodes = useMemo(() => nodes.filter((n) => n.selected), [nodes]);
  const isAlreadyGrouped = useMemo(() => selectedNodes.some((n) => !!(n.data as any)?.groupId), [selectedNodes]);

  // Lockstep Group Dragging Reference
  const dragStartPositions = useRef<Map<string, { x: number; y: number }>>(new Map());

  const onNodeDragStart = useCallback(
    (_: any, node: Node) => {
      takeSnapshot();
      const groupId = (node.data as any)?.groupId;
      if (!groupId) return;
      const groupNodes = nodes.filter((n) => (n.data as any)?.groupId === groupId);
      dragStartPositions.current.clear();
      groupNodes.forEach((n) => {
        dragStartPositions.current.set(n.id, { ...n.position });
      });
    },
    [nodes, takeSnapshot]
  );

  const onNodeDrag = useCallback(
    (_: any, node: Node) => {
      const groupId = (node.data as any)?.groupId;
      if (!groupId) return;
      const startPos = dragStartPositions.current.get(node.id);
      if (!startPos) return;

      const dx = node.position.x - startPos.x;
      const dy = node.position.y - startPos.y;

      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== node.id && (n.data as any)?.groupId === groupId) {
            const siblingStart = dragStartPositions.current.get(n.id);
            if (siblingStart) {
              return {
                ...n,
                position: {
                  x: Math.round(siblingStart.x + dx),
                  y: Math.round(siblingStart.y + dy),
                },
              };
            }
          }
          return n;
        })
      );
    },
    [setNodes]
  );

  const onNodeDragStop = useCallback(() => {
    dragStartPositions.current.clear();
  }, []);

  // Group Selected Nodes into a linked fixed group
  const handleGroupSelected = useCallback(() => {
    if (selectedNodes.length < 2) return;
    takeSnapshot();
    const newGroupId = `grp-${Date.now()}`;
    setNodes((nds) =>
      nds.map((n) => {
        if (n.selected) {
          return {
            ...n,
            data: {
              ...n.data,
              groupId: newGroupId,
            },
          };
        }
        return n;
      })
    );
    toast.success(`Grouped ${selectedNodes.length} items! Moving any item moves the whole group.`);
  }, [selectedNodes, setNodes, takeSnapshot]);

  // Ungroup Selected Nodes
  const handleUngroupSelected = useCallback(() => {
    takeSnapshot();
    setNodes((nds) =>
      nds.map((n) => {
        if (n.selected) {
          const newData = { ...n.data };
          delete (newData as any).groupId;
          return {
            ...n,
            data: newData,
          };
        }
        return n;
      })
    );
    toast.success("Ungrouped selected items");
  }, [setNodes, takeSnapshot]);

  // Align Selected Vertically
  const handleAlignSelectedVertically = useCallback(() => {
    if (selectedNodes.length < 2) return;
    takeSnapshot();
    const avgX = Math.round(
      selectedNodes.reduce((sum, n) => sum + n.position.x, 0) / selectedNodes.length
    );
    setNodes((nds) =>
      nds.map((n) => (n.selected ? { ...n, position: { ...n.position, x: avgX } } : n))
    );
    toast.success("Aligned items vertically!");
  }, [selectedNodes, setNodes, takeSnapshot]);

  // Align Selected Horizontally
  const handleAlignSelectedHorizontally = useCallback(() => {
    if (selectedNodes.length < 2) return;
    takeSnapshot();
    const avgY = Math.round(
      selectedNodes.reduce((sum, n) => sum + n.position.y, 0) / selectedNodes.length
    );
    setNodes((nds) =>
      nds.map((n) => (n.selected ? { ...n, position: { ...n.position, y: avgY } } : n))
    );
    toast.success("Aligned items horizontally!");
  }, [selectedNodes, setNodes, takeSnapshot]);

  // Batch Delete Selected
  const handleDeleteSelected = useCallback(() => {
    takeSnapshot();
    const selectedIds = new Set(selectedNodes.map((n) => n.id));
    setNodes((nds) => nds.filter((n) => !selectedIds.has(n.id)));
    setEdges((eds) => eds.filter((e) => !selectedIds.has(e.source) && !selectedIds.has(e.target)));
    setSelectedNodeId(null);
    toast.success(`Deleted ${selectedNodes.length} items`);
  }, [selectedNodes, setNodes, setEdges, takeSnapshot]);

  // Drag and Drop from Palette onto Canvas
  const onDragStart = (event: React.DragEvent, nodeType: string, defaultText: string) => {
    event.dataTransfer.setData("application/reactflow/type", nodeType);
    event.dataTransfer.setData("application/reactflow/text", defaultText);
    event.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow/type");
      const defaultText = event.dataTransfer.getData("application/reactflow/text");

      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const validNodeTypes = ["topic", "subtopic", "title", "paragraph", "section", "button", "links", "checklist"];
      const nodeType = validNodeTypes.includes(type) ? type : "topic";
      const newId = `node-${Date.now()}`;

      const newNode: Node = {
        id: newId,
        type: nodeType,
        position,
        zIndex: nodeType === "section" ? -1 : 10,
        data: {
          label: defaultText || "New Node",
          colorKey: type === "subtopic" ? "C" : "B",
          fontSize: type === "title" ? "XL" : type === "subtopic" ? "S" : "M",
          resources: type === "links" ? [
            { id: `r-${Date.now()}-1`, title: "Official Documentation", url: "https://developer.mozilla.org", type: "docs" },
            { id: `r-${Date.now()}-2`, title: "Community Guide & Tutorials", url: "https://roadmap.sh", type: "article" },
          ] : [],
        } as RoadmapNodeData,
      };

      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(newId);
      toast.success(`Added ${type} at dropped position!`);
    },
    [screenToFlowPosition, setNodes]
  );

  // Add Component from Left Palette (Click fallback)
  const handleAddComponent = (type: string, defaultText: string) => {
    const newId = `node-${Date.now()}`;
    const validNodeTypes = ["topic", "subtopic", "title", "paragraph", "section", "button", "links", "checklist"];
    const nodeType = validNodeTypes.includes(type) ? type : "topic";

    const newNode: Node = {
      id: newId,
      type: nodeType,
      position: { x: 320, y: 120 + nodes.length * 45 },
      zIndex: nodeType === "section" ? -1 : 10,
      data: {
        label: defaultText,
        colorKey: type === "subtopic" ? "C" : "B",
        fontSize: type === "title" ? "XL" : type === "subtopic" ? "S" : "M",
        resources: type === "links" ? [
          { id: `r-${Date.now()}-1`, title: "Official Documentation", url: "https://developer.mozilla.org", type: "docs" },
          { id: `r-${Date.now()}-2`, title: "Community Guide & Tutorials", url: "https://roadmap.sh", type: "article" },
        ] : [],
      } as RoadmapNodeData,
    };

    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(newId);
    toast.success(`Added ${type} component`);
  };

  // Update selected node data (applies to ALL selected nodes in batch)
  const updateSelectedNodeData = (updates: Partial<RoadmapNodeData>) => {
    takeSnapshot();
    const targetIds =
      selectedNodes.length > 0
        ? new Set(selectedNodes.map((n) => n.id))
        : selectedNodeId
        ? new Set([selectedNodeId])
        : new Set<string>();

    if (targetIds.size === 0) return;

    setNodes((nds) =>
      nds.map((n) => {
        if (targetIds.has(n.id)) {
          return {
            ...n,
            data: {
              ...n.data,
              ...updates,
            },
          };
        }
        return n;
      })
    );
  };

  // Update selected node type (applies to ALL selected nodes in batch)
  const updateSelectedNodeType = (newType: string) => {
    takeSnapshot();
    const targetIds =
      selectedNodes.length > 0
        ? new Set(selectedNodes.map((n) => n.id))
        : selectedNodeId
        ? new Set([selectedNodeId])
        : new Set<string>();

    if (targetIds.size === 0) return;

    setNodes((nds) =>
      nds.map((n) => {
        if (targetIds.has(n.id)) {
          return {
            ...n,
            type: newType as any,
            zIndex: newType === "section" ? -1 : 10,
          };
        }
        return n;
      })
    );
    toast.success(`Updated ${targetIds.size} node(s) to ${newType}`);
  };

  // Delete selected node(s)
  const handleDeleteNode = () => {
    const targetIds =
      selectedNodes.length > 0
        ? new Set(selectedNodes.map((n) => n.id))
        : selectedNodeId
        ? new Set([selectedNodeId])
        : new Set<string>();

    if (targetIds.size === 0) return;

    takeSnapshot();
    setNodes((nds) => nds.filter((n) => !targetIds.has(n.id)));
    setEdges((eds) =>
      eds.filter((e) => !targetIds.has(e.source) && !targetIds.has(e.target))
    );
    setSelectedNodeId(null);
    toast.info(`Deleted ${targetIds.size} item(s)`);
  };

  // 1-Click "ADD SUBTOPIC" Child Node - ALWAYS connected directly to parent Topic
  const handleAddChildSubtopic = (direction: "right" | "left" | "top" | "bottom") => {
    if (!selectedNode) return;

    // 1. Identify the root parent Topic node recursively
    let parentNode = selectedNode;
    const visited = new Set<string>();
    while (parentNode.type === "subtopic" || parentNode.type === "branch") {
      visited.add(parentNode.id);
      const incomingEdge = edges.find((e) => e.target === parentNode.id);
      if (!incomingEdge || visited.has(incomingEdge.source)) break;
      const foundParent = nodes.find((n) => n.id === incomingEdge.source);
      if (!foundParent) break;
      parentNode = foundParent;
    }

    const parentPos = parentNode.position;

    // 2. Count existing subtopics already branching from this parent
    const existingChildren = edges
      .filter((e) => e.source === parentNode.id)
      .map((e) => nodes.find((n) => n.id === e.target))
      .filter(Boolean) as Node[];

    const count = existingChildren.length;
    // Stack children with 48px clean vertical spacing
    const yOffset = count === 0 ? 0 : count * 48;

    let childPos = { x: parentPos.x + 250, y: parentPos.y + yOffset };
    let sourceHandle = "right";
    let targetHandle = "left";

    if (direction === "left") {
      childPos = { x: parentPos.x - 250, y: parentPos.y + yOffset };
      sourceHandle = "left";
      targetHandle = "right";
    } else if (direction === "top") {
      childPos = { x: parentPos.x + count * 180, y: parentPos.y - 80 };
      sourceHandle = "top";
      targetHandle = "bottom";
    } else if (direction === "bottom") {
      childPos = { x: parentPos.x + count * 180, y: parentPos.y + 80 };
      sourceHandle = "bottom";
      targetHandle = "top";
    }

    const childId = `subtopic-${Date.now()}`;
    const newChildNode: Node = {
      id: childId,
      type: "subtopic",
      position: childPos,
      data: {
        label: `Subtopic ${count + 1}`,
        colorKey: "C",
        fontSize: "S",
        resources: [],
      } as RoadmapNodeData,
    };

    // Connect DIRECTLY to parent Topic!
    const newEdge: Edge = {
      id: `edge-${parentNode.id}-${childId}`,
      source: parentNode.id,
      target: childId,
      sourceHandle,
      targetHandle,
      type: "animated",
      animated: true,
      style: { stroke: "#3b82f6", strokeWidth: 2, strokeDasharray: "4 4" },
    };

    setNodes((nds) => [...nds, newChildNode]);
    setEdges((eds) => [...eds, newEdge]);
    setSelectedNodeId(childId);
    toast.success(`Subtopic ${count + 1} connected to ${parentNode.data.label || "Parent Topic"}`);
  };

  // Checklist Management
  const handleAddChecklistItem = () => {
    if (!selectedNode) return;
    const currentItems = (selectedNode.data as any).checklistItems || [
      { id: "c-1", text: selectedNode.data.label || "Task 1", completed: false },
    ];
    const newItem = {
      id: `c-${Date.now()}`,
      text: `Task ${currentItems.length + 1}`,
      completed: false,
    };
    updateSelectedNodeData({ checklistItems: [...currentItems, newItem] });
  };

  const handleUpdateChecklistItem = (
    itemId: string,
    updates: Partial<{ text: string; completed: boolean }>
  ) => {
    if (!selectedNode) return;
    const currentItems = (selectedNode.data as any).checklistItems || [];
    updateSelectedNodeData({
      checklistItems: currentItems.map((it: any) =>
        it.id === itemId ? { ...it, ...updates } : it
      ),
    });
  };

  const handleRemoveChecklistItem = (itemId: string) => {
    if (!selectedNode) return;
    const currentItems = (selectedNode.data as any).checklistItems || [];
    updateSelectedNodeData({
      checklistItems: currentItems.filter((it: any) => it.id !== itemId),
    });
  };

  // Drag and Drop Checklist Task Reordering
  const [draggedTaskIndex, setDraggedTaskIndex] = useState<number | null>(null);

  const handleTaskDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", `${index}`);
    e.dataTransfer.effectAllowed = "move";
    setDraggedTaskIndex(index);
  };

  const handleTaskDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleTaskDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (
      draggedTaskIndex === null ||
      draggedTaskIndex === targetIndex ||
      !selectedNode
    ) {
      setDraggedTaskIndex(null);
      return;
    }

    const currentItems: any[] = [
      ...((selectedNode.data as any).checklistItems || []),
    ];
    const [movedItem] = currentItems.splice(draggedTaskIndex, 1);
    currentItems.splice(targetIndex, 0, movedItem);

    updateSelectedNodeData({ checklistItems: currentItems });
    setDraggedTaskIndex(null);
    toast.success("Task reordered!");
  };

  const handleTaskDragEnd = () => {
    setDraggedTaskIndex(null);
  };

  // Resources Management
  const handleAddResource = () => {
    if (!selectedNode) return;
    const currentRes: RoadmapResource[] = (selectedNode.data as any).resources || [];
    const newRes: RoadmapResource = {
      id: `res-${Date.now()}`,
      title: "Official Documentation Link",
      url: "https://example.com",
      type: "docs",
      isOfficial: true,
    };
    updateSelectedNodeData({ resources: [...currentRes, newRes] });
  };

  const handleUpdateResource = (resId: string, updates: Partial<RoadmapResource>) => {
    if (!selectedNode) return;
    const currentRes: RoadmapResource[] = (selectedNode.data as any).resources || [];
    const updated = currentRes.map((r) => (r.id === resId ? { ...r, ...updates } : r));
    updateSelectedNodeData({ resources: updated });
  };

  const handleRemoveResource = (resId: string) => {
    if (!selectedNode) return;
    const currentRes: RoadmapResource[] = (selectedNode.data as any).resources || [];
    updateSelectedNodeData({ resources: currentRes.filter((r) => r.id !== resId) });
  };

  // Save Roadmap Action
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await updateAdminRoadmap(roadmap.id, {
        title,
        description,
        category,
        badgeText,
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: n.data,
          ...(n.style ? { style: n.style } : {}),
          ...(n.parentId ? { parentId: n.parentId } : {}),
          ...(n.extent ? { extent: n.extent } : {}),
          ...(n.width ? { width: n.width } : {}),
          ...(n.height ? { height: n.height } : {}),
          ...(n.zIndex !== undefined ? { zIndex: n.zIndex } : {}),
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: (e as any).sourceHandle,
          targetHandle: (e as any).targetHandle,
          type: e.type,
          animated: e.animated,
          ...((e as any).label ? { label: (e as any).label } : {}),
          ...((e as any).style ? { style: (e as any).style } : {}),
        })),
      });

      if (res.status === "success") {
        toast.success("Roadmap saved successfully!");
      } else {
        toast.error(res.message || "Failed to save");
      }
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Global Canvas Keyboard Control Shortcuts (Windows & Mac) ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const isMac = typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl+S / Cmd+S (Save)
      if (isCmdOrCtrl && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
        return;
      }

      // Ctrl+A / Cmd+A (Select All)
      if (isCmdOrCtrl && e.key.toLowerCase() === "a") {
        e.preventDefault();
        handleSelectAll();
        return;
      }

      // Ctrl+Z / Cmd+Z (Undo)
      if (isCmdOrCtrl && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Ctrl+Y or Ctrl+Shift+Z / Cmd+Shift+Z (Redo)
      if (
        (isCmdOrCtrl && e.key.toLowerCase() === "y") ||
        (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === "z")
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Ctrl+C / Cmd+C (Copy)
      if (isCmdOrCtrl && e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleCopy();
        return;
      }

      // Ctrl+V / Cmd+V (Paste)
      if (isCmdOrCtrl && e.key.toLowerCase() === "v") {
        e.preventDefault();
        handlePaste();
        return;
      }

      // Ctrl+D / Cmd+D (Duplicate)
      if (isCmdOrCtrl && e.key.toLowerCase() === "d") {
        e.preventDefault();
        handleDuplicateSelection();
        return;
      }

      // Escape (Deselect All & Close Context Menu)
      if (e.key === "Escape") {
        setSelectedNodeId(null);
        setContextMenu((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev));
        setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
        setEdges((eds) => eds.map((e) => ({ ...e, selected: false })));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handleSave,
    handleSelectAll,
    handleUndo,
    handleRedo,
    handleCopy,
    handlePaste,
    handleDuplicateSelection,
    setNodes,
    setEdges,
  ]);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-background select-none">
      {/* ── 1. Top Navbar (roadmap.sh style) ── */}
      <div className="h-12 border-b border-border/70 bg-card/95 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
            <Link href="/admin/roadmaps">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>

          <div>
            <div className="flex items-center gap-1.5">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-6 text-xs font-bold px-1.5 py-0 border-transparent hover:border-border/60 focus:border-primary w-44 sm:w-60"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Undo & Redo Shortcuts Toolbar */}
          <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/50">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleUndo}
              title="Undo (Ctrl+Z / ⌘Z)"
              className="h-7 w-7 p-0 hover:bg-background rounded-md text-muted-foreground hover:text-foreground"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRedo}
              title="Redo (Ctrl+Y / ⌘Shift+Z)"
              className="h-7 w-7 p-0 hover:bg-background rounded-md text-muted-foreground hover:text-foreground"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Mermaid.js AI Generator Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsMermaidModalOpen(true)}
            className="h-8 text-xs gap-1.5 font-bold border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer shadow-2xs"
            title="Convert Mermaid flowchart to Roadmap nodes automatically"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Mermaid Generator</span>
            <span className="sm:hidden">Mermaid</span>
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="h-8 text-xs gap-1.5 font-bold bg-[#090d16] text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-slate-200 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "Saving..." : "Save Roadmap"}</span>
          </Button>
        </div>
      </div>

      {/* ── Main Work Area: Left Palette + Canvas + Right Inspector ── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ── 2. Left Component Drawer (roadmap.sh palette) ── */}
        <div className="w-52 border-r border-border/70 bg-card/90 backdrop-blur-md flex flex-col shrink-0 overflow-y-auto p-3 space-y-3 z-20">
          {/* Quick Mermaid Generator Shortcut in Palette */}
          <Button
            size="sm"
            onClick={() => setIsMermaidModalOpen(true)}
            className="w-full h-8 text-xs gap-1.5 font-bold bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 shadow-2xs cursor-pointer justify-start px-2.5"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Mermaid Generator</span>
          </Button>

          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
            Components (Drag or Click)
          </div>

          <div className="space-y-1.5">
            {PALETTE_COMPONENTS.map((comp) => {
              const IconComp = comp.icon;
              return (
                <div
                  key={comp.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, comp.type, comp.defaultText)}
                  onClick={() => handleAddComponent(comp.type, comp.defaultText)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-lg border border-border/60 bg-background/80 hover:bg-muted/60 hover:border-primary/50 text-foreground transition-all text-xs font-semibold text-left shadow-2xs group cursor-grab active:cursor-grabbing select-none"
                >
                  <div className="w-5 h-5 rounded bg-muted/60 flex items-center justify-center text-muted-foreground group-hover:text-primary pointer-events-none">
                    <IconComp className="w-3.5 h-3.5" />
                  </div>
                  <span className="pointer-events-none">{comp.label}</span>
                </div>
              );
            })}
          </div>

          {/* Quick Helper */}
          <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40 text-[10px] text-muted-foreground space-y-1">
            <span className="font-bold text-foreground block">Pro Tip:</span>
            <span>Drag any component directly onto the canvas plot or click to add!</span>
          </div>
        </div>

        {/* ── 3. Central Canvas with Drop Zone ── */}
        <div
          onDragOver={onDragOver}
          onDrop={onDrop}
          className="flex-1 h-full relative overflow-hidden"
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onReconnect={onReconnect}
            edgesReconnectable={true}
            selectionOnDrag={true}
            selectionMode={SelectionMode.Partial}
            multiSelectionKeyCode={["Shift", "Meta", "Control"]}
            deleteKeyCode={["Backspace", "Delete"]}
            onNodesDelete={(deletedNodes) => {
              const deletedIds = new Set(deletedNodes.map((n) => n.id));
              setEdges((eds) => eds.filter((e) => !deletedIds.has(e.source) && !deletedIds.has(e.target)));
              if (selectedNodeId && deletedIds.has(selectedNodeId)) {
                setSelectedNodeId(null);
              }
              toast.info(`Deleted ${deletedNodes.length} component(s)`);
            }}
            onNodeDragStart={onNodeDragStart}
            onNodeDrag={onNodeDrag}
            onNodeDragStop={onNodeDragStop}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onDoubleClick={onPaneDoubleClick}
            onPaneContextMenu={onPaneContextMenu}
            onNodeContextMenu={onNodeContextMenu}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            minZoom={0.2}
            maxZoom={1.8}
            proOptions={{ hideAttribution: true }}
            className="bg-muted/10"
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1.2} color="currentColor" className="text-muted-foreground/15" />
            <Controls className="!bg-card/90 !border-border/70 !shadow-md !rounded-xl overflow-hidden !left-4 !bottom-4" />
            <MiniMap zoomable pannable className="!bg-card/90 !border-border/70 !shadow-md !rounded-xl hidden sm:block !right-4 !bottom-4" />
          </ReactFlow>

          {/* ── Custom In-Canvas Context Menu (Right Click) ── */}
          {contextMenu.isOpen && (
            <div
              style={{
                position: "fixed",
                left: Math.min(contextMenu.x, typeof window !== "undefined" ? window.innerWidth - 220 : 500),
                top: Math.min(contextMenu.y, typeof window !== "undefined" ? window.innerHeight - 340 : 500),
              }}
              onClick={(e) => e.stopPropagation()}
              className="z-50 w-52 bg-card/95 backdrop-blur-xl border border-border/80 shadow-2xl rounded-xl p-1.5 space-y-1 text-xs select-none animate-in fade-in zoom-in-95 duration-100"
            >
              {contextMenu.targetNodeId ? (
                <>
                  <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Node Actions
                  </div>
                  <button
                    onClick={() => {
                      handleDuplicateSelection();
                      setContextMenu((prev) => ({ ...prev, isOpen: false }));
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-muted font-medium text-left cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Copy className="w-3.5 h-3.5 text-primary" /> Duplicate
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">⌘D</span>
                  </button>
                  <button
                    onClick={() => {
                      handleCopy();
                      setContextMenu((prev) => ({ ...prev, isOpen: false }));
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-muted font-medium text-left cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">⌘C</span>
                  </button>
                  <button
                    onClick={() => {
                      handleGroupSelected();
                      setContextMenu((prev) => ({ ...prev, isOpen: false }));
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted font-medium text-left cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-primary" /> Group Selection
                  </button>

                  <div className="h-px bg-border/60 my-1" />

                  <button
                    onClick={() => {
                      handleDeleteNode();
                      setContextMenu((prev) => ({ ...prev, isOpen: false }));
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 font-medium text-left cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </span>
                    <span className="text-[10px] font-mono">Del</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Insert Component
                  </div>
                  <button
                    onClick={() => handleContextMenuAddNode("topic", "New Topic")}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted font-medium text-left cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 text-amber-500" /> Topic
                  </button>
                  <button
                    onClick={() => handleContextMenuAddNode("subtopic", "Subtopic 1")}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted font-medium text-left cursor-pointer"
                  >
                    <GitBranch className="w-3.5 h-3.5 text-blue-500" /> Subtopic
                  </button>
                  <button
                    onClick={() => handleContextMenuAddNode("button", "Prompt Engineering Roadmap")}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted font-medium text-left cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5 text-blue-600" /> Roadmap Link Button
                  </button>
                  <button
                    onClick={() => handleContextMenuAddNode("paragraph", "New note...")}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted font-medium text-left cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-purple-500" /> Paragraph Note
                  </button>
                  <button
                    onClick={() => handleContextMenuAddNode("checklist", "Checklist")}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted font-medium text-left cursor-pointer"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-500" /> Checklist Card
                  </button>
                  <button
                    onClick={() => handleContextMenuAddNode("section", "Section Container")}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted font-medium text-left cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-primary" /> Section Box
                  </button>
                  <button
                    onClick={() => handleContextMenuAddNode("button", "Resource Link")}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted font-medium text-left cursor-pointer"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-cyan-500" /> Resource Button
                  </button>

                  <div className="h-px bg-border/60 my-1" />

                  <button
                    onClick={() => {
                      handlePaste();
                      setContextMenu((prev) => ({ ...prev, isOpen: false }));
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-muted font-medium text-left cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Copy className="w-3.5 h-3.5" /> Paste
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">⌘V</span>
                  </button>
                  <button
                    onClick={() => {
                      handleSelectAll();
                      setContextMenu((prev) => ({ ...prev, isOpen: false }));
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-muted font-medium text-left cursor-pointer"
                  >
                    <span>Select All</span>
                    <span className="text-[10px] text-muted-foreground font-mono">⌘A</span>
                  </button>
                  <button
                    onClick={() => {
                      fitView({ duration: 400 });
                      setContextMenu((prev) => ({ ...prev, isOpen: false }));
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-muted font-medium text-left cursor-pointer"
                  >
                    <span>Fit View</span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── Multi-Select Action Popup Toolbar ── */}
          {selectedNodes.length >= 2 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-card/95 backdrop-blur-md border border-border/80 shadow-2xl rounded-2xl p-1.5 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="px-2.5 py-1 bg-primary/10 text-primary text-[11px] font-bold rounded-lg flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5" />
                <span>{selectedNodes.length} Selected</span>
              </div>

              <div className="h-4 w-px bg-border/60 mx-0.5" />

              {/* Group / Ungroup Fixed Items Button */}
              {isAlreadyGrouped ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleUngroupSelected}
                  className="h-7 px-2.5 text-xs font-semibold gap-1.5 hover:bg-muted text-muted-foreground rounded-lg cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-500" />
                  <span>Ungroup</span>
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleGroupSelected}
                  className="h-7 px-2.5 text-xs font-semibold gap-1.5 hover:bg-primary/10 hover:text-primary rounded-lg cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-primary" />
                  <span>Group Selection</span>
                </Button>
              )}

              {/* Align Vertically */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleAlignSelectedVertically}
                title="Align Vertically (Center X)"
                className="h-7 px-2 text-xs font-semibold gap-1 hover:bg-muted rounded-lg cursor-pointer"
              >
                <Move className="w-3.5 h-3.5" />
                <span>Align X</span>
              </Button>

              {/* Align Horizontally */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleAlignSelectedHorizontally}
                title="Align Horizontally (Center Y)"
                className="h-7 px-2 text-xs font-semibold gap-1 hover:bg-muted rounded-lg cursor-pointer"
              >
                <Move className="w-3.5 h-3.5 rotate-90" />
                <span>Align Y</span>
              </Button>

              <div className="h-4 w-px bg-border/60 mx-0.5" />

              {/* Batch Delete */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDeleteSelected}
                className="h-7 px-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 rounded-lg gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete ({selectedNodes.length})</span>
              </Button>
            </div>
          )}
        </div>

        {/* ── 4. Slide-Over Right Inspector Sidebar (Opens on selection, hidden otherwise) ── */}
        {(selectedNode || selectedNodes.length > 0) && (
          <>
            {/* Animated backdrop when markdown is expanded to 75% display */}
            {isMarkdownExpanded && (
              <div
                onClick={() => setIsMarkdownExpanded(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-xs z-45 animate-in fade-in duration-200"
              />
            )}

            <div
              className={cn(
                "border-l border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl flex flex-col shrink-0 overflow-hidden transition-all duration-300 ease-out animate-in slide-in-from-right",
                isMarkdownExpanded
                  ? "fixed top-0 right-0 bottom-0 h-screen w-[75vw] max-w-[75vw] z-50 ring-1 ring-primary/40 shadow-2xl"
                  : "absolute right-0 top-0 bottom-0 w-80 sm:w-96 md:w-[420px] z-40"
              )}
            >
              {/* ── Fixed Header ── */}
              <div className="p-4 border-b border-border/60 bg-background/95 backdrop-blur-sm space-y-3 shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider">
                      {selectedNodes.length > 1
                        ? `${selectedNodes.length} Selected`
                        : selectedNode?.type || "Node"}
                    </Badge>
                    {selectedNode && (selectedNode.data as any).colorKey && (
                      <Badge variant="secondary" className="text-[10px] uppercase font-bold font-mono">
                        Theme {(selectedNode.data as any).colorKey}
                      </Badge>
                    )}
                    {isMarkdownExpanded && (
                      <Badge className="bg-primary/20 text-primary hover:bg-primary/30 text-[10px] uppercase font-mono">
                        75% Editor View
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {/* 75% Display Width Toggle Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsMarkdownExpanded((prev) => !prev)}
                      className={cn(
                        "h-7 px-2 text-xs rounded-lg cursor-pointer gap-1 transition-colors",
                        isMarkdownExpanded
                          ? "bg-primary/15 text-primary hover:bg-primary/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                      title={
                        isMarkdownExpanded
                          ? "Collapse Markdown view (400px)"
                          : "Expand Markdown section to 75% display"
                      }
                    >
                      {isMarkdownExpanded ? (
                        <>
                          <Minimize2 className="w-3.5 h-3.5" />
                          <span className="text-[10px] hidden sm:inline font-mono">Collapse</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-3.5 h-3.5 text-primary" />
                          <span className="text-[10px] hidden sm:inline font-mono">75% Screen</span>
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedNodeId(null);
                        setIsMarkdownExpanded(false);
                        setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
                      }}
                      className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Close Inspector"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

              <div>
                <h3 className="text-base font-bold tracking-tight text-foreground truncate">
                  {selectedNodes.length > 1
                    ? `Batch Editing (${selectedNodes.length} items)`
                    : (selectedNode?.data as any)?.label || "Node Details"}
                </h3>
              </div>

              {/* Dual Tabs Switcher */}
              <div className="grid grid-cols-2 p-1 bg-muted/60 rounded-xl border border-border/40">
                <button
                  type="button"
                  onClick={() => setActiveTab("properties")}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === "properties"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Properties
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("content")}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === "content"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Content & Links
                </button>
              </div>
            </div>

            {/* ── Scrollable Body with Lenis Scroll Isolation ── */}
            <div
              data-lenis-prevent
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-4 text-xs select-text"
              onWheel={(e) => e.stopPropagation()}
              onTouchMoveCapture={(e) => e.stopPropagation()}
            >
              {selectedNode ? (
                activeTab === "properties" ? (
                  /* ── TAB 1: PROPERTIES ── */
                  <div className="space-y-4">
                    {/* Multi-Edit Banner */}
                    {selectedNodes.length > 1 && (
                      <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/30 text-[11px] font-bold text-primary flex items-center gap-2">
                        <CheckSquare className="w-4 h-4" />
                        <span>Editing {selectedNodes.length} Selected Nodes in Batch</span>
                      </div>
                    )}

                    {/* LABEL Input */}
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                        {selectedNodes.length > 1 ? "Batch Label (or keep unique)" : "Label"}
                      </Label>
                      <Input
                        value={(selectedNode.data as any).label || ""}
                        onChange={(e) => updateSelectedNodeData({ label: e.target.value })}
                        placeholder="Type label text..."
                        className="h-8 text-xs font-semibold"
                      />
                    </div>

                    {/* TYPE Selector */}
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                        Type {selectedNodes.length > 1 && "(Applies to All Selected)"}
                      </Label>
                      <Select
                        value={selectedNode.type || "topic"}
                        onValueChange={(val: any) => updateSelectedNodeType(val)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="topic">Topic (Main Milestone)</SelectItem>
                          <SelectItem value="subtopic">Subtopic (Child Node)</SelectItem>
                          <SelectItem value="button">Roadmap Link Button (Blue)</SelectItem>
                          <SelectItem value="title">Title Heading</SelectItem>
                          <SelectItem value="paragraph">Paragraph Card</SelectItem>
                          <SelectItem value="section">Section Container</SelectItem>
                          <SelectItem value="links">Curated Links</SelectItem>
                          <SelectItem value="checklist">Checklist Card</SelectItem>
                          <SelectItem value="milestone">Milestone Box</SelectItem>
                          <SelectItem value="branch">Branch Node</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* ROADMAP REDIRECT CONFIGURATION (When button type is selected) */}
                    {selectedNode.type === "button" && (
                      <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-[11px] font-bold uppercase text-blue-600 dark:text-blue-400 tracking-wider flex items-center gap-1.5">
                            <Compass className="w-3.5 h-3.5" />
                            <span>Roadmap Redirect Target</span>
                          </Label>
                          {(selectedNode.data as any).targetRoadmapSlug && (
                            <a
                              href={`/dashboard/roadmaps/${(selectedNode.data as any).targetRoadmapSlug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 font-bold"
                            >
                              <span>Test Link</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        {/* System Roadmap Dropdown Selector */}
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground font-semibold">
                            Select Roadmap from System:
                          </Label>
                          <Select
                            value={(selectedNode.data as any).targetRoadmapSlug || "custom"}
                            onValueChange={(val) => {
                              if (val === "custom") {
                                updateSelectedNodeData({
                                  targetRoadmapSlug: undefined,
                                });
                              } else {
                                const matched = availableRoadmaps.find((r) => r.slug === val);
                                const currentLabel = (selectedNode.data as any).label || "";
                                const shouldUpdateLabel =
                                  !currentLabel ||
                                  currentLabel === "Resource Button" ||
                                  currentLabel === "Learn More" ||
                                  currentLabel === "Roadmap Link" ||
                                  currentLabel === "Related Roadmap" ||
                                  currentLabel === "Prompt Engineering Roadmap" ||
                                  currentLabel.endsWith("Roadmap");

                                updateSelectedNodeData({
                                  targetRoadmapSlug: val,
                                  url: `/dashboard/roadmaps/${val}`,
                                  ...(shouldUpdateLabel && matched ? { label: matched.title } : {}),
                                });
                              }
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs bg-background">
                              <SelectValue placeholder="Choose a Roadmap..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="custom">-- Custom / External URL --</SelectItem>
                              {availableRoadmaps.map((r) => (
                                <SelectItem key={r.id} value={r.slug}>
                                  {r.title} {r.category ? `(${r.category})` : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Direct URL Path Input */}
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground font-semibold">
                            Target URL / Path:
                          </Label>
                          <Input
                            value={
                              (selectedNode.data as any).targetRoadmapSlug
                                ? `/dashboard/roadmaps/${(selectedNode.data as any).targetRoadmapSlug}`
                                : (selectedNode.data as any).url || ""
                            }
                            onChange={(e) => {
                              const v = e.target.value;
                              if (v.startsWith("/dashboard/roadmaps/")) {
                                const slug = v.replace("/dashboard/roadmaps/", "");
                                updateSelectedNodeData({ targetRoadmapSlug: slug, url: v });
                              } else {
                                updateSelectedNodeData({ url: v, targetRoadmapSlug: undefined });
                              }
                            }}
                            placeholder="/dashboard/roadmaps/prompt-engineering or https://..."
                            className="h-7 text-xs bg-background"
                          />
                        </div>
                      </div>
                    )}

                    {/* Coordinates */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded-xl bg-muted/40 font-mono">
                      <div>X: {Math.round(selectedNode.position.x)}</div>
                      <div>Y: {Math.round(selectedNode.position.y)}</div>
                    </div>

                    {/* FONT SIZE */}
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                        Font Size
                      </Label>
                      <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl">
                        {["S", "M", "L", "XL", "XXL"].map((sz) => {
                          const isSelected = ((selectedNode.data as any).fontSize || "M") === sz;
                          return (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => updateSelectedNodeData({ fontSize: sz })}
                              className={`flex-1 py-1 text-[10px] font-bold rounded-lg ${
                                isSelected
                                  ? "bg-primary text-primary-foreground shadow-xs"
                                  : "hover:bg-muted text-muted-foreground"
                              }`}
                            >
                              {sz}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* NODE COLOR (roadmap.sh color palette A-H) */}
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                        Node Color
                      </Label>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(PALETTE_COLORS).map(([key, style]) => {
                          const isSelected = ((selectedNode.data as any).colorKey || "B") === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => updateSelectedNodeData({ colorKey: key })}
                              className={`w-7 h-7 rounded-md border-2 font-bold text-xs flex items-center justify-center transition-all ${
                                style.bg
                              } ${style.border} ${
                                isSelected
                                  ? "ring-2 ring-blue-500 scale-110 shadow-md"
                                  : "opacity-85 hover:opacity-100"
                              }`}
                            >
                              {key}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* CHECKLIST ITEMS & DRAG-AND-DROP REORDERING */}
                    {(selectedNode.type === "checklist" ||
                      ((selectedNode.data as any).checklistItems &&
                        (selectedNode.data as any).checklistItems.length > 0)) && (
                      <div className="space-y-2 pt-2 border-t border-border/60">
                        <div className="flex items-center justify-between">
                          <Label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                            <CheckSquare className="w-3.5 h-3.5 text-primary" />
                            <span>Checklist Tasks (Drag to Reorder)</span>
                          </Label>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleAddChecklistItem}
                            className="h-6 text-[10px] text-primary gap-1 p-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            Add Task
                          </Button>
                        </div>

                        <div className="space-y-1.5">
                          {(((selectedNode.data as any).checklistItems as any[]) || []).map(
                            (item, idx) => (
                              <div
                                key={item.id}
                                draggable
                                onDragStart={(e) => handleTaskDragStart(e, idx)}
                                onDragOver={handleTaskDragOver}
                                onDrop={(e) => handleTaskDrop(e, idx)}
                                onDragEnd={handleTaskDragEnd}
                                className={`flex items-center gap-1.5 p-1.5 rounded-lg border bg-muted/30 transition-all ${
                                  draggedTaskIndex === idx
                                    ? "opacity-40 border-dashed border-primary"
                                    : "border-border/60 hover:border-primary/40"
                                }`}
                              >
                                <div
                                  title="Drag to reorder"
                                  className="cursor-grab active:cursor-grabbing p-0.5 text-muted-foreground/60 hover:text-foreground shrink-0"
                                >
                                  <GripVertical className="w-3.5 h-3.5" />
                                </div>

                                <input
                                  type="checkbox"
                                  checked={item.completed}
                                  onChange={(e) =>
                                    handleUpdateChecklistItem(item.id, {
                                      completed: e.target.checked,
                                    })
                                  }
                                  className="w-3.5 h-3.5 rounded border-border text-primary cursor-pointer accent-primary shrink-0"
                                />

                                <Input
                                  value={item.text}
                                  onChange={(e) =>
                                    handleUpdateChecklistItem(item.id, { text: e.target.value })
                                  }
                                  placeholder="Task description..."
                                  className="h-7 text-xs flex-1"
                                />

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveChecklistItem(item.id)}
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-rose-500 shrink-0 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* 1-CLICK ADD SUBTOPIC */}
                    <div className="space-y-2 pt-2 border-t border-border/60">
                      <Label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                        Add Subtopic (Child Node)
                      </Label>
                      <div className="grid grid-cols-4 gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={() => handleAddChildSubtopic("top")}
                          className="h-8 text-xs p-0 flex items-center justify-center hover:bg-primary/10 cursor-pointer"
                          title="Add child subtopic above"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={() => handleAddChildSubtopic("bottom")}
                          className="h-8 text-xs p-0 flex items-center justify-center hover:bg-primary/10 cursor-pointer"
                          title="Add child subtopic below"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={() => handleAddChildSubtopic("left")}
                          className="h-8 text-xs p-0 flex items-center justify-center hover:bg-primary/10 cursor-pointer"
                          title="Add child subtopic to the left"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={() => handleAddChildSubtopic("right")}
                          className="h-8 text-xs p-0 flex items-center justify-center hover:bg-primary/10 cursor-pointer"
                          title="Add child subtopic to the right"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Delete Node Action */}
                    <div className="pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDeleteNode}
                        className="w-full h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 text-xs gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Component
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* ── TAB 2: CONTENT & LINKS ── */
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                        Title
                      </Label>
                      <Input
                        value={(selectedNode.data as any).label || ""}
                        onChange={(e) => updateSelectedNodeData({ label: e.target.value })}
                        placeholder="Enter Title"
                        className="h-8 text-xs font-semibold"
                      />
                    </div>

                    {/* Markdown Editor for Article / Overview & Key Concepts */}
                    <div className="space-y-1.5">
                      <MarkdownEditor
                        value={(selectedNode.data as any).description || ""}
                        onChange={(val) => updateSelectedNodeData({ description: val })}
                        placeholder="Write detailed explanation, key concepts, code examples, lists, or articles in Markdown..."
                        isExpanded={isMarkdownExpanded}
                        onToggleExpand={() => setIsMarkdownExpanded((prev) => !prev)}
                        label="Overview & Key Concepts (Markdown Article)"
                      />
                    </div>

                    {/* Checklist Tasks Section */}
                    {(selectedNode.type === "checklist" ||
                      ((selectedNode.data as any).checklistItems &&
                        (selectedNode.data as any).checklistItems.length > 0)) && (
                      <div className="space-y-2 pt-2 border-t border-border/60">
                        <div className="flex items-center justify-between">
                          <Label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                            <CheckSquare className="w-3.5 h-3.5 text-primary" />
                            <span>Checklist Tasks (Drag to Reorder)</span>
                          </Label>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleAddChecklistItem}
                            className="h-6 text-[10px] text-primary gap-1 p-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            Add Task
                          </Button>
                        </div>

                        <div className="space-y-1.5">
                          {(((selectedNode.data as any).checklistItems as any[]) || []).map(
                            (item, idx) => (
                              <div
                                key={item.id}
                                draggable
                                onDragStart={(e) => handleTaskDragStart(e, idx)}
                                onDragOver={handleTaskDragOver}
                                onDrop={(e) => handleTaskDrop(e, idx)}
                                onDragEnd={handleTaskDragEnd}
                                className={`flex items-center gap-1.5 p-1.5 rounded-lg border bg-muted/30 transition-all ${
                                  draggedTaskIndex === idx
                                    ? "opacity-40 border-dashed border-primary"
                                    : "border-border/60 hover:border-primary/40"
                                }`}
                              >
                                <div
                                  title="Drag to reorder"
                                  className="cursor-grab active:cursor-grabbing p-0.5 text-muted-foreground/60 hover:text-foreground shrink-0"
                                >
                                  <GripVertical className="w-3.5 h-3.5" />
                                </div>

                                <input
                                  type="checkbox"
                                  checked={item.completed}
                                  onChange={(e) =>
                                    handleUpdateChecklistItem(item.id, {
                                      completed: e.target.checked,
                                    })
                                  }
                                  className="w-3.5 h-3.5 rounded border-border text-primary cursor-pointer accent-primary shrink-0"
                                />
                                <Input
                                  value={item.text}
                                  onChange={(e) =>
                                    handleUpdateChecklistItem(item.id, {
                                      text: e.target.value,
                                    })
                                  }
                                  placeholder="Task description..."
                                  className="h-7 text-xs flex-1"
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveChecklistItem(item.id)}
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-rose-500 shrink-0 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Resources Links */}
                    <div className="space-y-2 pt-2 border-t border-border/60">
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                          Curated Links
                        </Label>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleAddResource}
                          className="h-6 text-[10px] text-primary gap-1 p-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          Add Link
                        </Button>
                      </div>

                      {((selectedNode.data as any).resources || []).map(
                        (res: RoadmapResource) => (
                          <div
                            key={res.id}
                            className="p-2.5 rounded-xl border border-border/60 bg-muted/30 space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <Input
                                value={res.title}
                                onChange={(e) =>
                                  handleUpdateResource(res.id, { title: e.target.value })
                                }
                                placeholder="Resource title"
                                className="h-7 text-[11px]"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveResource(res.id)}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-rose-500 shrink-0 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>

                            <Input
                              value={res.url}
                              onChange={(e) =>
                                handleUpdateResource(res.id, { url: e.target.value })
                              }
                              placeholder="https://..."
                              className="h-7 text-[10px] font-mono"
                            />

                            <Select
                              value={res.type}
                              onValueChange={(val: any) =>
                                handleUpdateResource(res.id, { type: val })
                              }
                            >
                              <SelectTrigger className="h-6 text-[10px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="docs">Official Docs</SelectItem>
                                <SelectItem value="article">Article / Tutorial</SelectItem>
                                <SelectItem value="video">Video Tutorial</SelectItem>
                                <SelectItem value="course">Course</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )
              ) : null}
            </div>
            </div>
          </>
        )}
      </div>

      {/* ── Mermaid.js to Roadmap Generator Modal ── */}
      <MermaidImportModal
        isOpen={isMermaidModalOpen}
        onOpenChange={setIsMermaidModalOpen}
        onApply={handleApplyMermaidRoadmap}
        currentNodesCount={nodes.length}
      />
    </div>
  );
}

export function AdminStudioEditor(props: AdminStudioEditorProps) {
  return (
    <ReactFlowProvider>
      <AdminStudioEditorInternal {...props} />
    </ReactFlowProvider>
  );
}
