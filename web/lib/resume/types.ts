export interface PersonalInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  summary: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  gpa?: string;
  bullets?: string[];
}

export interface ProjectItem {
  id: string;
  name: string;
  techStack: string[];
  liveUrl?: string;
  githubUrl?: string;
  date?: string;
  bullets: string[];
}

export interface SkillCategory {
  id: string;
  name: string;
  skills: string[];
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  url?: string;
}

export interface AchievementItem {
  id: string;
  title: string;
  organization?: string;
  date?: string;
  description?: string;
}

export interface CustomSectionItem {
  id: string;
  title: string;
  subtitle?: string;
  date?: string;
  bullets: string[];
}

export interface CustomSection {
  id: string;
  title: string;
  items: CustomSectionItem[];
}

export interface ResumeTheme {
  primaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
  fontFamily: "Computer Modern" | "Times New Roman" | "Calibri" | "Inter" | "Roboto" | "Outfit" | "Merriweather" | "Playfair Display" | "Source Code Pro";
  fontSize: "sm" | "md" | "lg";
  margins: "compact" | "normal" | "spacious";
  lineHeight: "tight" | "normal" | "relaxed";
  layout: "single-column" | "two-column-left" | "two-column-right" | "compact-grid";
  sectionOrder: string[]; // ['summary', 'experience', 'projects', 'education', 'skills', 'certifications', 'achievements', ...]
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  experience: ExperienceItem[];
  education: EducationItem[];
  projects: ProjectItem[];
  skills: SkillCategory[];
  certifications: CertificationItem[];
  achievements: AchievementItem[];
  customSections: CustomSection[];
  theme: ResumeTheme;
}

export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  category: "ats-classic" | "faang-tech" | "executive" | "two-column" | "minimal-fresher" | "creative-tech";
  badgeText: string;
  isLatexNative: boolean;
  defaultMode: "latex" | "visual";
  previewGradient: string;
  defaultData: ResumeData;
  defaultLatex: string;
}

export interface AtsMetricItem {
  category: string;
  score: number; // 0 - 100
  weight: number;
  status: "good" | "warning" | "error";
  feedback: string;
  actionableTip?: string;
}

export interface AtsAnalysisResult {
  overallScore: number; // 0 - 100
  level: "Excellent" | "Good" | "Needs Improvement" | "Critical Issues";
  metrics: AtsMetricItem[];
  detectedKeywords: string[];
  suggestedKeywords: string[];
  bulletPointStats: {
    totalBulletPoints: number;
    withMetricsOrNumbers: number;
    actionVerbCount: number;
    averageLength: number;
  };
  formattingWarnings: string[];
}
