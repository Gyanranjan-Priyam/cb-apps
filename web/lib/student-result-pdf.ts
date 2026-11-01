import jsPDF from "jspdf";

export interface ScorecardQuestionItem {
  questionIndex: number;
  questionText: string;
  options: string[];
  userAnswerIndex: number;
  userAnswerText?: string;
  correctAnswerIndex: number;
  correctAnswerText?: string;
  isCorrect: boolean;
}

export interface ScorecardPDFData {
  studentName: string;
  studentEmail: string;
  quizTitle: string;
  quizId: string;
  setLetter: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  pointsEarned: number;
  tabSwitches?: number;
  submissionDate: string | Date;
  isPublished?: boolean;
  isPassed?: boolean;
  statusLabel?: string;
  questions: ScorecardQuestionItem[];
}

async function loadImageAsBase64(imagePath: string, maxDim: number = 300): Promise<string> {
  try {
    if (typeof window === "undefined") return "";
    const response = await fetch(imagePath);
    if (!response.ok) return "";
    const blob = await response.blob();

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve("");
            return;
          }
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL("image/png", 0.85);
          resolve(dataUrl);
        } catch {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve("");
          reader.readAsDataURL(blob);
        }
      };
      img.onerror = () => resolve("");
      img.src = URL.createObjectURL(blob);
    });
  } catch (error) {
    console.warn(`Could not load logo from ${imagePath}:`, error);
    return "";
  }
}

export async function generateStudentScorecardPDF(
  data: ScorecardPDFData
): Promise<jsPDF> {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  // =========================================================
  // PAGE SETTINGS & DIMENSIONS
  // =========================================================
  const PAGE_WIDTH = 210;
  const PAGE_HEIGHT = 297;
  const LEFT = 16;
  const RIGHT = 16;
  const TOP = 16;
  const CONTENT_WIDTH = PAGE_WIDTH - LEFT - RIGHT;
  const FOOTER_Y = PAGE_HEIGHT - 9;
  const CONTENT_BOTTOM = PAGE_HEIGHT - 18;

  let y = TOP;
  let pageNumber = 1;

  // =========================================================
  // PROFESSIONAL COLOR PALETTE
  // =========================================================
  const BLACK = [15, 23, 42] as const;      // Slate 900
  const DARK = [30, 41, 59] as const;       // Slate 800
  const MID = [71, 85, 105] as const;       // Slate 600
  const GRAY = [100, 116, 139] as const;    // Slate 500
  const LIGHT_GRAY = [226, 232, 240] as const; // Slate 200
  const CARD_BG = [248, 250, 252] as const; // Slate 50
  const PALE = [241, 245, 249] as const;    // Slate 100
  const WHITE = [255, 255, 255] as const;

  const GREEN = [22, 101, 52] as const;     // Emerald 800
  const GREEN_BG = [240, 253, 244] as const;// Emerald 50
  const GREEN_BORDER = [187, 247, 208] as const; // Emerald 200

  const RED = [153, 27, 27] as const;       // Red 800
  const RED_BG = [254, 242, 242] as const;  // Red 50
  const RED_BORDER = [254, 202, 202] as const; // Red 200

  const PRIMARY = [30, 41, 59] as const;

  // =========================================================
  // BASIC HELPERS
  // =========================================================
  const setTextColor = (color: readonly [number, number, number]) => {
    pdf.setTextColor(color[0], color[1], color[2]);
  };

  const setDrawColor = (color: readonly [number, number, number]) => {
    pdf.setDrawColor(color[0], color[1], color[2]);
  };

  const setFillColor = (color: readonly [number, number, number]) => {
    pdf.setFillColor(color[0], color[1], color[2]);
  };

  const line = (
    yPosition: number,
    color: readonly [number, number, number] = LIGHT_GRAY,
    width = 0.3
  ) => {
    setDrawColor(color);
    pdf.setLineWidth(width);
    pdf.line(LEFT, yPosition, PAGE_WIDTH - RIGHT, yPosition);
  };

  const normalizeText = (value: unknown): string => {
    return String(value ?? "")
      .replace(/\u00a0/g, " ")
      .replace(/\u20B9/g, "Rs.")
      .replace(/[✓✔]/g, "[OK]")
      .replace(/[✗✕×]/g, "[X]");
  };

  const getDateString = (value: string | Date): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }
    return date.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const wrapText = (
    text: string,
    width: number,
    fontSize: number,
    style: "normal" | "bold" = "normal"
  ): string[] => {
    pdf.setFont("helvetica", style);
    pdf.setFontSize(fontSize);
    return pdf.splitTextToSize(normalizeText(text), width);
  };

  const addPageHeaderFooter = (isFirstPage = false) => {
    // Top border line on secondary pages
    if (!isFirstPage) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      setTextColor(GRAY);
      pdf.text(
        `CODEBREAKERS · ${normalizeText(data.quizTitle).toUpperCase()}`,
        LEFT,
        TOP - 5
      );
      pdf.text(
        `SET ${normalizeText(data.setLetter || "A")}`,
        PAGE_WIDTH - RIGHT,
        TOP - 5,
        { align: "right" }
      );
      line(TOP - 3, LIGHT_GRAY, 0.25);
    }

    // Bottom Footer
    line(PAGE_HEIGHT - 13, LIGHT_GRAY, 0.25);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    setTextColor(GRAY);
    pdf.text(
      "Government College of Engineering, Kalahandi · CodeBreakers Assessment Cell",
      LEFT,
      FOOTER_Y
    );
    pdf.text(
      `Page ${pageNumber}`,
      PAGE_WIDTH - RIGHT,
      FOOTER_Y,
      { align: "right" }
    );
  };

  const newPage = () => {
    pdf.addPage();
    pageNumber++;
    addPageHeaderFooter(false);
    y = TOP + 2;
  };

  // Pre-load logos
  const [gcekLogo, cbLogo] = await Promise.all([
    loadImageAsBase64("/assets/gcek_logo.png"),
    loadImageAsBase64("/assets/logo.png"),
  ]);

  addPageHeaderFooter(true);

  // =========================================================
  // PAGE 1: OFFICIAL ACADEMIC HEADER (WITH LOGOS)
  // =========================================================
  const logoSize = 17;
  const headerCenterY = y + 3;

  // 1. Left Logo (GCEK)
  if (gcekLogo) {
    try {
      pdf.addImage(gcekLogo, "PNG", LEFT, y, logoSize, logoSize);
    } catch {
      // Fallback
    }
  }

  // 2. Right Logo (CodeBreakers)
  if (cbLogo) {
    try {
      pdf.addImage(cbLogo, "PNG", PAGE_WIDTH - RIGHT - logoSize, y, logoSize, logoSize);
    } catch {
      // Fallback
    }
  }

  // 3. Center Institutional Heading
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  setTextColor(MID);
  pdf.text(
    "GOVERNMENT COLLEGE OF ENGINEERING, KALAHANDI",
    PAGE_WIDTH / 2,
    headerCenterY + 2,
    { align: "center" }
  );

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  setTextColor(BLACK);
  pdf.text(
    "CODEBREAKERS CLUB",
    PAGE_WIDTH / 2,
    headerCenterY + 8,
    { align: "center" }
  );

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  setTextColor(GRAY);
  pdf.text(
    "DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING",
    PAGE_WIDTH / 2,
    headerCenterY + 12.5,
    { align: "center" }
  );

  y += 21;

  // Double Horizontal Header Rule
  line(y, DARK, 0.6);
  y += 1.2;
  line(y, LIGHT_GRAY, 0.25);
  y += 6;

  // Document Title Banner
  const bannerH = 7.5;
  pdf.setFillColor(PALE[0], PALE[1], PALE[2]);
  pdf.rect(LEFT, y, CONTENT_WIDTH, bannerH, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  setTextColor(BLACK);
  pdf.text("OFFICIAL EXAMINATION SCORECARD & MARKS TRANSCRIPT", PAGE_WIDTH / 2, y + 5.1, {
    align: "center",
  });

  // Margin from bottom of banner to quiz title
  y += bannerH + 7;

  // =========================================================
  // EXAMINATION METADATA
  // =========================================================
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  setTextColor(BLACK);
  const titleLines = wrapText(data.quizTitle || "Examination Assessment", CONTENT_WIDTH, 14, "bold");
  titleLines.forEach((tLine, lIdx) => {
    pdf.text(tLine, LEFT, y + lIdx * 5.8);
  });
  y += titleLines.length * 5.8;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  setTextColor(MID);
  pdf.text(
    `Assigned Set: SET ${normalizeText(data.setLetter || "A")}   |   Examination Mode: Computer-Based Proctor Test`,
    LEFT,
    y
  );

  y += 6;
  line(y, LIGHT_GRAY, 0.3);
  y += 6;

  // =========================================================
  // CANDIDATE IDENTIFICATION (STRUCTURED GRID)
  // =========================================================
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  setTextColor(BLACK);
  pdf.text("CANDIDATE DETAILS", LEFT, y);
  y += 3.5;

  const candidateBoxHeight = 18;
  pdf.setFillColor(CARD_BG[0], CARD_BG[1], CARD_BG[2]);
  pdf.rect(LEFT, y, CONTENT_WIDTH, candidateBoxHeight, "F");
  pdf.setDrawColor(LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2]);
  pdf.setLineWidth(0.3);
  pdf.rect(LEFT, y, CONTENT_WIDTH, candidateBoxHeight, "S");

  // Vertical split in candidate box
  pdf.line(PAGE_WIDTH / 2, y, PAGE_WIDTH / 2, y + candidateBoxHeight);

  // Left Column (Name & Email)
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  setTextColor(GRAY);
  pdf.text("Candidate Name:", LEFT + 4, y + 6);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  setTextColor(BLACK);
  pdf.text(normalizeText(data.studentName || "N/A"), LEFT + 32, y + 6);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  setTextColor(GRAY);
  pdf.text("Email Address:", LEFT + 4, y + 13);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  setTextColor(DARK);
  pdf.text(normalizeText(data.studentEmail || "N/A"), LEFT + 32, y + 13);

  // Right Column (Date & Record Status)
  const rightColX = PAGE_WIDTH / 2 + 4;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  setTextColor(GRAY);
  pdf.text("Submitted At:", rightColX, y + 6);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  setTextColor(DARK);
  pdf.text(getDateString(data.submissionDate), rightColX + 28, y + 6);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  setTextColor(GRAY);
  pdf.text("Record Status:", rightColX, y + 13);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  setTextColor(data.isPublished ? GREEN : DARK);
  pdf.text(data.isPublished ? "Verified & Published" : "Proctor Record Stored", rightColX + 28, y + 13);

  y += candidateBoxHeight + 7;

  // =========================================================
  // PERFORMANCE & MARKS STATEMENT TABLE
  // =========================================================
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  setTextColor(BLACK);
  pdf.text("MARKS & EVALUATION STATEMENT", LEFT, y);
  y += 3.5;

  const attemptedCount = data.questions.filter((q) => q.userAnswerIndex !== -1).length;
  const incorrectCount = data.questions.filter((q) => q.userAnswerIndex !== -1 && !q.isCorrect).length;
  const unattemptedCount = data.questions.filter((q) => q.userAnswerIndex === -1).length;
  const isPassed = data.isPassed !== undefined ? data.isPassed : data.score >= 50;
  const statusLabel = data.statusLabel || (isPassed ? "QUALIFIED / PASSED" : "FAILED / NOT QUALIFIED");

  const tableRows = [
    { param: "Total Questions in Assessment", max: String(data.totalQuestions), secured: String(data.totalQuestions), remark: "Base Questions" },
    { param: "Questions Attempted", max: String(data.totalQuestions), secured: String(attemptedCount), remark: `${((attemptedCount / (data.totalQuestions || 1)) * 100).toFixed(0)}% Attempted` },
    { param: "Correct Answers", max: String(data.totalQuestions), secured: String(data.correctAnswers), remark: `+${data.correctAnswers} Marks` },
    { param: "Incorrect Answers", max: "—", secured: String(incorrectCount), remark: "0.0 Negative Marks" },
    { param: "Unattempted Questions", max: "—", secured: String(unattemptedCount), remark: "Skipped" },
    { param: "Proctor Integrity Violations (Tab Switches)", max: "0 Allowed", secured: `${data.tabSwitches || 0}`, remark: (data.tabSwitches || 0) === 0 ? "Clean Integrity" : "Violations Logged" },
    { param: "Total Score / Points Awarded", max: `${data.totalQuestions}.0`, secured: `${data.pointsEarned ?? 0}`, remark: "Points Count" },
  ];

  // Table Dimensions
  const colW1 = 80;
  const colW2 = 24;
  const colW3 = 30;
  const colW4 = CONTENT_WIDTH - colW1 - colW2 - colW3;
  const rowH = 6.2;

  // Table Header
  pdf.setFillColor(DARK[0], DARK[1], DARK[2]);
  pdf.rect(LEFT, y, CONTENT_WIDTH, 6.5, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  setTextColor(WHITE);
  pdf.text("EVALUATION PARAMETER", LEFT + 3, y + 4.5);
  pdf.text("MAX", LEFT + colW1 + 3, y + 4.5);
  pdf.text("SECURED", LEFT + colW1 + colW2 + 3, y + 4.5);
  pdf.text("REMARKS / STATUS", LEFT + colW1 + colW2 + colW3 + 3, y + 4.5);

  y += 6.5;

  // Table Body Rows
  tableRows.forEach((row, idx) => {
    const isEven = idx % 2 === 0;
    pdf.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    pdf.rect(LEFT, y, CONTENT_WIDTH, rowH, "F");

    setDrawColor(LIGHT_GRAY);
    pdf.setLineWidth(0.2);
    pdf.rect(LEFT, y, CONTENT_WIDTH, rowH, "S");

    // Grid vertical lines
    pdf.line(LEFT + colW1, y, LEFT + colW1, y + rowH);
    pdf.line(LEFT + colW1 + colW2, y, LEFT + colW1 + colW2, y + rowH);
    pdf.line(LEFT + colW1 + colW2 + colW3, y, LEFT + colW1 + colW2 + colW3, y + rowH);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    setTextColor(DARK);
    pdf.text(row.param, LEFT + 3, y + 4.3);

    pdf.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
    pdf.text(row.max, LEFT + colW1 + 3, y + 4.3);

    pdf.setFont("helvetica", "bold");
    setTextColor(BLACK);
    pdf.text(row.secured, LEFT + colW1 + colW2 + 3, y + 4.3);

    pdf.setFont("helvetica", "normal");
    setTextColor(MID);
    pdf.text(row.remark, LEFT + colW1 + colW2 + colW3 + 3, y + 4.3);

    y += rowH;
  });

  // Final Percentage & Status Row (Highlight Row)
  const finalRowH = 8.5;
  pdf.setFillColor(isPassed ? GREEN_BG[0] : RED_BG[0], isPassed ? GREEN_BG[1] : RED_BG[1], isPassed ? GREEN_BG[2] : RED_BG[2]);
  pdf.rect(LEFT, y, CONTENT_WIDTH, finalRowH, "F");
  setDrawColor(isPassed ? GREEN_BORDER : RED_BORDER);
  pdf.setLineWidth(0.4);
  pdf.rect(LEFT, y, CONTENT_WIDTH, finalRowH, "S");

  pdf.line(LEFT + colW1, y, LEFT + colW1, y + finalRowH);
  pdf.line(LEFT + colW1 + colW2, y, LEFT + colW1 + colW2, y + finalRowH);
  pdf.line(LEFT + colW1 + colW2 + colW3, y, LEFT + colW1 + colW2 + colW3, y + finalRowH);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  setTextColor(BLACK);
  pdf.text("FINAL PERCENTAGE SCORE", LEFT + 3, y + 5.5);

  pdf.setFontSize(8);
  setTextColor(GRAY);
  pdf.text("100.0%", LEFT + colW1 + 3, y + 5.5);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  setTextColor(isPassed ? GREEN : RED);
  pdf.text(`${data.score.toFixed(1)}%`, LEFT + colW1 + colW2 + 3, y + 5.8);

  pdf.setFontSize(8.5);
  pdf.text(statusLabel, LEFT + colW1 + colW2 + colW3 + 3, y + 5.5);

  y += finalRowH + 8;

  // =========================================================
  // OFFICIAL VERIFICATION BOX (BOTTOM OF PAGE 1)
  // =========================================================
  const authBoxH = 15;
  pdf.setFillColor(CARD_BG[0], CARD_BG[1], CARD_BG[2]);
  pdf.rect(LEFT, y, CONTENT_WIDTH, authBoxH, "F");
  setDrawColor(LIGHT_GRAY);
  pdf.setLineWidth(0.3);
  pdf.rect(LEFT, y, CONTENT_WIDTH, authBoxH, "S");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  setTextColor(DARK);
  pdf.text("OFFICIAL TRANSCRIPT VERIFICATION", LEFT + 4, y + 4.5);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6.5);
  setTextColor(GRAY);
  const authNote = "This document is an electronically generated scorecard issued by the CodeBreakers Examination Proctor System. Authenticity and metrics can be verified in the examination portal archive.";
  const authLines = wrapText(authNote, CONTENT_WIDTH - 8, 6.5);
  authLines.forEach((aLine, lIdx) => {
    pdf.text(aLine, LEFT + 4, y + 9.5 + lIdx * 3.2);
  });

  // =========================================================
  // PAGE 2 ONWARDS: QUESTION-BY-QUESTION REVIEW
  // =========================================================
  if (data.questions && data.questions.length > 0) {
    newPage();

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    setTextColor(BLACK);
    pdf.text("SECTION B: QUESTION-BY-QUESTION ITEM REVIEW", LEFT, y + 3);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    setTextColor(GRAY);
    pdf.text(`TOTAL ${data.questions.length} QUESTIONS`, PAGE_WIDTH - RIGHT, y + 3, {
      align: "right",
    });

    y += 7;
    line(y, DARK, 0.4);
    y += 7;

    data.questions.forEach((question, index) => {
      const questionNumber = question.questionIndex > 0 ? question.questionIndex : index + 1;
      const questionText = normalizeText(question.questionText);
      const questionWidth = CONTENT_WIDTH - 28;

      const questionLines = wrapText(questionText, questionWidth, 9, "bold");

      const attempted = question.userAnswerIndex !== -1;
      const status = !attempted ? "UNATTEMPTED" : question.isCorrect ? "CORRECT" : "INCORRECT";
      const statusColor = !attempted ? GRAY : question.isCorrect ? GREEN : RED;

      const options = question.options.map((option, optionIndex) => {
        const letter = String.fromCharCode(65 + optionIndex);
        const isUser = question.userAnswerIndex === optionIndex;
        const isCorrectOpt = question.correctAnswerIndex === optionIndex;

        let marker = "";
        if (isUser && isCorrectOpt) {
          marker = "  [YOUR CHOICE — CORRECT]";
        } else if (isUser) {
          marker = "  [YOUR CHOICE]";
        } else if (isCorrectOpt) {
          marker = "  [CORRECT KEY]";
        }

        const text = `${letter}.  ${normalizeText(option)}${marker}`;
        const style = (isUser || isCorrectOpt ? "bold" : "normal") as "normal" | "bold";

        let color: readonly [number, number, number] = MID;
        if (isUser && isCorrectOpt) color = GREEN;
        else if (isUser && !isCorrectOpt) color = RED;
        else if (isCorrectOpt) color = GREEN;

        const lines = wrapText(text, CONTENT_WIDTH - 16, 8, style);
        return { text, lines, style, color };
      });

      // Calculate required height for this question card
      const promptLineHeight = 4.4;
      const optionLineHeight = 3.8;
      const promptHeight = questionLines.length * promptLineHeight;
      let optionsTotalHeight = 0;
      options.forEach((opt) => {
        optionsTotalHeight += opt.lines.length * optionLineHeight + 1.5;
      });

      const questionCardHeight = 6 + promptHeight + 2 + optionsTotalHeight + 3;

      if (y + questionCardHeight > CONTENT_BOTTOM) {
        newPage();
      }

      // Question Container Card
      const cardBg = !attempted ? CARD_BG : question.isCorrect ? GREEN_BG : RED_BG;
      const cardBorder = !attempted ? LIGHT_GRAY : question.isCorrect ? GREEN_BORDER : RED_BORDER;

      pdf.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
      pdf.rect(LEFT, y, CONTENT_WIDTH, questionCardHeight, "F");
      setDrawColor(cardBorder);
      pdf.setLineWidth(0.25);
      pdf.rect(LEFT, y, CONTENT_WIDTH, questionCardHeight, "S");

      // Question Number Tag
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.5);
      setTextColor(DARK);
      pdf.text(`Q${questionNumber}.`, LEFT + 4, y + 5);

      // Status Tag (Top Right)
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      setTextColor(statusColor);
      pdf.text(status, PAGE_WIDTH - RIGHT - 4, y + 5, { align: "right" });

      // Question Prompt (Render line by line with explicit spacing)
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      setTextColor(BLACK);
      questionLines.forEach((lineText, lIdx) => {
        pdf.text(lineText, LEFT + 12, y + 5 + lIdx * promptLineHeight);
      });

      let currentOptionY = y + 5 + promptHeight + 2;

      // Options List (Render line by line with explicit spacing)
      options.forEach((option) => {
        pdf.setFont("helvetica", option.style);
        pdf.setFontSize(8);
        setTextColor(option.color);
        option.lines.forEach((lineText, lIdx) => {
          pdf.text(lineText, LEFT + 12, currentOptionY + lIdx * optionLineHeight);
        });
        currentOptionY += option.lines.length * optionLineHeight + 1.5;
      });

      y += questionCardHeight + 3;
    });
  }

  return pdf;
}