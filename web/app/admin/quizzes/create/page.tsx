import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CreateQuizForm from "./_components/create-quiz-form";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import AudiencePicker from "./_components/audience-picker";

export default async function CreateQuizPage({
  searchParams,
}: {
  searchParams: Promise<{ audience?: string }>;
}) {
  const { audience } = await searchParams;
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((m) => m.headers()),
  });

  if (!session?.user?.id) {
    redirect("/admin/quizzes");
  }

  // If no audience selected yet, show the picker
  if (!audience || (audience !== "INTERNAL" && audience !== "EXTERNAL")) {
    return <AudiencePicker />;
  }

  const forms = await prisma.form.findMany({
    select: { id: true, formId: true, title: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 w-full max-w-8xl mx-auto">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create New Quiz</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Configure a new {audience === "EXTERNAL" ? "external kiosk" : "internal club"} quiz.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-lg">Quiz Configuration</CardTitle>
          <CardDescription>
            Set up the quiz details, question sets, and scheduling.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <CreateQuizForm
            userId={session.user.id}
            forms={forms}
            initialAudience={audience as "INTERNAL" | "EXTERNAL"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
