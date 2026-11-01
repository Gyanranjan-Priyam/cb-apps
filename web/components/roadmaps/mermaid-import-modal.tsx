/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  GitBranch,
  Layers,
  Copy,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Code2,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  parseMermaidToRoadmap,
  MERMAID_ROADMAP_TEMPLATES,
} from "@/lib/roadmaps/mermaid-parser";
import type { RoadmapGraphNode, RoadmapGraphEdge } from "@/lib/roadmaps/types";

interface MermaidImportModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (
    nodes: RoadmapGraphNode[],
    edges: RoadmapGraphEdge[],
    mode: "replace" | "append"
  ) => void;
  currentNodesCount?: number;
}

export function MermaidImportModal({
  isOpen,
  onOpenChange,
  onApply,
  currentNodesCount = 0,
}: MermaidImportModalProps) {
  const [code, setCode] = useState(MERMAID_ROADMAP_TEMPLATES[0].code);
  const [selectedTemplate, setSelectedTemplate] = useState("0");
  const [direction, setDirection] = useState<"auto" | "TB" | "LR">("auto");
  const [spacing, setSpacing] = useState<"compact" | "normal" | "spacious">("normal");
  const [importMode, setImportMode] = useState<"replace" | "append">("replace");

  // Realtime parse analysis
  const parseResult = useMemo(() => {
    try {
      return parseMermaidToRoadmap(code, {
        direction: direction === "auto" ? undefined : direction,
        spacing,
      });
    } catch (err: any) {
      return {
        nodes: [],
        edges: [],
        direction: "TB" as const,
        subgraphs: [],
        rawError: err.message || "Invalid syntax",
      };
    }
  }, [code, direction, spacing]);

  const handleSelectTemplate = (val: string) => {
    setSelectedTemplate(val);
    const idx = parseInt(val, 10);
    if (!isNaN(idx) && MERMAID_ROADMAP_TEMPLATES[idx]) {
      setCode(MERMAID_ROADMAP_TEMPLATES[idx].code);
      toast.success(`Loaded "${MERMAID_ROADMAP_TEMPLATES[idx].title}" template`);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success("Copied Mermaid code to clipboard");
  };

  const handleDownloadCode = () => {
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "roadmap-flowchart.mmd";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded roadmap-flowchart.mmd");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setCode(content);
        toast.success(`Loaded file: ${file.name}`);
      }
    };
    reader.readAsText(file);
  };

  const handleApplyToCanvas = () => {
    if (!parseResult || parseResult.nodes.length === 0) {
      toast.error("No valid nodes found in the Mermaid code.");
      return;
    }

    onApply(parseResult.nodes, parseResult.edges, importMode);
    toast.success(
      `Converted & generated ${parseResult.nodes.length} roadmap nodes and ${parseResult.edges.length} connections!`
    );
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange} modal>
      <SheetContent
        side="right"
        className="w-full sm:w-[40vw] sm:max-w-[40vw] lg:w-[40vw] lg:max-w-[40vw] p-0 flex h-dvh max-h-screen flex-col overflow-hidden bg-background border-l shadow-2xl z-50 font-mono"
      >
        {/* ── 1. Sticky Drawer Header ── */}
        <div className="shrink-0 border-b bg-background px-6 pt-6 pb-4">
          <SheetHeader className="p-0 text-left space-y-1.5 pr-8">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <SheetTitle className="text-base font-bold flex items-center gap-2">
                  Mermaid.js Roadmap Editor
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  Paste or edit Mermaid code to generate roadmap nodes automatically.
                </SheetDescription>
              </div>
            </div>

            {/* Realtime Stats Badges */}
            <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
              <Badge
                variant="outline"
                className={`text-[10px] font-mono ${
                  parseResult.nodes.length > 0
                    ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/5"
                    : "text-muted-foreground border-border"
                }`}
              >
                <Layers className="w-3 h-3 mr-1" />
                {parseResult.nodes.length} Nodes
              </Badge>

              <Badge
                variant="outline"
                className={`text-[10px] font-mono ${
                  parseResult.edges.length > 0
                    ? "text-blue-400 border-blue-500/30 bg-blue-500/5"
                    : "text-muted-foreground border-border"
                }`}
              >
                <GitBranch className="w-3 h-3 mr-1" />
                {parseResult.edges.length} Edges
              </Badge>

              {parseResult.subgraphs.length > 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono text-purple-400 border-purple-500/30 bg-purple-500/5"
                >
                  {parseResult.subgraphs.length} Tracks
                </Badge>
              )}

              <Badge variant="outline" className="text-[10px] font-mono text-amber-400 border-amber-500/30 bg-amber-500/5">
                Direction: {parseResult.direction}
              </Badge>
            </div>
          </SheetHeader>
        </div>

        {/* ── 2. Sticky Toolbar Controls ── */}
        <div className="shrink-0 border-b bg-muted/30 px-6 py-3 space-y-2.5 text-xs">
          {/* Preset Selector */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-muted-foreground shrink-0">Preset:</span>
            <Select value={selectedTemplate} onValueChange={handleSelectTemplate}>
              <SelectTrigger className="h-7 text-xs font-mono flex-1">
                <SelectValue placeholder="Choose a template..." />
              </SelectTrigger>
              <SelectContent className="font-mono text-xs">
                {MERMAID_ROADMAP_TEMPLATES.map((tmpl, idx) => (
                  <SelectItem key={idx} value={String(idx)}>
                    {tmpl.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <label className="cursor-pointer shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] font-mono gap-1 text-muted-foreground pointer-events-none px-2"
              >
                <UploadCloud className="w-3 h-3" />
                Upload
              </Button>
              <input type="file" accept=".mmd,.mermaid,.txt" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground block">Direction</span>
              <Select value={direction} onValueChange={(val: any) => setDirection(val)}>
                <SelectTrigger className="h-7 text-xs font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="font-mono text-xs">
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="TB">Top-Down</SelectItem>
                  <SelectItem value="LR">Left-Right</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground block">Spacing</span>
              <Select value={spacing} onValueChange={(val: any) => setSpacing(val)}>
                <SelectTrigger className="h-7 text-xs font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="font-mono text-xs">
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="spacious">Spacious</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground block">Canvas Mode</span>
              <Select value={importMode} onValueChange={(val: any) => setImportMode(val)}>
                <SelectTrigger className="h-7 text-xs font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="font-mono text-xs">
                  <SelectItem value="replace">Replace Canvas</SelectItem>
                  <SelectItem value="append">Append Below</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* ── 3. Scrollable Editor Area ── */}
        <div
          data-lenis-prevent
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4 space-y-4 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          onWheel={(e) => e.stopPropagation()}
          onTouchMoveCapture={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-primary" />
              Mermaid Source Code
            </span>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyCode}
                className="h-6 text-[10px] font-mono gap-1 text-muted-foreground hover:text-foreground px-2 cursor-pointer"
                title="Copy code"
              >
                <Copy className="w-3 h-3" />
                Copy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadCode}
                className="h-6 text-[10px] font-mono gap-1 text-muted-foreground hover:text-foreground px-2 cursor-pointer"
                title="Download .mmd file"
              >
                <Download className="w-3 h-3" />
                .mmd
              </Button>
            </div>
          </div>

          {/* Full Height Textarea Code Editor */}
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="flowchart TB&#10;    Start((Start)):::gold --> A[Frontend Basics]:::emerald&#10;    A --> B[React.js & Next.js]:::blue&#10;    B --> C[(PostgreSQL DB)]:::indigo"
            className="w-full min-h-[380px] rounded-lg border border-input bg-card p-3.5 text-xs font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary resize-y shadow-2xs scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            spellCheck={false}
          />

          {/* Syntax Status */}
          {parseResult.rawError ? (
            <div className="p-2.5 rounded-lg border border-rose-500/30 bg-rose-500/5 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span className="text-[11px]">{parseResult.rawError}</span>
            </div>
          ) : parseResult.nodes.length > 0 ? (
            <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-[11px] font-bold">
                  {parseResult.nodes.length} nodes & {parseResult.edges.length} connections ready
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {importMode === "replace" ? "Replaces canvas" : `Appends below ${currentNodesCount} nodes`}
              </span>
            </div>
          ) : null}

          {/* ── 4. Quick Mermaid Syntax & Shape Guide ── */}
          <div className="rounded-lg border border-border/60 bg-muted/20 p-3.5 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-foreground text-[11px]">
              <Info className="w-3.5 h-3.5 text-primary" />
              Syntax & Shape Cheatsheet
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[10px] text-muted-foreground font-mono">
              <div className="bg-background p-2 rounded border border-border/50">
                <code className="text-primary font-bold">id[Topic Title]</code>
                <span className="block text-foreground mt-0.5">Rectangle Topic Card</span>
              </div>

              <div className="bg-background p-2 rounded border border-border/50">
                <code className="text-primary font-bold">id(Subtopic Title)</code>
                <span className="block text-foreground mt-0.5">Pill / Subtopic Node</span>
              </div>

              <div className="bg-background p-2 rounded border border-border/50">
                <code className="text-primary font-bold">id((Milestone))</code>
                <span className="block text-foreground mt-0.5">Circle Milestone Node</span>
              </div>

              <div className="bg-background p-2 rounded border border-border/50">
                <code className="text-primary font-bold">id[(Database DB)]</code>
                <span className="block text-foreground mt-0.5">Cylinder Storage Node</span>
              </div>

              <div className="bg-background p-2 rounded border border-border/50">
                <code className="text-primary font-bold">id[[Task Item]]</code>
                <span className="block text-foreground mt-0.5">Checklist / Subroutine</span>
              </div>

              <div className="bg-background p-2 rounded border border-border/50">
                <code className="text-primary font-bold">A:::gold, A:::blue</code>
                <span className="block text-foreground mt-0.5">Theme Palette Color</span>
              </div>

              <div className="bg-background p-2 rounded border border-border/50 col-span-2">
                <code className="text-primary font-bold">subgraph TrackName ... end</code>
                <span className="block text-foreground mt-0.5">Grouped Roadmap Track Section</span>
              </div>

              <div className="bg-background p-2 rounded border border-border/50 col-span-2">
                <code className="text-primary font-bold">click NodeId &quot;https://...&quot; &quot;Docs&quot;</code>
                <span className="block text-foreground mt-0.5">Auto-attaches documentation & reference links</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 5. Sticky Drawer Footer ── */}
        <div className="shrink-0 border-t bg-background px-6 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs cursor-pointer flex-1"
            >
              Cancel
            </Button>

            <Button
              size="sm"
              onClick={handleApplyToCanvas}
              disabled={!parseResult || parseResult.nodes.length === 0}
              className="h-9 text-xs font-mono gap-1.5 px-4 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer flex-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Convert & Apply to Canvas ({parseResult?.nodes.length || 0} Nodes)
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
