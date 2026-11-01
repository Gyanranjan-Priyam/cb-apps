import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getQuizByQuizId } from "../../actions";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import SystemsManagementView from "./_components/systems-management-view";

export default async function SystemRegistrationPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;
  const result = await getQuizByQuizId(quizId);

  if (result.status === "error" || !result.data) {
    notFound();
  }

  const quiz = result.data;

  if (quiz.targetAudience !== "EXTERNAL") {
    notFound();
  }

  // Fetch registered systems for this quiz
  const systems = await prisma.externalQuizSystem.findMany({
    where: { quizId: quiz.id },
  });

  // Natural alphanumeric sorting by systemNumber (e.g. 1, 2, 10, 32, 37)
  systems.sort((a, b) =>
    a.systemNumber.localeCompare(b.systemNumber, undefined, { numeric: true, sensitivity: "base" })
  );

  const numSets = quiz.sets || 1;

  // Fetch form responses if a registration form is linked
  let formResponses: Array<{ id: string; submittedByName?: string; submittedByEmail?: string }> = [];
  if (quiz.formId) {
    try {
      const raw = await prisma.formResponse.findMany({
        where: { formId: quiz.formId },
        select: { id: true, answers: true },
        orderBy: { createdAt: "desc" },
      });
      formResponses = raw.map((r) => {
        const a = (r.answers || {}) as Record<string, unknown>;
        let name = "";
        let email = "";
        for (const [k, v] of Object.entries(a)) {
          if (typeof v === "string") {
            const val = v.trim();
            const key = k.toLowerCase();
            if (!email && (key.includes("email") || (val.includes("@") && val.includes(".")))) email = val;
            if (!name && (key.includes("name") || key.includes("candidate") || key.includes("student")) && val) name = val;
          }
        }
        return { id: r.id, submittedByName: name || `Response ${r.id.slice(0, 6)}`, submittedByEmail: email };
      });
    } catch (e) {
      console.error("Error loading form responses:", e);
    }
  }

  const serializedSystems = systems.map((s, idx) => ({
    id: s.id,
    systemCode: s.systemCode,
    systemNumber: s.systemNumber,
    status: s.status,
    assignedStudentName: s.assignedStudentName,
    assignedStudentEmail: s.assignedStudentEmail,
    assignedSet: s.assignedSet || String.fromCharCode(65 + (idx % numSets)),
    createdAt: s.createdAt?.toISOString() ?? null,
    completedAt: s.completedAt?.toISOString() ?? null,
  }));

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-8xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Registration & Candidate Assignment</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{quiz.title}</p>
        </div>
      </div>

      {/* Main Real-time Management View with Sticky Sidebar */}
      <SystemsManagementView
        quizId={quiz.id}
        quizSlug={quizId}
        quizTitle={quiz.title}
        accessCode={quiz.accessCode}
        sets={quiz.sets}
        shifts={quiz.shifts || 1}
        shiftsJson={quiz.shiftsJson || null}
        activeShift={quiz.activeShift || 1}
        formId={quiz.formId}
        initialSystems={serializedSystems}
        formResponses={formResponses}
      />
    </div>
  );
}
