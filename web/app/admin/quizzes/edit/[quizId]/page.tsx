import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getQuizByQuizId } from "../../actions";
import { notFound } from "next/navigation";
import EditQuizForm from "./_components/edit-quiz-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function EditQuizPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params;
  const result = await getQuizByQuizId(quizId);

  if (result.status === "error" || !result.data) {
    notFound();
  }

  const quiz = result.data;

  const forms = await prisma.form.findMany({
    select: { id: true, formId: true, title: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-8xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Quiz</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {quiz.title} <span className="font-mono text-xs">({quiz.quizId})</span>
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-lg">Quiz Settings & Question Sets</CardTitle>
          <CardDescription>Update quiz configuration, access codes, and questions.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <EditQuizForm quiz={quiz} forms={forms} />
        </CardContent>
      </Card>
    </div>
  );
}
