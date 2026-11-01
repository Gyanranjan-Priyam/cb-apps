"use server";

import { prisma } from "@/lib/db";

export async function getQuizParticipants(quizId: string) {
  try {
    // Find quiz by quizId (not id)
    const quiz = await prisma.quiz.findUnique({
      where: { quizId },
      select: {
        id: true,
        quizId: true,
        title: true,
        sets: true,
        pointsPerQuestion: true,
        duration: true,
      },
    });

    if (!quiz) {
      return {
        status: "error" as const,
        message: "Quiz not found",
        data: { quiz: null, participants: [] },
      };
    }

    // Get all attempts for this quiz
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        quizId: quiz.id,
      },
      orderBy: {
        completedAt: "desc",
      },
    });

    // Get unique user IDs
    const userIds = [...new Set(attempts.map(a => a.userId))];
    
    // Fetch user details
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        registration: true,
        branch: true,
      },
    });

    // Create a user map for quick lookup
    const userMap = new Map(users.map(u => [u.id, u]));

    // Group attempts by user
    const participantsMap = new Map();
    
    attempts.forEach((attempt) => {
      const userId = attempt.userId;
      const user = userMap.get(userId);
      
      if (!user) return;
      
      if (!participantsMap.has(userId)) {
        participantsMap.set(userId, {
          user,
          attempts: [],
        });
      }

      // Parse answersJson to get approval status
      let approvalStatus = "pending";
      if (attempt.answersJson) {
        try {
          const answersData = JSON.parse(attempt.answersJson);
          approvalStatus = answersData.approvalStatus || "pending";
        } catch (e) {
          // Keep default pending status
        }
      }
      
      participantsMap.get(userId).attempts.push({
        id: attempt.id,
        setNumber: attempt.setNumber,
        score: attempt.score,
        correctAnswers: attempt.correctAnswers,
        totalQuestions: attempt.totalQuestions,
        pointsEarned: attempt.pointsEarned,
        completedAt: attempt.completedAt,
        status: approvalStatus,
      });
    });

    const participants = Array.from(participantsMap.values());

    return {
      status: "success" as const,
      data: {
        quiz,
        participants,
      },
    };
  } catch (error) {
    console.error("Error fetching quiz participants:", error);
    return {
      status: "error" as const,
      message: "Failed to fetch quiz participants",
      data: { quiz: null, participants: [] },
    };
  }
}

export async function updateAttemptStatus(attemptId: string, status: "approved" | "rejected") {
  try {
    // For now, we'll store status in the answersJson
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      return {
        status: "error" as const,
        message: "Attempt not found",
      };
    }

    const answersData = attempt.answersJson ? JSON.parse(attempt.answersJson) : {};
    answersData.approvalStatus = status;
    answersData.approvedAt = new Date().toISOString();

    await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        answersJson: JSON.stringify(answersData),
      },
    });

    return {
      status: "success" as const,
      message: `Attempt ${status} successfully`,
    };
  } catch (error) {
    console.error("Error updating attempt status:", error);
    return {
      status: "error" as const,
      message: "Failed to update attempt status",
    };
  }
}
