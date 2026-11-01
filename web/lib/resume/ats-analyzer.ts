import type { ResumeData, AtsAnalysisResult, AtsMetricItem } from "./types";

const ACTION_VERBS = [
  "architected", "engineered", "built", "developed", "deployed", "optimized",
  "spearheaded", "accelerated", "orchestrated", "refactored", "implemented",
  "designed", "reduced", "increased", "boosted", "delivered", "mentored",
  "automated", "streamlined", "constructed", "integrated", "benchmarked",
  "scaled", "collaborated", "managed", "created", "led", "enhanced", "executed"
];

const COMMON_TECH_KEYWORDS = [
  "TypeScript", "JavaScript", "Python", "Go", "Java", "C++", "C#", "SQL", "NoSQL",
  "React", "Next.js", "Node.js", "Express", "TailwindCSS", "PostgreSQL", "MongoDB",
  "Redis", "Docker", "Kubernetes", "AWS", "GCP", "Azure", "CI/CD", "Git", "REST API",
  "GraphQL", "Microservices", "System Design", "Agile", "Linux", "gRPC"
];

export function analyzeResumeATS(data: ResumeData, latexSource?: string): AtsAnalysisResult {
  const metrics: AtsMetricItem[] = [];
  const formattingWarnings: string[] = [];

  const { personalInfo, experience, education, projects, skills } = data;

  // 1. Contact Information Completeness (Weight: 15%)
  let contactScore = 0;
  if (personalInfo.fullName?.trim()) contactScore += 20;
  if (personalInfo.email?.includes("@")) contactScore += 25;
  if (personalInfo.phone?.trim()) contactScore += 20;
  if (personalInfo.location?.trim()) contactScore += 15;
  if (personalInfo.linkedin || personalInfo.github || personalInfo.portfolio) contactScore += 20;

  metrics.push({
    category: "Contact & Header Info",
    score: contactScore,
    weight: 15,
    status: contactScore >= 90 ? "good" : contactScore >= 60 ? "warning" : "error",
    feedback: contactScore >= 90
      ? "All essential contact details and portfolio links are present."
      : "Ensure email, phone, location, and GitHub/LinkedIn profile links are included.",
    actionableTip: !personalInfo.linkedin && !personalInfo.github ? "Add a LinkedIn or GitHub profile URL to boost recruiter trust." : undefined,
  });

  // 2. Summary & Role Alignment (Weight: 10%)
  let summaryScore = 0;
  if (personalInfo.summary?.trim().length > 80) summaryScore = 100;
  else if (personalInfo.summary?.trim().length > 30) summaryScore = 65;
  else summaryScore = 30;

  metrics.push({
    category: "Professional Summary",
    score: summaryScore,
    weight: 10,
    status: summaryScore >= 80 ? "good" : "warning",
    feedback: summaryScore >= 80
      ? "Concise, punchy professional summary found."
      : "Add a 2-3 sentence summary highlighting your core tech stack, years of experience, and top achievements.",
  });

  // 3. Experience & Bullet Points Quality (Weight: 30%)
  let allBullets: string[] = [];
  experience.forEach((e) => {
    if (e.bullets) allBullets.push(...e.bullets);
  });
  projects.forEach((p) => {
    if (p.bullets) allBullets.push(...p.bullets);
  });

  let metricsWithNumbers = 0;
  let actionVerbCount = 0;
  let totalLength = 0;

  allBullets.forEach((bullet) => {
    totalLength += bullet.length;
    // Check for metrics/numbers/percentages ($45k, 40%, 2.5M, 100k+, 35%)
    if (/(\d+[%kM$+]|\$\d+|\d+\+?)/i.test(bullet)) {
      metricsWithNumbers++;
    }
    // Check for action verbs at beginning or within bullet
    const words = bullet.toLowerCase().split(/\s+/);
    if (words.some((w) => ACTION_VERBS.includes(w))) {
      actionVerbCount++;
    }
  });

  const totalBulletPoints = allBullets.length;
  const averageLength = totalBulletPoints > 0 ? Math.round(totalLength / totalBulletPoints) : 0;

  let experienceScore = 0;
  if (totalBulletPoints >= 4) experienceScore += 30;
  else if (totalBulletPoints >= 2) experienceScore += 15;

  const metricPercentage = totalBulletPoints > 0 ? (metricsWithNumbers / totalBulletPoints) * 100 : 0;
  if (metricPercentage >= 40) experienceScore += 35;
  else if (metricPercentage >= 20) experienceScore += 20;

  const actionVerbPercentage = totalBulletPoints > 0 ? (actionVerbCount / totalBulletPoints) * 100 : 0;
  if (actionVerbPercentage >= 50) experienceScore += 35;
  else if (actionVerbPercentage >= 25) experienceScore += 20;

  metrics.push({
    category: "Action Verbs & Impact Metrics",
    score: Math.min(100, experienceScore),
    weight: 30,
    status: experienceScore >= 75 ? "good" : experienceScore >= 50 ? "warning" : "error",
    feedback: `${metricsWithNumbers} of ${totalBulletPoints} bullet points contain quantifiable metrics (e.g. percentages, numbers, latency reduction).`,
    actionableTip: metricPercentage < 40 ? "Include specific results (e.g., 'reduced latency by 30%', 'scaled to 500k users') in more bullets." : undefined,
  });

  // 4. Technical Skills & Keyword Density (Weight: 25%)
  const allSkillsList: string[] = [];
  skills.forEach((s) => allSkillsList.push(...s.skills));

  let skillScore = 0;
  if (allSkillsList.length >= 12) skillScore = 100;
  else if (allSkillsList.length >= 6) skillScore = 75;
  else if (allSkillsList.length >= 3) skillScore = 40;

  const detectedKeywords = allSkillsList.filter((s) => s.trim().length > 0);
  const suggestedKeywords = COMMON_TECH_KEYWORDS.filter(
    (kw) => !allSkillsList.some((s) => s.toLowerCase() === kw.toLowerCase())
  ).slice(0, 6);

  metrics.push({
    category: "Technical Skills & Keywords",
    score: skillScore,
    weight: 25,
    status: skillScore >= 80 ? "good" : "warning",
    feedback: `Found ${detectedKeywords.length} distinct technical skill keywords categorized cleanly.`,
    actionableTip: skillScore < 80 ? "Categorize skills into Languages, Frameworks, Developer Tools, and Cloud to maximize ATS keyword parsing." : undefined,
  });

  // 5. Education & Credentials (Weight: 20%)
  let educationScore = 0;
  if (education.length > 0) {
    educationScore += 60;
    if (education.some((e) => e.degree && e.institution)) educationScore += 20;
    if (education.some((e) => e.gpa || (e.bullets && e.bullets.length > 0))) educationScore += 20;
  }

  metrics.push({
    category: "Education & Credentials",
    score: educationScore,
    weight: 20,
    status: educationScore >= 80 ? "good" : "warning",
    feedback: education.length > 0
      ? "Degree, university, graduation date, and academic achievements are well formatted."
      : "Add your university degree, major, and graduation year.",
  });

  // Check formatting warnings (LaTeX or Visual)
  if (latexSource) {
    if (latexSource.includes("\\usepackage{color}") && !latexSource.includes("glyphtounicode")) {
      formattingWarnings.push("Include glyphtounicode in LaTeX preamble for optimal machine readability.");
    }
  }

  if (averageLength > 200) {
    formattingWarnings.push("Some bullet points are overly verbose. Aim for 1-2 lines per bullet point.");
  }

  // Calculate Overall Weighted Score (0 - 100)
  let weightedSum = 0;
  let totalWeight = 0;
  metrics.forEach((m) => {
    weightedSum += (m.score * m.weight);
    totalWeight += m.weight;
  });

  const overallScore = Math.round(weightedSum / totalWeight);

  let level: AtsAnalysisResult["level"] = "Good";
  if (overallScore >= 85) level = "Excellent";
  else if (overallScore >= 70) level = "Good";
  else if (overallScore >= 50) level = "Needs Improvement";
  else level = "Critical Issues";

  return {
    overallScore,
    level,
    metrics,
    detectedKeywords,
    suggestedKeywords,
    bulletPointStats: {
      totalBulletPoints,
      withMetricsOrNumbers: metricsWithNumbers,
      actionVerbCount,
      averageLength,
    },
    formattingWarnings,
  };
}
