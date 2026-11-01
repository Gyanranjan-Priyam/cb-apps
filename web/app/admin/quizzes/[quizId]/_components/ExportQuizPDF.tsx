"use client";

import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { generateQuizPDF, downloadQuizPDF, QuizQuestion } from "@/lib/quiz-pdf-generator";
import { useState } from "react";
import { toast } from "sonner";

interface ExportQuizPDFProps {
  quizTitle: string;
  quizId: string;
  description: string;
  duration: number;
  pointsPerQuestion?: number;
  targetAudience?: string;
  setNumber?: string;
  questions?: QuizQuestion[];
  questionsBySet?: Record<string, QuizQuestion[]>;
  shiftsMap?: Record<number, Record<string, any[]>>;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  stopPropagation?: boolean;
  buttonText?: string;
}

export function ExportQuizPDF({
  quizTitle,
  quizId,
  description,
  duration,
  pointsPerQuestion,
  targetAudience,
  setNumber,
  questions = [],
  questionsBySet,
  shiftsMap,
  variant = "outline",
  size = "sm",
  className,
  stopPropagation = false,
  buttonText,
}: ExportQuizPDFProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (e: React.MouseEvent) => {
    if (stopPropagation) {
      e.stopPropagation();
    }

    try {
      setIsExporting(true);

      const generatePromise = (async () => {
        const pdfBlob = await generateQuizPDF({
          title: quizTitle,
          quizId,
          description,
          duration,
          pointsPerQuestion,
          targetAudience,
          setNumber,
          questions,
          questionsBySet,
          shiftsMap,
        });

        const filename = setNumber
          ? `${quizId}_Set_${setNumber}_Exam.pdf`
          : `${quizId}_Exam_Question_Paper.pdf`;

        downloadQuizPDF(pdfBlob, filename);
        return filename;
      })();

      await toast.promise(generatePromise, {
        loading: "Generating optimized exam PDF...",
        success: "Exam PDF exported successfully!",
        error: "Failed to export PDF",
        description: "Official printable question paper ready",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={isExporting}
      className={className}
    >
      {isExporting ? (
        <FileText className="h-4 w-4 mr-2 animate-pulse text-primary" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      {isExporting ? "Generating PDF..." : buttonText || "Export Exam PDF"}
    </Button>
  );
}
