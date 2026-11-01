"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/app/data/admin/get-current-user";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getActiveQuizzes() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    let userBatchId: string | null = null;
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { batchId: true },
      });
      userBatchId = user?.batchId || null;
    }

    const now = new Date();
    
    const quizzes = await prisma.quiz.findMany({
      where: {
        isActive: true,
        targetAudience: "INTERNAL", // Strictly internal quizzes only in member dashboard
        ...(userBatchId
          ? {
              OR: [
                { targetBatchIds: { equals: [] } },
                { targetBatchIds: { has: userBatchId } },
              ],
            }
          : {
              targetBatchIds: { equals: [] },
            }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            attempts: true,
          },
        },
      },
    });

    // Add availability status to each quiz
    const quizzesWithStatus = quizzes.map(quiz => {
      let status = 'available';
      let message = '';
      
      if (quiz.startDateTime && new Date(quiz.startDateTime) > now) {
        status = 'not_started';
        message = `Starts on ${new Date(quiz.startDateTime).toLocaleString()}`;
      } else if (quiz.endDateTime && new Date(quiz.endDateTime) < now) {
        status = 'expired';
        message = `Ended on ${new Date(quiz.endDateTime).toLocaleString()}`;
      } else if (quiz.startDateTime && quiz.endDateTime) {
        status = 'available';
        message = `Available until ${new Date(quiz.endDateTime).toLocaleString()}`;
      }
      
      return {
        ...quiz,
        availabilityStatus: status,
        availabilityMessage: message,
      };
    });

    return {
      status: "success" as const,
      data: quizzesWithStatus,
    };
  } catch (error) {
    console.error("Error fetching active quizzes:", error);
    return {
      status: "error" as const,
      message: "Failed to fetch quizzes",
    };
  }
}

export async function getUserQuizAttempts(userId: string) {
  try {
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        userId,
        completedAt: { not: null },
      },
      select: {
        id: true,
        quizId: true,
        setNumber: true,
        score: true,
        correctAnswers: true,
        totalQuestions: true,
        pointsEarned: true,
        completedAt: true,
        answersJson: true,
      },
    });

    return {
      status: "success" as const,
      data: attempts,
    };
  } catch (error) {
    console.error("Error fetching user quiz attempts:", error);
    return {
      status: "error" as const,
      message: "Failed to fetch attempts",
    };
  }
}

export async function getCurrentUserData() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return {
        status: "error" as const,
        message: "Not authenticated",
      };
    }

    return {
      status: "success" as const,
      data: user,
    };
  } catch (error) {
    console.error("Error fetching current user:", error);
    return {
      status: "error" as const,
      message: "Failed to fetch user data",
    };
  }
}

export async function getQuizzesData() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return {
        status: "error" as const,
        message: "Not authenticated",
      };
    }

    const [quizzesResult, attemptsResult] = await Promise.all([
      getActiveQuizzes(),
      getUserQuizAttempts(user.id),
    ]);

    return {
      status: "success" as const,
      data: {
        user,
        quizzes: quizzesResult.status === "success" ? quizzesResult.data : [],
        attempts: attemptsResult.status === "success" ? attemptsResult.data : [],
      },
    };
  } catch (error) {
    console.error("Error fetching quizzes data:", error);
    return {
      status: "error" as const,
      message: "Failed to fetch data",
    };
  }
}
