import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserResumes } from "./actions";
import { ResumeHubClient } from "./_components/resume-hub-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ATS Resume Builder",
  description:
    "Build ATS-friendly tech resumes with an Overleaf-style LaTeX code editor and Canva-style visual builder with real-time live preview.",
};

export default async function ResumeBuilderPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const resumes = await getUserResumes();

  return <ResumeHubClient initialResumes={resumes} />;
}
