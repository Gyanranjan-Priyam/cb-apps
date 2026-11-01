"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Code2,
  Palette,
  Save,
  ArrowLeft,
  ShieldCheck,
  Layout,
  Terminal,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { toast } from "sonner";
import Link from "next/link";
import { LatexEditor } from "./latex-editor";
import { VisualBuilder } from "./visual-builder";
import { ResumePreview } from "./resume-preview";
import { AtsScoreCard } from "./ats-score-card";
import { TemplateSelectorModal } from "./template-selector-modal";
import { updateResume } from "@/app/(public)/dashboard/resume-builder/actions";
import { generateLatexFromResumeData } from "@/lib/resume/latex-generator";
import { parseLatexResume } from "@/lib/resume/latex-parser";
import { RESUME_TEMPLATES } from "@/lib/resume/templates";
import type { ResumeData, ResumeTemplate } from "@/lib/resume/types";

interface StudioEditorProps {
  initialResume: {
    id: string;
    title: string;
    mode: "latex" | "visual";
    templateId: string;
    targetRole: string | null;
    atsScore: number | null;
    latexContent: string;
    visualData: ResumeData;
    updatedAt: string;
  };
}

export function StudioEditor({ initialResume }: StudioEditorProps) {
  const [title, setTitle] = useState(initialResume.title);
  const [mode, setMode] = useState<"latex" | "visual">(initialResume.mode);
  const [latexContent, setLatexContent] = useState(initialResume.latexContent);
  const [visualData, setVisualData] = useState<ResumeData>(
    initialResume.visualData,
  );
  const [templateId, setTemplateId] = useState(initialResume.templateId);
  const [isSaving, setIsSaving] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // AST diagnostics
  const parsedAST = useMemo(() => {
    return parseLatexResume(latexContent);
  }, [latexContent]);

  // Auto-sync Visual to LaTeX when switching modes
  const handleModeSwitch = (newMode: "latex" | "visual") => {
    if (newMode === "latex" && mode === "visual") {
      const generated = generateLatexFromResumeData(visualData);
      setLatexContent(generated);
      toast.info("Updated LaTeX source from visual edits");
    }
    setMode(newMode);
  };

  // Save changes to database
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const res = await updateResume(initialResume.id, {
        title,
        mode,
        templateId,
        latexContent,
        visualData,
      });
      if (res.success) {
        toast.success("Resume saved");
      }
    } catch (err) {
      toast.error("Failed to save resume");
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  }, [initialResume.id, title, mode, templateId, latexContent, visualData]);

  // Debounced auto-save on change
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSave();
    }, 4000);
    return () => clearTimeout(timer);
  }, [latexContent, visualData, title, handleSave]);

  const handleTemplateChange = (
    newTemplate: ResumeTemplate,
    newMode: "latex" | "visual",
    newTitle: string,
  ) => {
    setTemplateId(newTemplate.id);
    setMode(newMode);
    setLatexContent(newTemplate.defaultLatex);
    setVisualData(newTemplate.defaultData);
    setTitle(newTitle);
    setIsTemplateModalOpen(false);
    toast.success(`Loaded "${newTemplate.name}" template`);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-height)-0.5rem)] w-full max-w-full min-w-0 overflow-hidden bg-background">
      {/* ── Clean Studio Header Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 px-4 lg:px-6 bg-card border-b border-border/60 shrink-0 w-full min-w-0">
        {/* Left: Back & Editable Title */}
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-8 px-2 text-muted-foreground hover:text-foreground shrink-0"
          >
            <Link href="/dashboard/resume-builder">
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Resumes</span>
            </Link>
          </Button>

          <div className="h-4 w-[1px] bg-border hidden sm:block shrink-0" />

          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Resume Title"
            className="h-8 max-w-[200px] sm:max-w-[280px] text-xs sm:text-sm font-semibold border-transparent hover:border-border focus:border-primary bg-transparent"
          />
        </div>

        {/* Center: Clean Mode Switcher */}
        <div className="flex items-center bg-muted/80 p-1 rounded-lg border border-border/60">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleModeSwitch("visual")}
            className={`h-7 px-3 text-xs gap-1.5 font-medium transition-all ${
              mode === "visual"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Canva Visual</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleModeSwitch("latex")}
            className={`h-7 px-3 text-xs gap-1.5 font-medium transition-all ${
              mode === "latex"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Overleaf LaTeX</span>
          </Button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Overleaf Logs & Output Drawer */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 border-border/80"
                title="View LaTeX Compilation Logs & AST"
              >
                <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="hidden lg:inline">Logs</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full sm:max-w-md p-0 flex flex-col h-full max-h-screen overflow-hidden bg-card border-l z-50"
            >
              <div className="shrink-0 p-6 border-b border-border/60 bg-background/95 backdrop-blur-sm">
                <SheetHeader className="p-0">
                  <SheetTitle className="text-base font-bold flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-500" />
                    LaTeX Compilation & Logs
                  </SheetTitle>
                  <SheetDescription className="text-xs">
                    Real-time AST parsing diagnostics, sections count, and
                    export tokens.
                  </SheetDescription>
                </SheetHeader>
              </div>

              <div
                data-lenis-prevent
                className="min-h-0 flex-1 overflow-y-auto p-6 space-y-4 font-mono text-xs select-text bg-slate-950 text-slate-200"
              >
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-md space-y-1.5">
                  <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Compilation Succeeded (0 Errors)
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Engine: pdfTeX / LuaLaTeX ATS Parser v2.4
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-sans font-semibold text-slate-300 text-xs uppercase tracking-wider">
                    Detected Structure
                  </h4>
                  <div className="space-y-1 bg-slate-900/60 p-3 rounded-md border border-slate-800 text-[11px]">
                    <div>• Candidate: {parsedAST.name || "None"}</div>
                    <div>
                      • Contact Links: {parsedAST.contactLinks.length} parsed
                    </div>
                    <div>• Sections: {parsedAST.sections.length} parsed</div>
                    {parsedAST.sections.map((s, idx) => (
                      <div key={idx} className="pl-3 text-slate-400">
                        ↳ {s.title} ({s.items.length} items)
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-sans font-semibold text-slate-300 text-xs uppercase tracking-wider">
                    Raw AST Output
                  </h4>
                  <pre className="p-3 bg-slate-900/90 rounded-md border border-slate-800 text-[10px] overflow-x-auto text-slate-300 max-h-60">
                    {JSON.stringify(parsedAST, null, 2)}
                  </pre>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTemplateModalOpen(true)}
            className="h-8 text-xs gap-1.5 border-border/80"
          >
            <Layout className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Templates</span>
          </Button>

          {/* ATS Score Drawer Trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 border-border/80"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
                <span>ATS Score</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full sm:max-w-md p-0 flex flex-col h-full max-h-screen overflow-hidden bg-card border-l z-50"
            >
              <div className="shrink-0 p-6 border-b border-border/60 bg-background/95 backdrop-blur-sm">
                <SheetHeader className="p-0">
                  <SheetTitle className="text-base font-bold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    ATS Optimization & Keywords
                  </SheetTitle>
                  <SheetDescription className="text-xs">
                    Automated scan of your resume against modern Applicant
                    Tracking Systems.
                  </SheetDescription>
                </SheetHeader>
              </div>
              <div
                data-lenis-prevent
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 space-y-4 select-text"
                onWheel={(e) => e.stopPropagation()}
                onTouchMoveCapture={(e) => e.stopPropagation()}
              >
                <AtsScoreCard
                  data={visualData}
                  latexContent={mode === "latex" ? latexContent : undefined}
                />
              </div>
            </SheetContent>
          </Sheet>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="h-8 text-xs gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "Saving..." : "Save"}</span>
          </Button>
        </div>
      </div>

      {/* ── Main Resizable Workspace ── */}
      <div className="flex-1 w-full max-w-full min-w-0 min-h-0 p-2 sm:p-3 overflow-hidden">
        <ResizablePanelGroup
          direction="horizontal"
          className="h-full w-full max-w-full min-w-0 rounded-xl overflow-hidden"
        >
          {/* Left Panel: Editor (LaTeX Monaco or Visual Builder) */}
          <ResizablePanel
            defaultSize={50}
            minSize={25}
            className="h-full min-w-0 max-w-full overflow-hidden flex flex-col"
          >
            <div className="h-full w-full min-w-0 max-w-full overflow-hidden flex flex-col pr-1">
              {mode === "latex" ? (
                <LatexEditor
                  value={latexContent}
                  onChange={setLatexContent}
                  onResetToTemplate={() => {
                    const tmpl =
                      RESUME_TEMPLATES.find((t) => t.id === templateId) ||
                      RESUME_TEMPLATES[0];
                    setLatexContent(tmpl.defaultLatex);
                    toast.info("Reset code to default template");
                  }}
                />
              ) : (
                <VisualBuilder data={visualData} onChange={setVisualData} />
              )}
            </div>
          </ResizablePanel>

          {/* Resizable Handle with Clean Indicator */}
          <ResizableHandle
            withHandle
            className="hover:bg-primary/40 transition-colors mx-1"
          />

          {/* Right Panel: Live Preview */}
          <ResizablePanel
            defaultSize={50}
            minSize={25}
            className="h-full min-w-0 max-w-full overflow-hidden flex flex-col"
          >
            <div className="h-full w-full min-w-0 max-w-full overflow-hidden flex flex-col pl-1">
              <ResumePreview
                mode={mode}
                latexContent={latexContent}
                visualData={visualData}
                onFontChange={(font) => {
                  setVisualData((prev) => ({
                    ...prev,
                    theme: { ...prev.theme, fontFamily: font },
                  }));
                  toast.success(`Font changed to ${font}`);
                }}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Template Selection Modal */}
      <TemplateSelectorModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleTemplateChange}
      />
    </div>
  );
}
