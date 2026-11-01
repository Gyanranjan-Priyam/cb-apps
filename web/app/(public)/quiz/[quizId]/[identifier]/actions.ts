/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/app/data/admin/get-current-user";

interface SubmitQuizData {
  quizId: string;
  quizDbId: string;
  assignedSet: string;
  answers: Record<number, number>;
  tabSwitches: number;
  questionsJson: string;
}

function findCorrectAnswerIndex(question: any): number {
  if (!question || !Array.isArray(question.options)) return -1;
  const rawAnswer = question.answer !== undefined ? question.answer : question.correctAnswer;
  if (rawAnswer === undefined || rawAnswer === null) return -1;

  // 1. Direct number index (e.g. 0, 1, 2)
  if (typeof rawAnswer === "number" && rawAnswer >= 0 && rawAnswer < question.options.length) {
    return rawAnswer;
  }

  // 2. Numeric string index (e.g. "0", "1")
  if (typeof rawAnswer === "string" && /^\d+$/.test(rawAnswer.trim())) {
    const parsed = parseInt(rawAnswer.trim(), 10);
    if (parsed >= 0 && parsed < question.options.length) {
      return parsed;
    }
  }

  // 3. Letter index (e.g. "A", "B", "C", "D" or "a", "b", "c", "d")
  if (typeof rawAnswer === "string" && /^[A-Za-z]$/.test(rawAnswer.trim())) {
    const letterIdx = rawAnswer.trim().toUpperCase().charCodeAt(0) - 65;
    if (letterIdx >= 0 && letterIdx < question.options.length) {
      return letterIdx;
    }
  }

  // 4. Exact or trimmed / case-insensitive match against option strings
  if (typeof rawAnswer === "string") {
    const cleaned = rawAnswer.trim().toLowerCase();
    const matchIdx = question.options.findIndex(
      (opt: string) => typeof opt === "string" && opt.trim().toLowerCase() === cleaned
    );
    if (matchIdx !== -1) return matchIdx;
  }

  // 5. Direct equality fallback
  return question.options.findIndex((opt: string) => opt == rawAnswer);
}

export async function submitQuizAttempt(data: SubmitQuizData) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return {
        status: "error" as const,
        message: "User not authenticated",
      };
    }

    // Check if user is banned
    if (user.banned) {
      return {
        status: "error" as const,
        message: "You have been blocked from accessing quizzes. Please contact support.",
      };
    }

    // Get quiz and check availability
    const quiz = await prisma.quiz.findUnique({
      where: { id: data.quizDbId },
      select: { 
        pointsPerQuestion: true,
        isActive: true,
        startDateTime: true,
        endDateTime: true,
        questionsJson: true,
      },
    });

    if (!quiz || !quiz.isActive) {
      return {
        status: "error" as const,
        message: "Quiz is not available",
      };
    }

    // Check quiz time availability
    const now = new Date();
    if (quiz.startDateTime && new Date(quiz.startDateTime) > now) {
      return {
        status: "error" as const,
        message: "Quiz has not started yet",
      };
    }

    if (quiz.endDateTime && new Date(quiz.endDateTime) < now) {
      return {
        status: "error" as const,
        message: "Quiz has expired",
      };
    }

    // Parse questions to calculate score
    const shiftNumber = (data as any).shiftNumber || 1;
    const { getQuestionsForShiftAndSet } = await import("@/app/admin/quizzes/utils");
    const questions = getQuestionsForShiftAndSet(data.questionsJson, shiftNumber, data.assignedSet);
    
    if (!Array.isArray(questions) || questions.length === 0) {
      return {
        status: "error" as const,
        message: `No questions found for Shift ${shiftNumber} Set ${data.assignedSet}`,
      };
    }

    // Calculate correct answers accurately
    let correctAnswers = 0;
    const answersArray = Object.entries(data.answers).map(([qIndexStr, aIndex]) => {
      const questionIndex = parseInt(qIndexStr, 10);
      const question = questions[questionIndex];
      const correctAnswerIndex = findCorrectAnswerIndex(question);
      const isCorrect = correctAnswerIndex !== -1 && correctAnswerIndex === aIndex;
      if (isCorrect) correctAnswers++;
      return {
        questionIndex,
        answerIndex: aIndex,
        correct: isCorrect,
      };
    });

    // Create detailed results for frontend
    const detailedResults = Object.entries(data.answers).map(([qIndexStr, userAnswer]) => {
      const questionIndex = parseInt(qIndexStr, 10);
      const question = questions[questionIndex];
      const correctAnswerIndex = findCorrectAnswerIndex(question);
      return {
        questionIndex,
        question: question ? question.question : "",
        userAnswer,
        correctAnswer: correctAnswerIndex,
        isCorrect: correctAnswerIndex !== -1 && correctAnswerIndex === userAnswer,
        options: question ? question.options : [],
      };
    });

    const totalQuestions = questions.length;
    const score = totalQuestions > 0 ? Number(((correctAnswers / totalQuestions) * 100).toFixed(2)) : 0;
    
    const pointsPerQ = Number(quiz?.pointsPerQuestion ?? 1);
    const pointsEarned = Number((correctAnswers * pointsPerQ).toFixed(2));

    // Convert set letter to number (A=0, B=1, etc.)
    const setNumber = data.assignedSet.charCodeAt(0) - 65;

    // Check if attempt already exists
    const existingAttempt = await prisma.quizAttempt.findFirst({
      where: {
        quizId: data.quizDbId,
        userId: user.id,
        setNumber,
      },
    });

    if (existingAttempt) {
      // Update existing attempt
      await prisma.quizAttempt.update({
        where: { id: existingAttempt.id },
        data: {
          score,
          totalQuestions,
          correctAnswers,
          pointsEarned,
          completedAt: new Date(),
          answersJson: JSON.stringify({
            answers: answersArray,
            tabSwitches: data.tabSwitches,
            submittedAt: new Date().toISOString(),
          }),
        },
      });
    } else {
      // Create new attempt
      await prisma.quizAttempt.create({
        data: {
          quizId: data.quizDbId,
          userId: user.id,
          setNumber,
          score,
          totalQuestions,
          correctAnswers,
          pointsEarned,
          completedAt: new Date(),
          answersJson: JSON.stringify({
            answers: answersArray,
            tabSwitches: data.tabSwitches,
            submittedAt: new Date().toISOString(),
          }),
        },
      });
    }

    // Revalidate leaderboard and dashboard to show updated points
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/leaderboard");
    revalidatePath("/dashboard");

    return {
      status: "success" as const,
      data: {
        score,
        correctAnswers,
        totalQuestions,
        pointsEarned,
        tabSwitches: data.tabSwitches,
        detailedResults,
      },
    };
  } catch (error) {
    console.error("Error submitting quiz:", error);
    return {
      status: "error" as const,
      message: "Failed to submit quiz. Please try again.",
    };
  }
}
