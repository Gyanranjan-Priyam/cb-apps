"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Code2,
  Palette,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Layout,
  Layers,
} from "lucide-react";
import { RESUME_TEMPLATES } from "@/lib/resume/templates";
import type { ResumeTemplate } from "@/lib/resume/types";

interface TemplateSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (
    template: ResumeTemplate,
    mode: "latex" | "visual",
    title: string,
  ) => void;
}

export function TemplateSelectorModal({
  isOpen,
  onClose,
  onSelectTemplate,
}: TemplateSelectorModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate>(
    RESUME_TEMPLATES[0],
  );
  const [selectedMode, setSelectedMode] = useState<"latex" | "visual">(
    "visual",
  );
  const [resumeTitle, setResumeTitle] = useState("My Software Engineer Resume");

  const handleConfirm = () => {
    onSelectTemplate(
      selectedTemplate,
      selectedMode,
      resumeTitle || `${selectedTemplate.name} - Resume`,
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl p-0 flex flex-col h-full max-h-screen overflow-hidden bg-card border-l z-50"
      >
        {/* ── Fixed Header ── */}
        <div className="shrink-0 p-6 border-b border-border/60 bg-background/95 backdrop-blur-sm z-10">
          <SheetHeader className="p-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <SheetTitle className="text-lg sm:text-xl font-bold">
                  Choose an ATS Resume Template
                </SheetTitle>
                <SheetDescription className="text-xs sm:text-sm text-muted-foreground">
                  Select an ATS layout and start with Overleaf LaTeX or Canva
                  Visual builder.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
        </div>

        {/* ── Scrollable Body with Lenis scroll isolation ── */}
        <div
          data-lenis-prevent
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5 space-y-6 select-text"
          onWheel={(e) => e.stopPropagation()}
          onTouchMoveCapture={(e) => e.stopPropagation()}
        >
          {/* Resume Title Input */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              Resume Title / Target Role
            </Label>
            <Input
              value={resumeTitle}
              onChange={(e) => setResumeTitle(e.target.value)}
              placeholder="e.g. SDE-1 Resume 2026, Full Stack Intern, etc."
              className="text-xs sm:text-sm h-10"
            />
          </div>

          {/* Mode Switcher Banner */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2.5">
            <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" />
              Select Starting Editor Mode:
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setSelectedMode("visual")}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  selectedMode === "visual"
                    ? "border-primary bg-primary/10 shadow-xs"
                    : "border-border/60 bg-card hover:border-primary/40"
                }`}
              >
                <div className="p-2 rounded-lg bg-muted text-foreground mt-0.5 shrink-0">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-foreground block">
                    Canva Visual Mode
                  </span>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Section forms, drag-and-drop ordering, custom color
                    palettes, and typography.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setSelectedMode("latex")}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  selectedMode === "latex"
                    ? "border-primary bg-primary/10 shadow-xs"
                    : "border-border/60 bg-card hover:border-primary/40"
                }`}
              >
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5 shrink-0">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-foreground block">
                    Overleaf LaTeX Mode
                  </span>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Monaco editor with LaTeX syntax highlighting, instant AST
                    live preview, and .tex source export.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Template Gallery Grid */}
          <div className="space-y-3 pb-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5 text-primary" />
                Available ATS Templates ({RESUME_TEMPLATES.length}):
              </Label>
              <span className="text-[11px] text-muted-foreground">
                Guaranteed high ATS parseability
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {RESUME_TEMPLATES.map((tmpl) => {
                const isSelected = selectedTemplate.id === tmpl.id;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => {
                      setSelectedTemplate(tmpl);
                      if (tmpl.defaultMode) setSelectedMode(tmpl.defaultMode);
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all space-y-3 relative flex flex-col justify-between ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary"
                        : "border-border/60 bg-card hover:border-primary/40"
                    }`}
                  >
                    {/* Header Thumbnail Preview Accent */}
                    <div className="h-20 rounded-lg bg-muted/60 p-3 flex flex-col justify-between border border-border/40">
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-semibold bg-background"
                        >
                          {tmpl.badgeText}
                        </Badge>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                            <CheckCircle2 className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="h-1.5 w-16 bg-muted-foreground/30 rounded-full" />
                        <div className="h-1 w-28 bg-muted-foreground/20 rounded-full" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-foreground">
                        {tmpl.name}
                      </h4>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {tmpl.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Fixed Sticky Footer ── */}
        <div className="shrink-0 p-4 px-6 border-t border-border/60 bg-background flex items-center justify-between gap-3 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            className="gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-4 shadow-sm"
          >
            Create & Open Studio
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
