import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldBan } from "lucide-react";
import Link from "next/link";
import { getQuizzesWithBlockedMembers } from "./actions";
import type { Metadata } from "next";
import { BlockedMembersList } from "./_components/blocked-members-list";

export const metadata: Metadata = {
  title: "Blocked Members - Quiz Management",
  description: "View banned members across all quizzes",
};

export default async function BlockedMembersPage() {
  const result = await getQuizzesWithBlockedMembers();
  const quizzes = result.status === "success" ? result.data : [];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/quizzes">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Blocked Members
          </h1>
          <p className="text-muted-foreground mt-2">
            View and manage banned members across all quizzes
          </p>
        </div>
      </div>

      {result.status === "error" ? (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>{result.message}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Blocked Members by Quiz</CardTitle>
            <CardDescription>
              {quizzes.length === 0 
                ? "There are currently no members blocked from any quiz."
                : `View members who have been blocked from specific quizzes due to violations. ${quizzes.length} ${quizzes.length === 1 ? "quiz has" : "quizzes have"} blocked members.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BlockedMembersList initialData={quizzes} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
