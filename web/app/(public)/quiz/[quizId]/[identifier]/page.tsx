import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/app/data/admin/get-current-user";
import { prisma } from "@/lib/db";
import { isSystemAdminRole } from "@/lib/member-roles";
import QuizProctorInterface from "./_components/quiz-proctor-interface";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { BannedUserScreen, QuizBlockedScreen } from "./_components/quiz-error-screens";

export default async function QuizProctorPage({ 
  params 
}: { 
  params: Promise<{ quizId: string; identifier: string }> 
}) {
  const { quizId, identifier } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user is banned
  if (user.banned) {
    return <BannedUserScreen user={{
      banReason: user.banReason ?? null,
      banExpires: user.banExpires?.toISOString() ?? null,
    }} />;
  }

  // Fetch quiz details
  const quiz = await prisma.quiz.findUnique({
    where: { quizId },
  });

  if (!quiz || !quiz.isActive) {
    notFound();
  }

  // Verify the identifier matches the current user
  const isValidUser = 
    (user as any).registration === identifier || 
    (user as any).username === identifier || 
    user.id === identifier;

  if (!isValidUser) {
    notFound();
  }

  // Verify internal audience and batch targeting
  if (quiz.targetAudience === "EXTERNAL") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">External Quiz</h1>
          <p className="text-muted-foreground">
            This quiz is configured for external participants and must be accessed via external systems.
          </p>
        </div>
      </div>
    );
  }

  // If quiz is targeted to specific batches, check student's batch
  if (quiz.targetBatchIds && quiz.targetBatchIds.length > 0) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { batchId: true, role: true },
    });

    if (!isSystemAdminRole(dbUser?.role)) {
      if (!dbUser?.batchId || !quiz.targetBatchIds.includes(dbUser.batchId)) {
        return (
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="text-center max-w-md">
              <h1 className="text-2xl font-bold mb-2">Batch Restricted Quiz</h1>
              <p className="text-muted-foreground">
                This quiz is exclusively available to students in specific batches/cohorts.
              </p>
            </div>
          </div>
        );
      }
    }
  }

  // Check if user is blocked from this specific quiz
  const quizBlock = await prisma.quizBlock.findUnique({
    where: {
      quizId_userId: {
        quizId: quiz.id,
        userId: user.id,
      },
    },
  });

  if (quizBlock) {
    return <QuizBlockedScreen quizBlock={{
      reason: quizBlock.reason,
      violationType: quizBlock.violationType,
      violationCount: quizBlock.violationCount,
      blockedAt: quizBlock.blockedAt.toISOString(),
    }} />;
  }

  // Check if quiz is available based on date/time
  const now = new Date();
  if (quiz.startDateTime && new Date(quiz.startDateTime) > now) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Quiz Not Started Yet</h1>
          <p className="text-muted-foreground">
            This quiz will be available on {new Date(quiz.startDateTime).toLocaleString()}
          </p>
        </div>
      </div>
    );
  }

  if (quiz.endDateTime && new Date(quiz.endDateTime) < now) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Quiz Expired</h1>
          <p className="text-muted-foreground">
            This quiz ended on {new Date(quiz.endDateTime).toLocaleString()}
          </p>
        </div>
      </div>
    );
  }

  // Check if user has already attempted this quiz
  const existingAttempt = await prisma.quizAttempt.findFirst({
    where: {
      userId: user.id,
      quizId: quiz.id,
      completedAt: { not: null },
    },
  });

  // If user has already completed the quiz, redirect them
  if (existingAttempt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-background to-muted">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Quiz Already Completed</h1>
            <p className="text-muted-foreground mb-6">
              You have already attempted this quiz. Each user can only take a quiz once.
            </p>
          </div>
          <div className="space-y-3">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Your Score</p>
              <p className="text-3xl font-bold">{existingAttempt.score}%</p>
              <p className="text-sm text-muted-foreground mt-1">
                {existingAttempt.correctAnswers} out of {existingAttempt.totalQuestions} correct
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => window.close()}
                variant="outline"
                className="flex-1"
              >
                Close Window
              </Button>
              <Button 
                onClick={() => window.location.href = `/dashboard/activities/quizzes/results/${existingAttempt.id}`}
                className="flex-1"
              >
                View Results
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get or assign a set to the user
  let assignedSet: string;
  
  // Check if user already has an assigned set
  const existingAssignment = await prisma.quizSetAssignment.findUnique({
    where: {
      quizId_userId: {
        quizId: quiz.id,
        userId: user.id,
      },
    },
  });

  if (existingAssignment) {
    // User already has an assigned set
    assignedSet = existingAssignment.assignedSet;
  } else {
    // Parse questions to get available sets
    const questionsData = JSON.parse(quiz.questionsJson);
    const availableSets = Object.keys(questionsData);

    if (availableSets.length === 0) {
      notFound();
    }

    if (availableSets.length === 1) {
      // Only one set available, assign it
      assignedSet = availableSets[0];
    } else {
      // Multiple sets available, assign randomly
      const randomIndex = Math.floor(Math.random() * availableSets.length);
      assignedSet = availableSets[randomIndex];
    }

    // Save the assignment
    await prisma.quizSetAssignment.create({
      data: {
        quizId: quiz.id,
        userId: user.id,
        assignedSet,
      },
    });
  }

  // Serialize objects properly for Client Component
  const serializedQuiz = {
    ...quiz,
    startDateTime: quiz.startDateTime?.toISOString() ?? null,
    endDateTime: quiz.endDateTime?.toISOString() ?? null,
    createdAt: quiz.createdAt?.toISOString() ?? null,
    updatedAt: quiz.updatedAt?.toISOString() ?? null,
  };

  const serializedUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    registration: (user as any).registration ?? null,
    username: (user as any).username ?? null,
    mobile: (user as any).mobileNumber ?? null,
    branch: (user as any).branch ?? null,
  };

  return (
    <QuizProctorInterface 
      quiz={serializedQuiz as any}
      user={serializedUser as any}
      hasExistingAttempt={!!existingAttempt}
      assignedSet={assignedSet}
    />
  );
}
