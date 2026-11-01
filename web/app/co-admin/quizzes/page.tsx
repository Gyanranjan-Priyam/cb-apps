import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain } from "lucide-react";
import { getAllQuizzes } from "@/app/admin/quizzes/actions";
import QuizzesTable from "@/app/admin/quizzes/_components/quizzes-table";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quiz System Management | Co-Admin",
  description: "Manage external quiz systems and assign students to systems",
};

export default async function CoAdminQuizzesPage() {
  const result = await getAllQuizzes();
  const quizzes = result.status === "success" ? result.data : [];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Brain className="h-7 w-7" />
          Quiz System Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Assign students to external quiz systems and manage real-time quiz monitoring.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Quizzes</CardTitle>
          <CardDescription>
            Select a quiz to manage connected kiosk systems and assign students.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuizzesTable quizzes={quizzes} systemsOnly={true} baseUrl="/co-admin/quizzes" />
        </CardContent>
      </Card>
    </div>
  );
}
