/* eslint-disable @typescript-eslint/no-explicit-any */
import jsPDF from "jspdf";

export interface QuizQuestion {
  id?: number | string;
  question?: string;
  title?: string;
  text?: string;
  questionText?: string;
  options: string[];
  answer: string | number;
  explanation?: string;
  points?: number;
}

export interface QuizPDFData {
  title: string;
  quizId: string;
  description?: string;
  duration: number;
  pointsPerQuestion?: number;
  totalMarks?: number;
  targetAudience?: string;
  setNumber?: string;
  questions?: QuizQuestion[];
  questionsBySet?: Record<string, QuizQuestion[]>;
  shiftsMap?: Record<number, Record<string, QuizQuestion[]>>;
  showAnswerKey?: boolean;
}

async function loadImageAsBase64(imagePath: string, maxDim: number = 300): Promise<string> {
  try {
    if (typeof window === "undefined") return "";
    const response = await fetch(imagePath);
    if (!response.ok) return "";
    const blob = await response.blob();

    // Downsample image using canvas to reduce decoded bitmap memory and PDF size (40MB+ -> <100KB)
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

/**
 * Sanitizes and normalizes text for clean rendering in jsPDF standard fonts.
 * - Converts Unicode characters (NFKC normalization to fix full-width chars)
 * - Replaces currency symbols like ₹ with Rs.
 * - Replaces smart quotes, em/en dashes, bullets, and ellipses
 * - Strips zero-width chars and normalizes strange whitespace
 */
export function sanitizePdfText(text: string | null | undefined): string {
  if (text === null || text === undefined) return "";

  let str = String(text);

  // 1. Unicode Compatibility Decomposition / Composition (fixes full-width Latin chars)
  try {
    str = str.normalize("NFKC");
  } catch {
    // ignore if normalize is unsupported
  }

  // 2. Fix Indian Rupee symbol & other currencies not supported in standard font encoding
  str = str.replace(/₹\s*/g, "Rs. ");

  // 3. Normalize quotes and typography
  str = str
    .replace(/[\u2018\u2019\u201A\u201B`]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F«»]/g, '"')
    .replace(/[\u2013\u2014\u2015]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[\u2022\u25CF\u25CB\u25AA\u25AB]/g, "*")
    .replace(/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, " ") // Non-breaking & wide spaces
    .replace(/[\u200B-\u200D\uFEFF\u200E\u200F]/g, ""); // Zero-width characters

  // 4. Remove any remaining non-printable or unsupported control characters (preserve standard printable ASCII & Latin-1)
  str = str.replace(/[^\x20-\x7E\t\n\r\xA0-\xFF]/g, (char) => {
    if (char === "×") return "x";
    if (char === "÷") return "/";
    if (char === "±") return "+/-";
    if (char === "≤") return "<=";
    if (char === "≥") return ">=";
    if (char === "≠") return "!=";
    if (char === "≈") return "~";
    if (char === "√") return "sqrt";
    if (char === "π") return "pi";
    if (char === "∞") return "infinity";
    if (char === "°") return " deg";
    return "";
  });

  return str;
}

/**
 * Accurately measures text wrapping and line height in millimeters for jsPDF
 */
function measureText(
  pdf: jsPDF,
  text: string,
  maxWidth: number,
  fontSize: number,
  lineHeightFactor: number = 1.35
): { lines: string[]; height: number; lineHeight: number } {
  pdf.setFontSize(fontSize);
  const clean = sanitizePdfText(text);
  const raw = clean.replace(/\r\n/g, "\n");
  const segments = raw.split("\n");
  const lines: string[] = [];

  for (const seg of segments) {
    if (seg.trim().length === 0) {
      lines.push("");
    } else {
      const wrapped = pdf.splitTextToSize(seg.trim(), maxWidth) as string[];
      lines.push(...wrapped);
    }
  }

  // 1 pt = 0.352778 mm
  const lineHeight = fontSize * 0.3528 * lineHeightFactor;
  const height = Math.max(lines.length, 1) * lineHeight;
  return { lines, height, lineHeight };
}

/**
 * Prints wrapped text line by line to strictly prevent any overlapping
 */
function printWrappedLines(
  pdf: jsPDF,
  lines: string[],
  x: number,
  startY: number,
  lineHeight: number
): number {
  let curY = startY;
  for (const line of lines) {
    if (line.trim().length > 0) {
      pdf.text(line, x, curY);
    }
    curY += lineHeight;
  }
  return curY;
}

/**
 * Formats correct answer display text
 */
function getAnswerDetails(
  answer: string | number,
  options: string[]
): {
  correctIndex: number;
  correctLetter: string;
  correctText: string;
} {
  let correctIndex = -1;
  let correctLetter = "";
  let correctText = "";

  const sanitizedOptions = options.map((opt) => sanitizePdfText(opt));

  if (typeof answer === "number") {
    correctIndex = answer;
  } else if (typeof answer === "string") {
    const trimmed = sanitizePdfText(answer).trim();
    if (/^\d+$/.test(trimmed)) {
      correctIndex = parseInt(trimmed, 10);
    } else if (/^[A-Za-z]$/.test(trimmed)) {
      correctIndex = trimmed.toUpperCase().charCodeAt(0) - 65;
    } else {
      // Find matching option text
      const foundIdx = sanitizedOptions.findIndex(
        (opt) =>
          opt.trim().toLowerCase() === trimmed.toLowerCase() ||
          opt.toLowerCase().startsWith(trimmed.toLowerCase())
      );
      if (foundIdx !== -1) {
        correctIndex = foundIdx;
      }
    }
  }

  if (correctIndex >= 0 && correctIndex < sanitizedOptions.length) {
    correctLetter = String.fromCharCode(65 + correctIndex);
    correctText = sanitizedOptions[correctIndex] || "";
  } else if (typeof answer === "string" && answer.trim()) {
    correctLetter = "?";
    correctText = sanitizePdfText(answer).trim();
  }

  return { correctIndex, correctLetter, correctText };
}

export async function generateQuizPDF(data: QuizPDFData): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const PAGE_WIDTH = 210;
  const PAGE_HEIGHT = 297;
  const MARGIN_LEFT = 14;
  const MARGIN_RIGHT = 14;
  const MARGIN_TOP = 14;
  const MARGIN_BOTTOM = 14;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // 182mm
  const MAX_USABLE_Y = PAGE_HEIGHT - MARGIN_BOTTOM - 6;

  // Colors
  const COLOR_PRIMARY = [15, 23, 42] as const; // Slate 900
  const COLOR_HEADER_BG = [241, 245, 249] as const; // Slate 100
  const COLOR_BORDER = [203, 213, 225] as const; // Slate 300
  const COLOR_DARK_TEXT = [30, 41, 59] as const; // Slate 800
  const COLOR_MUTED_TEXT = [100, 116, 139] as const; // Slate 500
  const COLOR_GREEN_TEXT = [22, 101, 52] as const; // Emerald 800
  const COLOR_GREEN_BG = [240, 253, 244] as const; // Emerald 50
  const COLOR_GREEN_BORDER = [187, 247, 208] as const; // Emerald 200

  let y = MARGIN_TOP;

  // Load logos (downsampled to max 300px)
  const [gcekLogo, cbLogo] = await Promise.all([
    loadImageAsBase64("/assets/gcek_logo.png", 300),
    loadImageAsBase64("/assets/logo.png", 300),
  ]);

  // Running Header Helper for page 2+
  const drawRunningHeader = (pageNum: number) => {
    if (pageNum <= 1) return;
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(COLOR_MUTED_TEXT[0], COLOR_MUTED_TEXT[1], COLOR_MUTED_TEXT[2]);
    pdf.text(
      `CodeBreakers Examination System · ${sanitizePdfText(data.title)}`,
      MARGIN_LEFT,
      10
    );
    pdf.text(
      data.setNumber ? `Set ${data.setNumber}` : "Examination Question Paper",
      PAGE_WIDTH - MARGIN_RIGHT,
      10,
      { align: "right" }
    );
    pdf.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN_LEFT, 12, PAGE_WIDTH - MARGIN_RIGHT, 12);
  };

  // Helper for adding a new page safely
  const checkOrAddPage = (neededHeight: number) => {
    if (y + neededHeight > MAX_USABLE_Y) {
      pdf.addPage();
      const currentPages = (pdf.internal as any).getNumberOfPages();
      drawRunningHeader(currentPages);
      y = 18;
      return true;
    }
    return false;
  };

  // -------------------------------------------------------------
  // 1. INSTITUTIONAL & EXAM HEADER (Page 1)
  // -------------------------------------------------------------
  const logoSize = 14;
  const headerTop = y;

  if (gcekLogo) {
    try {
      pdf.addImage(gcekLogo, "PNG", MARGIN_LEFT, headerTop, logoSize, logoSize, "GCEK_LOGO", "FAST");
    } catch {
      // ignore
    }
  }

  if (cbLogo) {
    try {
      pdf.addImage(cbLogo, "PNG", PAGE_WIDTH - MARGIN_RIGHT - logoSize, headerTop, logoSize, logoSize, "CB_LOGO", "FAST");
    } catch {
      // ignore
    }
  }

  // Header Title Text
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  pdf.text(
    "GOVERNMENT COLLEGE OF ENGINEERING, KALAHANDI",
    PAGE_WIDTH / 2,
    headerTop + 4,
    { align: "center" }
  );

  pdf.setFontSize(8.5);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(COLOR_MUTED_TEXT[0], COLOR_MUTED_TEXT[1], COLOR_MUTED_TEXT[2]);
  pdf.text(
    "Department of Computer Science & Engineering · CodeBreakers Club",
    PAGE_WIDTH / 2,
    headerTop + 9,
    { align: "center" }
  );

  pdf.setFontSize(13);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  pdf.text(
    sanitizePdfText(data.title).toUpperCase(),
    PAGE_WIDTH / 2,
    headerTop + 15,
    { align: "center" }
  );

  y = headerTop + 19;

  // Header Divider
  pdf.setDrawColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  pdf.setLineWidth(0.6);
  pdf.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);
  y += 3;

  // -------------------------------------------------------------
  // 2. EXAM METADATA BOX (3-Column Key Info Grid without Quiz ID)
  // -------------------------------------------------------------
  const metaBoxHeight = 13;
  pdf.setFillColor(COLOR_HEADER_BG[0], COLOR_HEADER_BG[1], COLOR_HEADER_BG[2]);
  pdf.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(MARGIN_LEFT, y, CONTENT_WIDTH, metaBoxHeight, 2, 2, "FD");

  const colWidth = CONTENT_WIDTH / 3;
  const colYLabel = y + 4.5;
  const colYVal = y + 9.5;

  // Col 1: Duration
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(COLOR_MUTED_TEXT[0], COLOR_MUTED_TEXT[1], COLOR_MUTED_TEXT[2]);
  pdf.text("DURATION", MARGIN_LEFT + 4, colYLabel);
  pdf.setFontSize(8.5);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(COLOR_DARK_TEXT[0], COLOR_DARK_TEXT[1], COLOR_DARK_TEXT[2]);
  pdf.text(`${data.duration} Minutes`, MARGIN_LEFT + 4, colYVal);

  // Col 2: Points per Question
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(COLOR_MUTED_TEXT[0], COLOR_MUTED_TEXT[1], COLOR_MUTED_TEXT[2]);
  pdf.text("POINTS / QUESTION", MARGIN_LEFT + colWidth + 4, colYLabel);
  pdf.setFontSize(8.5);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(COLOR_DARK_TEXT[0], COLOR_DARK_TEXT[1], COLOR_DARK_TEXT[2]);
  pdf.text(`${data.pointsPerQuestion || 1} Mark(s)`, MARGIN_LEFT + colWidth + 4, colYVal);

  // Col 3: Target Audience / Set
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(COLOR_MUTED_TEXT[0], COLOR_MUTED_TEXT[1], COLOR_MUTED_TEXT[2]);
  pdf.text("AUDIENCE / SET", MARGIN_LEFT + colWidth * 2 + 4, colYLabel);
  pdf.setFontSize(8.5);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(COLOR_DARK_TEXT[0], COLOR_DARK_TEXT[1], COLOR_DARK_TEXT[2]);
  pdf.text(
    data.setNumber ? `Set ${data.setNumber}` : data.targetAudience === "EXTERNAL" ? "External Kiosk" : "Internal Quiz",
    MARGIN_LEFT + colWidth * 2 + 4,
    colYVal
  );

  y += metaBoxHeight + 3.5;

  // -------------------------------------------------------------
  // 3. CANDIDATE DETAILS & INSTRUCTIONS SECTION
  // -------------------------------------------------------------
  const candidateBoxHeight = 11;
  pdf.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  pdf.setLineWidth(0.25);
  pdf.roundedRect(MARGIN_LEFT, y, CONTENT_WIDTH, candidateBoxHeight, 1.5, 1.5, "D");

  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(COLOR_DARK_TEXT[0], COLOR_DARK_TEXT[1], COLOR_DARK_TEXT[2]);
  pdf.text("Candidate Name: ____________________________", MARGIN_LEFT + 4, y + 7);
  pdf.text("Roll No / Reg ID: __________________", MARGIN_LEFT + 95, y + 7);
  pdf.text("Score / Sign: _________", MARGIN_LEFT + 150, y + 7);

  y += candidateBoxHeight + 3.5;

  // Description / Instructions if available
  if (data.description && data.description.trim()) {
    const descMeasure = measureText(pdf, data.description.trim(), CONTENT_WIDTH - 8, 8, 1.3);
    const descBoxHeight = descMeasure.height + 6;

    checkOrAddPage(descBoxHeight + 4);

    pdf.setFillColor(250, 250, 250);
    pdf.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    pdf.setLineWidth(0.2);
    pdf.roundedRect(MARGIN_LEFT, y, CONTENT_WIDTH, descBoxHeight, 1.5, 1.5, "FD");

    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    pdf.text("GENERAL INSTRUCTIONS & RULES:", MARGIN_LEFT + 4, y + 4.5);

    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(COLOR_DARK_TEXT[0], COLOR_DARK_TEXT[1], COLOR_DARK_TEXT[2]);
    printWrappedLines(pdf, descMeasure.lines, MARGIN_LEFT + 4, y + 8, descMeasure.lineHeight);

    y += descBoxHeight + 4;
  }

  // -------------------------------------------------------------
  // 4. QUESTIONS RENDERING ENGINE
  // -------------------------------------------------------------
  const allQuestionsForAnswerKey: Array<{
    qNum: number | string;
    letter: string;
    text: string;
  }> = [];

  const renderSingleQuestion = (question: QuizQuestion, index: number) => {
    const qNum = question.id !== undefined && question.id !== null ? question.id : index + 1;
    const questionPrompt =
      question.question || question.title || question.text || question.questionText || `Question ${qNum}`;
    const options = Array.isArray(question.options) ? question.options : [];
    const { correctIndex, correctLetter, correctText } = getAnswerDetails(question.answer, options);

    if (correctLetter) {
      allQuestionsForAnswerKey.push({
        qNum,
        letter: correctLetter,
        text: correctText,
      });
    }

    // Step A: Measure Question Text
    // Question number badge width: ~14mm
    const qPromptWidth = CONTENT_WIDTH - 18;
    const qPromptMeasure = measureText(pdf, questionPrompt, qPromptWidth, 9.5, 1.35);

    // Step B: Measure All Options
    const optLabelWidth = 10;
    const optTextWidth = CONTENT_WIDTH - optLabelWidth - 14;
    const optionsMeasures = options.map((opt, optIdx) => {
      const optLetter = String.fromCharCode(65 + optIdx);
      const isCorrect = optIdx === correctIndex;
      const measure = measureText(pdf, opt, optTextWidth, 8.5, 1.3);
      return { optLetter, text: opt, isCorrect, measure };
    });

    // Step C: Measure Answer / Explanation
    const explanationText = question.explanation ? question.explanation.trim() : "";
    const explanationMeasure = explanationText
      ? measureText(pdf, `Explanation: ${explanationText}`, CONTENT_WIDTH - 12, 7.5, 1.3)
      : null;

    // Step D: Calculate Total Question Block Height
    let totalBlockHeight = 4; // Top padding
    totalBlockHeight += Math.max(qPromptMeasure.height, 5.5); // Question prompt
    totalBlockHeight += 2.5; // Gap before options

    // Options height
    for (const optM of optionsMeasures) {
      const rowH = Math.max(optM.measure.height + 2, 5.5);
      totalBlockHeight += rowH + 1.5;
    }

    // Answer Strip height
    totalBlockHeight += 6.5;

    // Explanation height if present
    if (explanationMeasure) {
      totalBlockHeight += explanationMeasure.height + 3;
    }

    totalBlockHeight += 4; // Bottom padding & spacing

    // Check if new page is needed
    checkOrAddPage(totalBlockHeight);

    const cardStartY = y;

    // Card background & border
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    pdf.setLineWidth(0.25);
    pdf.roundedRect(MARGIN_LEFT, cardStartY, CONTENT_WIDTH, totalBlockHeight - 2, 2, 2, "FD");

    // Question Number Badge
    const badgeX = MARGIN_LEFT + 3.5;
    const badgeY = cardStartY + 3.5;
    pdf.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    pdf.roundedRect(badgeX, badgeY - 2.8, 11, 4.5, 1, 1, "F");
    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(255, 255, 255);
    pdf.text(`Q.${qNum}`, badgeX + 5.5, badgeY + 0.5, { align: "center" });

    // Question Prompt Text
    pdf.setFontSize(9.5);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    const promptStartY = cardStartY + 4.5;
    printWrappedLines(pdf, qPromptMeasure.lines, MARGIN_LEFT + 16, promptStartY, qPromptMeasure.lineHeight);

    let curY = promptStartY + qPromptMeasure.height + 2.5;

    // Render Options
    for (const optM of optionsMeasures) {
      const optRowH = Math.max(optM.measure.height + 2, 5.5);
      const isCorrect = optM.isCorrect;

      // Option Row Background
      if (isCorrect) {
        pdf.setFillColor(COLOR_GREEN_BG[0], COLOR_GREEN_BG[1], COLOR_GREEN_BG[2]);
        pdf.setDrawColor(COLOR_GREEN_BORDER[0], COLOR_GREEN_BORDER[1], COLOR_GREEN_BORDER[2]);
        pdf.setLineWidth(0.3);
      } else {
        pdf.setFillColor(250, 250, 250);
        pdf.setDrawColor(235, 238, 242);
        pdf.setLineWidth(0.2);
      }
      pdf.roundedRect(MARGIN_LEFT + 6, curY, CONTENT_WIDTH - 12, optRowH, 1, 1, "FD");

      // Option Letter Badge
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      if (isCorrect) {
        pdf.setTextColor(COLOR_GREEN_TEXT[0], COLOR_GREEN_TEXT[1], COLOR_GREEN_TEXT[2]);
      } else {
        pdf.setTextColor(COLOR_MUTED_TEXT[0], COLOR_MUTED_TEXT[1], COLOR_MUTED_TEXT[2]);
      }
      pdf.text(`(${optM.optLetter})`, MARGIN_LEFT + 9, curY + 3.8);

      // Option Text
      pdf.setFontSize(8.5);
      pdf.setFont("helvetica", isCorrect ? "bold" : "normal");
      if (isCorrect) {
        pdf.setTextColor(COLOR_GREEN_TEXT[0], COLOR_GREEN_TEXT[1], COLOR_GREEN_TEXT[2]);
      } else {
        pdf.setTextColor(COLOR_DARK_TEXT[0], COLOR_DARK_TEXT[1], COLOR_DARK_TEXT[2]);
      }
      printWrappedLines(pdf, optM.measure.lines, MARGIN_LEFT + 18, curY + 3.8, optM.measure.lineHeight);

      // Correct Badge on the right
      if (isCorrect) {
        pdf.setFontSize(7.5);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(COLOR_GREEN_TEXT[0], COLOR_GREEN_TEXT[1], COLOR_GREEN_TEXT[2]);
        pdf.text("[ Correct Answer ]", PAGE_WIDTH - MARGIN_RIGHT - 8, curY + 3.8, { align: "right" });
      }

      curY += optRowH + 1.5;
    }

    // Answer Strip Box
    pdf.setFillColor(COLOR_GREEN_BG[0], COLOR_GREEN_BG[1], COLOR_GREEN_BG[2]);
    pdf.setDrawColor(COLOR_GREEN_BORDER[0], COLOR_GREEN_BORDER[1], COLOR_GREEN_BORDER[2]);
    pdf.setLineWidth(0.2);
    pdf.roundedRect(MARGIN_LEFT + 6, curY, CONTENT_WIDTH - 12, 5.5, 1, 1, "FD");

    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(COLOR_GREEN_TEXT[0], COLOR_GREEN_TEXT[1], COLOR_GREEN_TEXT[2]);
    const answerLabel = correctLetter
      ? `Correct Answer: Option (${correctLetter}) ${correctText ? "· " + correctText : ""}`
      : `Answer: ${question.answer || "N/A"}`;
    pdf.text(answerLabel, MARGIN_LEFT + 9, curY + 3.8);

    curY += 6.5;

    // Explanation Box if present
    if (explanationMeasure && explanationText) {
      pdf.setFillColor(245, 247, 250);
      pdf.setDrawColor(225, 230, 238);
      pdf.setLineWidth(0.2);
      pdf.roundedRect(MARGIN_LEFT + 6, curY, CONTENT_WIDTH - 12, explanationMeasure.height + 2, 1, 1, "FD");

      pdf.setFontSize(7.5);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(COLOR_MUTED_TEXT[0], COLOR_MUTED_TEXT[1], COLOR_MUTED_TEXT[2]);
      printWrappedLines(pdf, explanationMeasure.lines, MARGIN_LEFT + 9, curY + 3.5, explanationMeasure.lineHeight);

      curY += explanationMeasure.height + 3;
    }

    y = cardStartY + totalBlockHeight;
  };

  const renderSectionHeader = (title: string, subInfo?: string) => {
    checkOrAddPage(14);
    pdf.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    pdf.roundedRect(MARGIN_LEFT, y, CONTENT_WIDTH, 7.5, 1.5, 1.5, "F");

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(255, 255, 255);
    pdf.text(title.toUpperCase(), MARGIN_LEFT + 5, y + 5);

    if (subInfo) {
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text(subInfo, PAGE_WIDTH - MARGIN_RIGHT - 5, y + 5, { align: "right" });
    }

    y += 10.5;
  };

  // -------------------------------------------------------------
  // 5. PROCESS SHIFTS & SETS
  // -------------------------------------------------------------
  if (data.shiftsMap && Object.keys(data.shiftsMap).length > 0) {
    Object.entries(data.shiftsMap).forEach(([sNumStr, setsObj]) => {
      const sNum = parseInt(sNumStr, 10);
      const totalShiftQ = Object.values(setsObj).reduce((sum, list) => sum + (list?.length || 0), 0);
      if (totalShiftQ === 0) return;

      renderSectionHeader(
        `SHIFT ${sNum} — EXAMINATION QUESTION SETS`,
        `${totalShiftQ} Questions Total`
      );

      Object.entries(setsObj).forEach(([setLetter, qList]) => {
        if (!qList || qList.length === 0) return;

        checkOrAddPage(10);
        pdf.setFontSize(9.5);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
        pdf.text(`Question Set ${setLetter.toUpperCase()} (${qList.length} Questions)`, MARGIN_LEFT + 2, y + 4);
        pdf.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
        pdf.setLineWidth(0.3);
        pdf.line(MARGIN_LEFT, y + 6, PAGE_WIDTH - MARGIN_RIGHT, y + 6);
        y += 9;

        qList.forEach((q, idx) => renderSingleQuestion(q, idx));
      });
    });
  } else if (data.questionsBySet && Object.keys(data.questionsBySet).length > 0) {
    const sortedSets = Object.keys(data.questionsBySet).sort();
    sortedSets.forEach((setKey) => {
      const qList = data.questionsBySet![setKey];
      if (!qList || qList.length === 0) return;

      renderSectionHeader(
        `QUESTION SET ${setKey.toUpperCase()}`,
        `${qList.length} Question(s)`
      );

      qList.forEach((q, idx) => renderSingleQuestion(q, idx));
    });
  } else if (data.questions && data.questions.length > 0) {
    renderSectionHeader(
      data.setNumber ? `QUESTION SET ${data.setNumber.toUpperCase()}` : "EXAMINATION QUESTIONS",
      `${data.questions.length} Question(s)`
    );

    data.questions.forEach((q, idx) => renderSingleQuestion(q, idx));
  }

  // -------------------------------------------------------------
  // 6. ANSWER KEY SUMMARY TABLE (End of Document)
  // -------------------------------------------------------------
  if (allQuestionsForAnswerKey.length > 0) {
    const cols = 5;
    const numRows = Math.ceil(allQuestionsForAnswerKey.length / cols);
    const tableHeight = numRows * 5.5 + 16;

    checkOrAddPage(tableHeight);

    renderSectionHeader("ANSWER KEY SUMMARY TABLE", `${allQuestionsForAnswerKey.length} Total Questions`);

    const cellWidth = (CONTENT_WIDTH - 8) / cols;
    let tableY = y;

    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < cols; c++) {
        const itemIdx = r * cols + c;
        if (itemIdx >= allQuestionsForAnswerKey.length) break;

        const item = allQuestionsForAnswerKey[itemIdx];
        const cellX = MARGIN_LEFT + 4 + c * cellWidth;

        pdf.setFillColor(r % 2 === 0 ? 245 : 255, r % 2 === 0 ? 247 : 255, r % 2 === 0 ? 250 : 255);
        pdf.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
        pdf.setLineWidth(0.2);
        pdf.roundedRect(cellX, tableY, cellWidth - 2, 5, 0.5, 0.5, "FD");

        pdf.setFontSize(7.5);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(COLOR_DARK_TEXT[0], COLOR_DARK_TEXT[1], COLOR_DARK_TEXT[2]);
        pdf.text(`Q.${item.qNum}:`, cellX + 2, tableY + 3.5);

        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(COLOR_GREEN_TEXT[0], COLOR_GREEN_TEXT[1], COLOR_GREEN_TEXT[2]);
        pdf.text(`(${item.letter})`, cellX + cellWidth - 7, tableY + 3.5);
      }
      tableY += 5.5;
    }

    y = tableY + 4;
  }

  // -------------------------------------------------------------
  // 7. RUNNING FOOTER ON ALL PAGES
  // -------------------------------------------------------------
  const totalPages = (pdf.internal as any).getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);

    pdf.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    pdf.setLineWidth(0.25);
    pdf.line(MARGIN_LEFT, PAGE_HEIGHT - 10, PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - 10);

    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(COLOR_MUTED_TEXT[0], COLOR_MUTED_TEXT[1], COLOR_MUTED_TEXT[2]);
    pdf.text(
      "CodeBreakers Examination System · Confidential & Official Evaluation Document",
      MARGIN_LEFT,
      PAGE_HEIGHT - 6.5
    );

    pdf.text(
      `Page ${p} of ${totalPages}`,
      PAGE_WIDTH - MARGIN_RIGHT,
      PAGE_HEIGHT - 6.5,
      { align: "right" }
    );
  }

  return pdf.output("blob");
}

export function downloadQuizPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
