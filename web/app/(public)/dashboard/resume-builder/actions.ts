"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { RESUME_TEMPLATES, defaultResumeData, jakesResumeLatex } from "@/lib/resume/templates";
import type { ResumeData } from "@/lib/resume/types";
import { analyzeResumeATS } from "@/lib/resume/ats-analyzer";

export interface ResumeSummaryItem {
  id: string;
  title: string;
  mode: "latex" | "visual";
  templateId: string;
  targetRole: string | null;
  atsScore: number | null;
  createdAt: string;
  updatedAt: string;
}

export async function getUserResumes(): Promise<ResumeSummaryItem[]> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return [];
  }

  const resumes = await prisma.resume.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      title: true,
      mode: true,
      templateId: true,
      targetRole: true,
      atsScore: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return resumes.map((r) => ({
    id: r.id,
    title: r.title,
    mode: (r.mode === "latex" ? "latex" : "visual") as "latex" | "visual",
    templateId: r.templateId,
    targetRole: r.targetRole,
    atsScore: r.atsScore,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function getResumeById(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  const resume = await prisma.resume.findUnique({
    where: { id },
  });

  if (!resume || resume.userId !== session.user.id) {
    return null;
  }

  return {
    id: resume.id,
    title: resume.title,
    mode: (resume.mode === "latex" ? "latex" : "visual") as "latex" | "visual",
    templateId: resume.templateId,
    targetRole: resume.targetRole,
    atsScore: resume.atsScore,
    latexContent: resume.latexContent,
    visualData: resume.visualData as unknown as ResumeData,
    createdAt: resume.createdAt.toISOString(),
    updatedAt: resume.updatedAt.toISOString(),
  };
}

export async function createResume(input: {
  title?: string;
  templateId?: string;
  mode?: "latex" | "visual";
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const template = RESUME_TEMPLATES.find((t) => t.id === input.templateId) || RESUME_TEMPLATES[0];
  const initialMode = input.mode || template.defaultMode || "latex";

  const userProfile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      mobileNumber: true,
      whatsappNumber: true,
      collegeName: true,
      branch: true,
      githubUsername: true,
    },
  });

  // Personalize initial template data with user details
  const initialData: ResumeData = {
    ...template.defaultData,
    personalInfo: {
      ...template.defaultData.personalInfo,
      fullName: userProfile?.name || template.defaultData.personalInfo.fullName,
      email: userProfile?.email || template.defaultData.personalInfo.email,
      phone: userProfile?.mobileNumber || userProfile?.whatsappNumber || template.defaultData.personalInfo.phone,
      location: userProfile?.collegeName ? "Odisha, India" : template.defaultData.personalInfo.location,
      github: userProfile?.githubUsername ? `github.com/${userProfile.githubUsername}` : template.defaultData.personalInfo.github,
    },
  };

  const initialLatex = template.defaultLatex || jakesResumeLatex;
  const atsResult = analyzeResumeATS(initialData, initialLatex);

  const resume = await prisma.resume.create({
    data: {
      userId: session.user.id,
      title: input.title?.trim() || `${template.name} - Resume`,
      mode: initialMode,
      templateId: template.id,
      latexContent: initialLatex,
      visualData: initialData as unknown as import("@prisma/client").Prisma.InputJsonValue,
      atsScore: atsResult.overallScore,
    },
  });

  revalidatePath("/dashboard/resume-builder");
  return resume;
}

export async function updateResume(
  id: string,
  data: {
    title?: string;
    mode?: "latex" | "visual";
    templateId?: string;
    latexContent?: string;
    visualData?: ResumeData;
    targetRole?: string;
  }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const existing = await prisma.resume.findUnique({
    where: { id },
  });

  if (!existing || existing.userId !== session.user.id) {
    throw new Error("Resume not found or unauthorized");
  }

  const updatedVisualData = data.visualData || (existing.visualData as unknown as ResumeData);
  const updatedLatex = data.latexContent !== undefined ? data.latexContent : existing.latexContent;
  const atsResult = analyzeResumeATS(updatedVisualData, updatedLatex);

  const updated = await prisma.resume.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.mode !== undefined && { mode: data.mode }),
      ...(data.templateId !== undefined && { templateId: data.templateId }),
      ...(data.latexContent !== undefined && { latexContent: data.latexContent }),
      ...(data.visualData !== undefined && {
        visualData: data.visualData as unknown as import("@prisma/client").Prisma.InputJsonValue,
      }),
      ...(data.targetRole !== undefined && { targetRole: data.targetRole }),
      atsScore: atsResult.overallScore,
    },
  });

  revalidatePath(`/dashboard/resume-builder/${id}`);
  revalidatePath("/dashboard/resume-builder");

  return {
    success: true,
    atsScore: atsResult.overallScore,
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function deleteResume(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  await prisma.resume.deleteMany({
    where: { id, userId: session.user.id },
  });

  revalidatePath("/dashboard/resume-builder");
  return { success: true };
}

export async function duplicateResume(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const existing = await prisma.resume.findUnique({
    where: { id },
  });

  if (!existing || existing.userId !== session.user.id) {
    throw new Error("Resume not found");
  }

  const copy = await prisma.resume.create({
    data: {
      userId: session.user.id,
      title: `${existing.title} (Copy)`,
      mode: existing.mode,
      templateId: existing.templateId,
      latexContent: existing.latexContent,
      visualData: existing.visualData as import("@prisma/client").Prisma.InputJsonValue,
      targetRole: existing.targetRole,
      atsScore: existing.atsScore,
    },
  });

  revalidatePath("/dashboard/resume-builder");
  return copy;
}
