/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

import { calculateQuizRankings } from "@/lib/quiz-ranking";

export interface RankedAttemptItem {
  id: string;
  participantName: string;
  participantEmail: string;
  shiftNumber?: number;
  shiftName?: string;
  setLetter: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  pointsEarned: number;
  status: string;
  tabSwitches: number;
  createdAt: string | Date;
  completedAt?: string | Date | null;
  isPublished: boolean;
  isQualified?: boolean;
  resultStatus?: string;
  rank?: number;
  isTied?: boolean;
}

interface ExportExcelButtonProps {
  quizTitle: string;
  quizId: string;
  attempts: RankedAttemptItem[];
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function ExportExcelButton({
  quizTitle,
  quizId,
  attempts,
  variant = "outline",
  size = "default",
  className = "",
}: ExportExcelButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = () => {
    if (!attempts || attempts.length === 0) {
      toast.warning("No attempts available", {
        description: "There are no student attempts to export to Excel.",
      });
      return;
    }

    setIsExporting(true);
    try {
      // 1. Sort and rank using standard criteria (Marks desc -> Submission time asc -> Identical tie)
      const { sortedAttempts, rankedDetailsMap } = calculateQuizRankings(attempts as any);

      // 2. Prepare tabular data with calculated ranks and exact submission timestamps
      const worksheetData = sortedAttempts.map((att: any) => {
        const details = rankedDetailsMap.get(att.id);
        const rankDisplay = details?.isTied ? `#${details.rank} (Tied)` : `#${details?.rank ?? 1}`;
        const subDate = details?.submissionDate || new Date(att.completedAt || att.createdAt);

        return {
          "Rank": rankDisplay,
          "Participant Name": att.participantName || "N/A",
          "Email Address": att.participantEmail || "N/A",
          "Shift": att.shiftName || `Shift ${att.shiftNumber || 1}`,
          "Quiz Set": `Set ${att.setLetter || "A"}`,
          "Score (%)": `${att.score.toFixed(1)}%`,
          "Correct Answers": att.correctAnswers,
          "Total Questions": att.totalQuestions,
          "Points Awarded": att.pointsEarned,
          "Result Status": att.resultStatus || (att.score >= 50 ? "QUALIFIED" : "FAILED"),
          "Exam State": att.status || "Completed",
          "Tab Violations": att.tabSwitches || 0,
          "Submitted At": subDate.toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "medium",
          }),
          "Result Published": att.isPublished ? "Yes" : "No",
        };
      });

      // 3. Create Workbook & Sheet
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);

      // Auto-fit column widths
      worksheet["!cols"] = [
        { wch: 8 },  // Rank
        { wch: 26 }, // Name
        { wch: 32 }, // Email
        { wch: 12 }, // Shift
        { wch: 10 }, // Set
        { wch: 12 }, // Score
        { wch: 16 }, // Correct
        { wch: 16 }, // Total Q
        { wch: 16 }, // Points
        { wch: 20 }, // Result Status
        { wch: 14 }, // Exam State
        { wch: 15 }, // Violations
        { wch: 24 }, // Submitted At
        { wch: 16 }, // Published
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Ranked Results");

      // 4. Download file
      const safeTitle = (quizTitle || "Quiz").replace(/[^a-zA-Z0-9_-]/g, "_");
      XLSX.writeFile(workbook, `${safeTitle}_Ranked_Results.xlsx`);

      toast.success("Exported results to Excel!", {
        description: `${sortedAttempts.length} participant records saved`,
      });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export Excel file", {
        description: "An unexpected error occurred during Excel workbook generation.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExportExcel}
      disabled={isExporting || attempts.length === 0}
      className={`cursor-pointer font-medium ${className}`}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" />
      )}
      <span>Export Excel ({attempts.length})</span>
    </Button>
  );
}
