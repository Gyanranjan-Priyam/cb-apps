import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuizParticipants } from "./actions";
import ParticipantsTable from "./_components/participants-table";

interface PageProps {
  params: Promise<{
    quizId: string;
  }>;
}

export default async function QuizPointsPage({ params }: PageProps) {
  const { quizId } = await params;
  
  const result = await getQuizParticipants(quizId);

  if (result.status === "error" || !result.data.quiz) {
    notFound();
  }

  const { quiz, participants } = result.data;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/points">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {quiz.title}
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage points for quiz participants
          </p>
        </div>
      </div>

      {/* Quiz Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Participants</CardDescription>
            <CardTitle className="text-3xl">{participants.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Attempts</CardDescription>
            <CardTitle className="text-3xl">
              {participants.reduce((sum: number, p: any) => sum + p.attempts.length, 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Points Per Question</CardDescription>
            <CardTitle className="text-3xl">{quiz.pointsPerQuestion}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Quiz Sets</CardDescription>
            <CardTitle className="text-3xl">{quiz.sets}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Participants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Participants</CardTitle>
          <CardDescription>
            Review and approve points for quiz participants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ParticipantsTable 
            participants={participants} 
            quizId={quiz.id}
            pointsPerQuestion={quiz.pointsPerQuestion}
          />
        </CardContent>
      </Card>
    </div>
  );
}
