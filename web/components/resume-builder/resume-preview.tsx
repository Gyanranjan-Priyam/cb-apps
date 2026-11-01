"use client";

import { useRef, useState, useMemo } from "react";
import {
  Download,
  FileCode,
  ZoomIn,
  ZoomOut,
  FileText,
  Loader2,
  Mail,
  Linkedin,
  Github,
  Globe,
  Phone,
  ExternalLink,
  Type,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { parseLatexResume, type ContactLink } from "@/lib/resume/latex-parser";
import type { ResumeData, ResumeTheme } from "@/lib/resume/types";
import { cn } from "@/lib/utils";

interface ResumePreviewProps {
  mode: "latex" | "visual";
  latexContent: string;
  visualData: ResumeData;
  onFontChange?: (font: ResumeTheme["fontFamily"]) => void;
}

export function ResumePreview({
  mode,
  latexContent,
  visualData,
  onFontChange,
}: ResumePreviewProps) {
  const [zoom, setZoom] = useState(100);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isRecompiling, setIsRecompiling] = useState(false);
  const [recompileTrigger, setRecompileTrigger] = useState(0);
  const printRef = useRef<HTMLDivElement>(null);

  // Parse LaTeX content for live real-time preview
  const parsedLatex = useMemo(() => {
    if (mode === "latex") {
      return parseLatexResume(latexContent);
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, latexContent, recompileTrigger]);

  const handleRecompile = () => {
    setIsRecompiling(true);
    setTimeout(() => {
      setRecompileTrigger((c) => c + 1);
      setIsRecompiling(false);
      toast.success("Document recompiled");
    }, 200);
  };

  // Pure Vector PDF Download matching the Word DOCX precision
  const handleDirectDownloadPDF = async () => {
    setIsGeneratingPdf(true);

    try {
      const generatePromise = (async () => {
        const { generatePdfFromResume } = await import("@/lib/resume/pdf-exporter");
        const blob = await generatePdfFromResume(visualData, parsedLatex);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(visualData.personalInfo.fullName || "Resume").replace(/\s+/g, "_")}_Resume.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        return a.download;
      })();

      await toast.promise(generatePromise, {
        loading: "Generating ATS Vector PDF...",
        success: "PDF downloaded successfully",
        error: "Failed to generate PDF",
      });
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadLatex = () => {
    const blob = new Blob([latexContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${visualData.personalInfo.fullName.replace(/\s+/g, "_")}_Resume.tex`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("LaTeX source (.tex) downloaded");
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(visualData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${visualData.personalInfo.fullName.replace(/\s+/g, "_")}_Resume.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Resume JSON data downloaded");
  };

  const handleDownloadDocx = async () => {
    try {
      const docxPromise = (async () => {
        const { generateDocxFromResume } = await import("@/lib/resume/docx-exporter");
        const blob = await generateDocxFromResume(visualData, parsedLatex);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${visualData.personalInfo.fullName.replace(/\s+/g, "_")}_Resume.docx`;
        a.click();
        URL.revokeObjectURL(url);
        return a.download;
      })();

      await toast.promise(docxPromise, {
        loading: "Generating Word (.docx) document...",
        success: "Word document (.docx) downloaded",
        error: "Failed to generate DOCX file",
      });
    } catch (err) {
      console.error("DOCX export error:", err);
    }
  };

  // Font family CSS string
  const getFontFamilyStyle = (font?: string) => {
    switch (font) {
      case "Times New Roman":
        return '"Times New Roman", Times, "Latin Modern Roman", serif';
      case "Calibri":
        return 'Calibri, Aptos, "Segoe UI", Candara, sans-serif';
      case "Inter":
        return 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      case "Roboto":
        return 'Roboto, -apple-system, BlinkMacSystemFont, sans-serif';
      case "Outfit":
        return 'Outfit, sans-serif';
      case "Merriweather":
        return 'Merriweather, Georgia, serif';
      case "Playfair Display":
        return '"Playfair Display", Georgia, serif';
      case "Source Code Pro":
        return '"Source Code Pro", "Courier New", monospace';
      case "Computer Modern":
      default:
        return '"Computer Modern Serif", "Latin Modern Roman", "CMU Serif", "Times New Roman", Georgia, serif';
    }
  };

  // Icon selector helper
  const renderContactIcon = (icon?: ContactLink["icon"]) => {
    switch (icon) {
      case "email":
        return <Mail className="w-3 h-3 text-slate-700 inline mr-1" />;
      case "linkedin":
        return <Linkedin className="w-3 h-3 text-[#0a66c2] inline mr-1" />;
      case "github":
        return <Github className="w-3 h-3 text-slate-800 inline mr-1" />;
      case "globe":
        return <Globe className="w-3 h-3 text-slate-700 inline mr-1" />;
      case "phone":
        return <Phone className="w-3 h-3 text-slate-700 inline mr-1" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full w-full min-w-0 max-w-full bg-muted/20 border border-border/60 rounded-xl overflow-hidden shadow-xs">
      {/* ── Overleaf-Style Preview Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 px-3 bg-muted/50 border-b border-border/60 text-xs shrink-0 w-full min-w-0">
        <div className="flex items-center gap-2">
          {/* Overleaf Green Recompile Button */}
          <Button
            size="sm"
            onClick={handleRecompile}
            disabled={isRecompiling}
            className="h-7 px-3 text-xs gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
          >
            <RefreshCw className={cn("w-3 h-3", isRecompiling && "animate-spin")} />
            <span>Recompile</span>
          </Button>

          {/* Multiple Font Family Selector */}
          <Select
            value={visualData.theme.fontFamily || "Computer Modern"}
            onValueChange={(font) => {
              if (onFontChange) onFontChange(font as ResumeTheme["fontFamily"]);
            }}
          >
            <SelectTrigger className="h-7 w-[140px] text-xs bg-background border-border/80 gap-1.5 font-medium">
              <Type className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Font Family" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="Computer Modern">Computer Modern (LaTeX)</SelectItem>
              <SelectItem value="Times New Roman">Times New Roman</SelectItem>
              <SelectItem value="Calibri">Calibri</SelectItem>
              <SelectItem value="Inter">Inter (Clean Tech)</SelectItem>
              <SelectItem value="Roboto">Roboto</SelectItem>
              <SelectItem value="Outfit">Outfit</SelectItem>
              <SelectItem value="Merriweather">Merriweather (Serif)</SelectItem>
              <SelectItem value="Playfair Display">Playfair Display</SelectItem>
              <SelectItem value="Source Code Pro">Source Code Pro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Zoom & Export Actions */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-background rounded-md border border-border/70 p-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              disabled={zoom <= 50}
              className="h-6 w-6 p-0"
              title="Zoom out"
            >
              <ZoomOut className="w-3 h-3" />
            </Button>
            <span className="text-[10px] font-mono px-1 min-w-[36px] text-center font-medium">
              {zoom}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom((z) => Math.min(150, z + 10))}
              disabled={zoom >= 150}
              className="h-6 w-6 p-0"
              title="Zoom in"
            >
              <ZoomIn className="w-3 h-3" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={mode === "latex" ? handleDownloadLatex : handleDownloadJSON}
            className="h-7 px-2 text-xs gap-1 bg-background border-border/80"
            title={mode === "latex" ? "Download .tex source" : "Download JSON data"}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{mode === "latex" ? ".tex" : "JSON"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadDocx}
            className="h-7 px-2.5 text-xs gap-1.5 bg-background border-border/80"
            title="Download Microsoft Word .docx"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>.docx</span>
          </Button>

          <Button
            size="sm"
            onClick={handleDirectDownloadPDF}
            disabled={isGeneratingPdf}
            className="h-7 px-3 text-xs gap-1.5 font-medium shadow-xs"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Download PDF</span>
          </Button>
        </div>
      </div>

      {/* ── Document Preview Container (Hidden Scrollbars) ── */}
      <div
        data-lenis-prevent
        className="min-h-0 min-w-0 flex-1 w-full max-w-full overflow-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden p-4 sm:p-6 flex items-start justify-center bg-muted/40"
      >
        <div
          ref={printRef}
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top center",
            fontFamily: getFontFamilyStyle(visualData.theme.fontFamily),
          }}
          className="resume-paper w-[210mm] min-h-[297mm] bg-white text-black p-[12.7mm] shadow-lg rounded-xs transition-transform duration-100 ease-out"
        >
          {/* ══════════════════ LATEX MODE RENDER ══════════════════ */}
          {mode === "latex" && parsedLatex ? (
            <div className="space-y-2.5 text-[13px] leading-normal select-text">
              {/* Header */}
              <div className="text-center pb-1">
                <h1 className="text-[23px] font-bold tracking-normal text-black uppercase font-serif">
                  {parsedLatex.name || "Your Name"}
                </h1>
                {parsedLatex.contactLinks.length > 0 && (
                  <p className="text-[11.5px] text-slate-800 mt-1 flex flex-wrap items-center justify-center gap-x-2">
                    {parsedLatex.contactLinks.map((link, i) => (
                      <span key={i} className="inline-flex items-center">
                        {renderContactIcon(link.icon)}
                        {link.url ? (
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline hover:text-blue-600 transition-colors text-black"
                          >
                            {link.text}
                          </a>
                        ) : (
                          <span>{link.text}</span>
                        )}
                        {i < parsedLatex.contactLinks.length - 1 && (
                          <span className="mx-1.5 text-slate-400">|</span>
                        )}
                      </span>
                    ))}
                  </p>
                )}
              </div>

              {/* Parsed Sections */}
              {parsedLatex.sections.map((section, sIdx) => (
                <div key={sIdx} className="space-y-1.5">
                  <h2 className="text-[12.5px] font-bold tracking-wider uppercase border-b border-black pb-[1px] text-black">
                    {section.title}
                  </h2>

                  <div className="space-y-1.5">
                    {section.isKeyValSection ? (
                      <div className="space-y-0.5 text-[12px] leading-relaxed">
                        {section.items.map((item, iIdx) => (
                          <div key={iIdx} className="space-y-0.5">
                            {item.bullets.map((bullet, bIdx) => {
                              const colonIdx = bullet.indexOf(":");
                              if (colonIdx !== -1) {
                                const cat = bullet.substring(0, colonIdx).trim() + ":";
                                const val = bullet.substring(colonIdx + 1).trim();
                                return (
                                  <div key={bIdx}>
                                    <span className="font-bold text-black">{cat} </span>
                                    <span className="text-black">{val}</span>
                                  </div>
                                );
                              }
                              return <div key={bIdx}>{bullet}</div>;
                            })}
                          </div>
                        ))}
                      </div>
                    ) : (
                      section.items.map((item, iIdx) => {
                        const r1Left = item.row1Left || item.title;
                        const r1Right = item.row1Right || item.date || item.location;
                        const r2Left = item.row2Left || item.subtitle;
                        const r2Right = item.row2Right;

                        return (
                          <div key={iIdx} className="space-y-0.5">
                            {(r1Left || r1Right) && (
                              <div className="flex items-baseline justify-between text-[12.5px] w-full">
                                <div className="flex items-baseline flex-wrap">
                                  <span className="font-bold text-black">{r1Left}</span>
                                  {item.links && item.links.length > 0 && r2Left && (
                                    <>
                                      <span className="mx-1 text-slate-400">|</span>
                                      <span className="italic text-black">{r2Left}</span>
                                    </>
                                  )}
                                  {item.links && item.links.length > 0 && (
                                    <span className="inline-flex items-center gap-1.5 ml-1.5">
                                      {item.links.map((l, lIdx) => (
                                        <span key={lIdx} className="inline-flex items-center">
                                          <span className="mr-1.5 text-slate-400">|</span>
                                          <a
                                            href={l.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-black hover:underline hover:text-blue-600 gap-0.5 text-[11px] font-normal"
                                          >
                                            {l.icon === "github" ? (
                                              <Github className="w-2.5 h-2.5 inline mr-0.5" />
                                            ) : (
                                              <ExternalLink className="w-2.5 h-2.5 inline mr-0.5" />
                                            )}
                                            {l.text}
                                          </a>
                                        </span>
                                      ))}
                                    </span>
                                  )}
                                </div>
                                {r1Right && (
                                  <span className="text-[11.5px] text-black font-normal ml-2 shrink-0">
                                    {r1Right}
                                  </span>
                                )}
                              </div>
                            )}

                            {(!item.links || item.links.length === 0) && (r2Left || r2Right) && (
                              <div className="flex items-baseline justify-between text-[11.5px] italic text-black w-full">
                                <span>{r2Left}</span>
                                {r2Right && (
                                  <span className="italic text-black ml-2 shrink-0">
                                    {r2Right}
                                  </span>
                                )}
                              </div>
                            )}

                            {item.bullets.length > 0 && (
                              <ul className="list-disc list-outside pl-4 space-y-0.5 text-[11.5px] text-black">
                                {item.bullets.map((bullet, bIdx) => (
                                  <li key={bIdx} className="leading-snug">
                                    {bullet.replace(/^[•\s\-\*]+/, "")}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ══════════════════ VISUAL / CANVA MODE RENDER ══════════════════ */
            <div className="space-y-2.5 text-[13px] leading-normal select-text">
              {/* Header */}
              <div className="text-center pb-1">
                <h1
                  style={{ color: visualData.theme.primaryColor }}
                  className="text-[23px] font-bold tracking-normal uppercase"
                >
                  {visualData.personalInfo.fullName || "Your Name"}
                </h1>
                {visualData.personalInfo.jobTitle && (
                  <p className="text-[12.5px] font-medium text-slate-800 mt-0.5">
                    {visualData.personalInfo.jobTitle}
                  </p>
                )}
                <div className="text-[11.5px] text-slate-800 mt-1 flex flex-wrap items-center justify-center gap-x-2">
                  {visualData.personalInfo.phone && (
                    <span className="inline-flex items-center">
                      <Phone className="w-3 h-3 text-slate-700 mr-1 inline" />
                      {visualData.personalInfo.phone}
                    </span>
                  )}
                  {visualData.personalInfo.email && (
                    <>
                      <span className="text-slate-400">•</span>
                      <span className="inline-flex items-center">
                        <Mail className="w-3 h-3 text-slate-700 mr-1 inline" />
                        {visualData.personalInfo.email}
                      </span>
                    </>
                  )}
                  {visualData.personalInfo.linkedin && (
                    <>
                      <span className="text-slate-400">•</span>
                      <span className="inline-flex items-center">
                        <Linkedin className="w-3 h-3 text-[#0a66c2] mr-1 inline" />
                        {visualData.personalInfo.linkedin}
                      </span>
                    </>
                  )}
                  {visualData.personalInfo.github && (
                    <>
                      <span className="text-slate-400">•</span>
                      <span className="inline-flex items-center">
                        <Github className="w-3 h-3 text-slate-800 mr-1 inline" />
                        {visualData.personalInfo.github}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Summary */}
              {visualData.personalInfo.summary && (
                <div className="space-y-1">
                  <h2
                    style={{ borderBottomColor: visualData.theme.primaryColor, color: visualData.theme.primaryColor }}
                    className="text-[12.5px] font-bold tracking-wider uppercase border-b pb-[1px]"
                  >
                    Professional Summary
                  </h2>
                  <p className="text-[11.5px] text-black leading-relaxed">
                    {visualData.personalInfo.summary}
                  </p>
                </div>
              )}

              {/* Education */}
              {visualData.education.length > 0 && (
                <div className="space-y-1.5">
                  <h2
                    style={{ borderBottomColor: visualData.theme.primaryColor, color: visualData.theme.primaryColor }}
                    className="text-[12.5px] font-bold tracking-wider uppercase border-b pb-[1px]"
                  >
                    Education
                  </h2>
                  <div className="space-y-1.5">
                    {visualData.education.map((edu) => (
                      <div key={edu.id} className="space-y-0.5">
                        <div className="flex items-baseline justify-between text-[12.5px] w-full">
                          <span className="font-bold text-black">{edu.institution}</span>
                          <span className="text-black text-[11.5px]">{edu.location}</span>
                        </div>
                        <div className="flex items-baseline justify-between text-[11.5px] text-black italic w-full">
                          <span>
                            {edu.degree} in {edu.fieldOfStudy} {edu.gpa ? `; GPA: ${edu.gpa}` : ""}
                          </span>
                          <span className="not-italic text-black">
                            {edu.startDate} – {edu.current ? "Present" : edu.endDate}
                          </span>
                        </div>
                        {edu.bullets && edu.bullets.length > 0 && (
                          <ul className="list-disc list-outside pl-4 space-y-0.5 text-[11.5px] text-black">
                            {edu.bullets.map((b, i) => (
                              <li key={i}>{b}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {visualData.experience.length > 0 && (
                <div className="space-y-1.5">
                  <h2
                    style={{ borderBottomColor: visualData.theme.primaryColor, color: visualData.theme.primaryColor }}
                    className="text-[12.5px] font-bold tracking-wider uppercase border-b pb-[1px]"
                  >
                    Experience
                  </h2>
                  <div className="space-y-2">
                    {visualData.experience.map((exp) => (
                      <div key={exp.id} className="space-y-0.5">
                        <div className="flex items-baseline justify-between text-[12.5px] w-full">
                          <span className="font-bold text-black">{exp.role}</span>
                          <span className="text-black text-[11.5px] font-normal">
                            {exp.startDate} – {exp.current ? "Present" : exp.endDate}
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between text-[11.5px] text-black italic w-full">
                          <span>{exp.company}</span>
                          <span className="not-italic text-black">{exp.location}</span>
                        </div>
                        {exp.bullets && exp.bullets.length > 0 && (
                          <ul className="list-disc list-outside pl-4 space-y-0.5 text-[11.5px] text-black">
                            {exp.bullets.map((b, i) => (
                              <li key={i}>{b}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {visualData.projects.length > 0 && (
                <div className="space-y-1.5">
                  <h2
                    style={{ borderBottomColor: visualData.theme.primaryColor, color: visualData.theme.primaryColor }}
                    className="text-[12.5px] font-bold tracking-wider uppercase border-b pb-[1px]"
                  >
                    Projects
                  </h2>
                  <div className="space-y-1.5">
                    {visualData.projects.map((proj) => (
                      <div key={proj.id} className="space-y-0.5">
                        <div className="flex items-baseline justify-between text-[12.5px] w-full">
                          <span className="font-bold text-black">
                            {proj.name}{" "}
                            {proj.techStack && proj.techStack.length > 0 && (
                              <span className="font-normal italic text-black">
                                | {proj.techStack.join(", ")}
                              </span>
                            )}
                          </span>
                          {proj.date && <span className="text-black text-[11.5px]">{proj.date}</span>}
                        </div>
                        {proj.bullets && proj.bullets.length > 0 && (
                          <ul className="list-disc list-outside pl-4 space-y-0.5 text-[11.5px] text-black">
                            {proj.bullets.map((b, i) => (
                              <li key={i}>{b}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {visualData.skills.length > 0 && (
                <div className="space-y-1">
                  <h2
                    style={{ borderBottomColor: visualData.theme.primaryColor, color: visualData.theme.primaryColor }}
                    className="text-[12.5px] font-bold tracking-wider uppercase border-b pb-[1px]"
                  >
                    Technical Skills
                  </h2>
                  <div className="space-y-0.5 text-[11.5px]">
                    {visualData.skills.map((cat) => (
                      <div key={cat.id}>
                        <span className="font-bold text-black">{cat.name}: </span>
                        <span className="text-black">{cat.skills.join(", ")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
