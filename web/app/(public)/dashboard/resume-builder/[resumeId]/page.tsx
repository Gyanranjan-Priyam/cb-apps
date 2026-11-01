import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getResumeById } from "../actions";
import { StudioEditor } from "@/components/resume-builder/studio-editor";
import type { Metadata } from "next";

interface ResumeStudioPageProps {
  params: Promise<{ resumeId: string }>;
}

export async function generateMetadata({ params }: ResumeStudioPageProps): Promise<Metadata> {
  const { resumeId } = await params;
  const resume = await getResumeById(resumeId);
  return {
    title: resume ? `${resume.title} | Resume Studio` : "Resume Studio",
    description: "Edit your resume with Overleaf LaTeX editor or Canva Visual builder with live real-time preview.",
  };
}

export default async function ResumeStudioPage({ params }: ResumeStudioPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const { resumeId } = await params;
  const resume = await getResumeById(resumeId);

  if (!resume) {
    notFound();
  }

  return <StudioEditor initialResume={resume} />;
}
