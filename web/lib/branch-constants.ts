/**
 * CodeBreakers Branch Definitions & Formatting Utilities
 */

export interface BranchOption {
  code: string;
  name: string;
  shortLabel: string;
  fullLabel: string;
}

export const BRANCH_OPTIONS: BranchOption[] = [
  {
    code: "CSE",
    name: "Computer Science & Engineering",
    shortLabel: "CSE",
    fullLabel: "Computer Science & Engineering (CSE)",
  },
  {
    code: "ECE",
    name: "Electronics & Communication Engineering",
    shortLabel: "ECE",
    fullLabel: "Electronics & Communication Engineering (ECE)",
  },
  {
    code: "EE",
    name: "Electrical Engineering",
    shortLabel: "EE",
    fullLabel: "Electrical Engineering (EE)",
  },
  {
    code: "ME",
    name: "Mechanical Engineering",
    shortLabel: "ME",
    fullLabel: "Mechanical Engineering (ME)",
  },
  {
    code: "CE",
    name: "Civil Engineering",
    shortLabel: "CE",
    fullLabel: "Civil Engineering (CE)",
  },
  {
    code: "Other",
    name: "Other",
    shortLabel: "Other",
    fullLabel: "Other",
  },
];

/**
 * Given any branch string (e.g. "CSE", "cse", "Computer Science & Engineering"),
 * returns the full display name (e.g. "Computer Science & Engineering").
 */
export function getBranchFullName(rawBranch: string | null | undefined): string {
  if (!rawBranch || !rawBranch.trim()) return "";
  const trimmed = rawBranch.trim();
  const lower = trimmed.toLowerCase();

  if (lower === "cse" || lower.includes("computer science") || lower.includes("cs")) {
    return "Computer Science & Engineering";
  }
  if (
    lower === "ece" ||
    lower.includes("electronics & communication") ||
    lower.includes("electronics and communication") ||
    lower.includes("etc") ||
    lower.includes("telecommunication")
  ) {
    return "Electronics & Communication Engineering";
  }
  if (lower === "ee" || lower.includes("electrical")) {
    return "Electrical Engineering";
  }
  if (lower === "me" || lower.includes("mechanical")) {
    return "Mechanical Engineering";
  }
  if (lower === "ce" || lower.includes("civil")) {
    return "Civil Engineering";
  }
  return trimmed;
}

/**
 * Given any branch string, returns the short code (e.g. "CSE", "ECE", "EE", "ME", "CE", "Other").
 */
export function getBranchCode(rawBranch: string | null | undefined): string {
  if (!rawBranch || !rawBranch.trim()) return "";
  const trimmed = rawBranch.trim();
  const lower = trimmed.toLowerCase();

  if (lower === "cse" || lower.includes("computer science") || lower.includes("cs")) {
    return "CSE";
  }
  if (
    lower === "ece" ||
    lower.includes("electronics & communication") ||
    lower.includes("electronics and communication") ||
    lower.includes("etc") ||
    lower.includes("telecommunication")
  ) {
    return "ECE";
  }
  if (lower === "ee" || lower.includes("electrical")) {
    return "EE";
  }
  if (lower === "me" || lower.includes("mechanical")) {
    return "ME";
  }
  if (lower === "ce" || lower.includes("civil")) {
    return "CE";
  }
  return trimmed;
}
