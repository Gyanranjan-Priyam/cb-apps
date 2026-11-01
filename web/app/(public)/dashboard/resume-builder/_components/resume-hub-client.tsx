"use client";

import { useState } from "react";
import {
  FileText,
  Plus,
  Code2,
  Palette,
  Sparkles,
  ShieldCheck,
  Calendar,
  Copy,
  Trash2,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TemplateSelectorModal } from "@/components/resume-builder/template-selector-modal";
import { createResume, deleteResume, duplicateResume, type ResumeSummaryItem } from "../actions";
import { RESUME_TEMPLATES } from "@/lib/resume/templates";
import type { ResumeTemplate } from "@/lib/resume/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

interface ResumeHubClientProps {
  initialResumes: ResumeSummaryItem[];
}

export function ResumeHubClient({ initialResumes }: ResumeHubClientProps) {
  const router = useRouter();
  const [resumes, setResumes] = useState<ResumeSummaryItem[]>(initialResumes);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateResume = async (
    template: ResumeTemplate,
    mode: "latex" | "visual",
    title: string
  ) => {
    setIsCreating(true);
    try {
      const newResume = await createResume({
        title,
        templateId: template.id,
        mode,
      });
      setIsTemplateModalOpen(false);
      toast.success("Resume created! Opening studio...");
      router.push(`/dashboard/resume-builder/${newResume.id}`);
    } catch (err) {
      toast.error("Failed to create resume");
      console.error("Create error:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const copy = await duplicateResume(id);
      setResumes((prev) => [
        {
          id: copy.id,
          title: copy.title,
          mode: (copy.mode === "latex" ? "latex" : "visual") as "latex" | "visual",
          templateId: copy.templateId,
          targetRole: copy.targetRole,
          atsScore: copy.atsScore,
          createdAt: copy.createdAt.toISOString(),
          updatedAt: copy.updatedAt.toISOString(),
        },
        ...prev,
      ]);
      toast.success("Resume duplicated");
    } catch {
      toast.error("Failed to duplicate resume");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteResume(id);
      setResumes((prev) => prev.filter((r) => r.id !== id));
      toast.success("Resume deleted");
    } catch {
      toast.error("Failed to delete resume");
    }
  };

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* ── User Saved Resumes Section ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              My Saved Resumes
            </h2>
            <p className="text-xs text-muted-foreground">
              Manage, edit, and export your tailored resumes.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setIsTemplateModalOpen(true)}
            className="gap-1.5 text-xs h-8"
          >
            <Plus className="w-3.5 h-3.5" />
            New Resume
          </Button>
        </div>

        {resumes.length === 0 ? (
          <Card className="border-dashed border-2 border-border/80 shadow-none">
            <CardContent className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">No Resumes Created Yet</h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                Get started by creating your first ATS-friendly resume using our Overleaf LaTeX or Canva-style templates.
              </p>
              <Button
                size="sm"
                onClick={() => setIsTemplateModalOpen(true)}
                className="gap-1.5 text-xs mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Choose a Template & Start
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumes.map((resume) => (
              <Card
                key={resume.id}
                className="border-border/60 hover:border-primary/40 transition-all shadow-xs group flex flex-col justify-between"
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] gap-1 font-semibold ${
                        resume.mode === "latex"
                          ? "bg-slate-900 text-emerald-400 border-emerald-500/30 dark:bg-emerald-950/40"
                          : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30"
                      }`}
                    >
                      {resume.mode === "latex" ? (
                        <>
                          <Code2 className="w-3 h-3" />
                          Overleaf LaTeX
                        </>
                      ) : (
                        <>
                          <Palette className="w-3 h-3" />
                          Canva Visual
                        </>
                      )}
                    </Badge>

                    {resume.atsScore !== null && (
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        ATS {resume.atsScore}%
                      </Badge>
                    )}
                  </div>

                  <CardTitle className="text-base font-bold mt-2 truncate group-hover:text-primary transition-colors">
                    {resume.title}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Updated {new Date(resume.updatedAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-3">
                  <div className="flex items-center justify-between pt-3 border-t border-border/60">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicate(resume.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        title="Duplicate resume"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(resume.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-500"
                        title="Delete resume"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <Button size="sm" asChild className="h-8 text-xs gap-1.5">
                      <Link href={`/dashboard/resume-builder/${resume.id}`}>
                        Open Studio
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── ATS Templates Showcase Section ── */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              Featured ATS Templates
            </h2>
            <p className="text-xs text-muted-foreground">
              Battle-tested layouts used by engineers at FAANG, top startups, and universities.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {RESUME_TEMPLATES.map((tmpl) => (
            <Card
              key={tmpl.id}
              className="border-border/60 hover:border-primary/40 transition-all shadow-xs flex flex-col justify-between overflow-hidden"
            >
              <div className="h-20 bg-muted/60 p-3.5 flex flex-col justify-between border-b border-border/40">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] font-semibold bg-background">
                    {tmpl.badgeText}
                  </Badge>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                    {tmpl.defaultMode === "latex" ? "LaTeX" : "Visual & LaTeX"}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="h-1.5 w-20 bg-muted-foreground/30 rounded-full" />
                  <div className="h-1 w-32 bg-muted-foreground/20 rounded-full" />
                </div>
              </div>

              <CardContent className="p-5 space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground">{tmpl.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {tmpl.description}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCreateResume(tmpl, tmpl.defaultMode, `${tmpl.name} - Resume`)}
                  className="w-full text-xs h-8 gap-1.5 border-border/80"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Use This Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>



      {/* Template Selection Modal */}
      <TemplateSelectorModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleCreateResume}
      />
    </div>
  );
}
