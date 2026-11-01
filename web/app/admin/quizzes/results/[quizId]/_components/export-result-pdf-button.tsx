"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, FileText } from "lucide-react";
import { generateStudentScorecardPDF, ScorecardPDFData } from "@/lib/student-result-pdf";
import { toast } from "sonner";

interface ExportResultPdfButtonProps {
  data: ScorecardPDFData;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function ExportResultPdfButton({
  data,
  variant = "outline",
  size = "default",
  className = "",
}: ExportResultPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    try {
      const pdfPromise = (async () => {
        const pdf = await generateStudentScorecardPDF(data);
        const safeName = (data.studentName || "Student").replace(/[^a-zA-Z0-9_-]/g, "_");
        const safeTitle = (data.quizTitle || "Quiz").replace(/[^a-zA-Z0-9_-]/g, "_");
        pdf.save(`${safeName}_Scorecard_${safeTitle}.pdf`);
        return `${safeName}_Scorecard_${safeTitle}.pdf`;
      })();

      await toast.promise(pdfPromise, {
        loading: "Generating official PDF scorecard...",
        success: "Scorecard PDF downloaded successfully!",
        error: "Failed to generate PDF scorecard",
        description: `${data.studentName || "Student"} - ${data.quizTitle || "Quiz"}`,
      });
    } catch (error) {
      console.error("Error generating scorecard PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownloadPdf}
      disabled={isGenerating}
      className={`cursor-pointer ${className}`}
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FileText className="h-4 w-4 mr-2 text-primary" />
      )}
      <span>{isGenerating ? "Generating..." : "Download Scorecard PDF"}</span>
    </Button>
  );
}
