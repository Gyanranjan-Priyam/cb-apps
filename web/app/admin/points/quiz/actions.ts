"use server";

import { prisma } from "@/lib/db";

export async function getAllQuizzes() {
  try {
    const quizzes = await prisma.quiz.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        attempts: {
          select: {
            id: true,
            userId: true,
            pointsEarned: true,
          },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
    });

    return {
      status: "success" as const,
      data: quizzes,
    };
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return {
      status: "error" as const,
      message: "Failed to fetch quizzes",
      data: [],
    };
  }
}
