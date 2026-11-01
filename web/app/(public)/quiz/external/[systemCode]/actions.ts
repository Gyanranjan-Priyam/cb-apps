/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

interface ExternalSubmitData {
  quizId: string;
  quizDbId: string;
  assignedSet: string;
  answers: Record<number, number>;
  tabSwitches: number;
  questionsJson: string;
  systemCode: string;
  participantName?: string;
  participantEmail?: string;
  shiftNumber?: number;
}

function findCorrectAnswerIndex(question: any): number {
  if (!question || !Array.isArray(question.options)) return -1;
  const rawAnswer =
    question.answer !== undefined ? question.answer : question.correctAnswer;
  if (rawAnswer === undefined || rawAnswer === null) return -1;

  // 1. Direct number index (e.g. 0, 1, 2)
  if (
    typeof rawAnswer === "number" &&
    rawAnswer >= 0 &&
    rawAnswer < question.options.length
  ) {
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

  // 4. Exact or case-insensitive match against option strings
  if (typeof rawAnswer === "string") {
    const cleaned = rawAnswer.trim().toLowerCase();
    const matchIdx = question.options.findIndex(
      (opt: string) =>
        typeof opt === "string" && opt.trim().toLowerCase() === cleaned,
    );
    if (matchIdx !== -1) return matchIdx;
  }

  // 5. Direct equality fallback
  return question.options.findIndex((opt: string) => opt == rawAnswer);
}

export async function submitExternalQuizAttemptFromInterface(
  data: ExternalSubmitData,
) {
  try {
    const system = await prisma.externalQuizSystem.findUnique({
      where: { systemCode: data.systemCode },
    });

    if (!system) {
      return {
        status: "error" as const,
        message: "External system session not found",
      };
    }

    const shiftNumber = data.shiftNumber || system.assignedShift || 1;
    const shiftName = `Shift ${shiftNumber}`;
    const studentEmail = data.participantEmail || system.assignedStudentEmail;
    const studentName =
      data.participantName || system.assignedStudentName || "Candidate";

    // Parse shift-isolated questions for the assigned set
    const { getQuestionsForShiftAndSet } =
      await import("@/app/admin/quizzes/utils");
    const questions = getQuestionsForShiftAndSet(
      data.questionsJson,
      shiftNumber,
      data.assignedSet,
    );

    if (!Array.isArray(questions) || questions.length === 0) {
      return {
        status: "error" as const,
        message: `No questions found for Shift ${shiftNumber} Set ${data.assignedSet}`,
      };
    }

    // Calculate score accurately based on attempted answers
    let correctAnswers = 0;
    const detailedResults: Array<{
      questionIndex: number;
      question: string;
      userAnswer: number;
      correctAnswer: number;
      isCorrect: boolean;
      options: string[];
    }> = [];

    Object.entries(data.answers).forEach(([qIdxStr, answerIndex]) => {
      const questionIndex = parseInt(qIdxStr, 10);
      const question = questions[questionIndex];
      if (!question) return;

      const correctAnswerIndex = findCorrectAnswerIndex(question);
      const isCorrect =
        correctAnswerIndex !== -1 && correctAnswerIndex === answerIndex;
      if (isCorrect) correctAnswers++;

      detailedResults.push({
        questionIndex,
        question: question.question,
        userAnswer: answerIndex,
        correctAnswer: correctAnswerIndex,
        isCorrect,
        options: question.options,
      });
    });

    const totalQuestions = questions.length;
    const score =
      totalQuestions > 0
        ? Number(((correctAnswers / totalQuestions) * 100).toFixed(2))
        : 0;

    const quiz = await prisma.quiz.findUnique({
      where: { id: data.quizDbId },
      select: { pointsPerQuestion: true },
    });

    const pointsPerQ = Number(quiz?.pointsPerQuestion ?? 1);
    const pointsEarned = Number((correctAnswers * pointsPerQ).toFixed(2));
    const setNumber = data.assignedSet.charCodeAt(0) - 64; // A=1, B=2 ...

    // Build answersJson
    const answersJson = JSON.stringify({
      answers: Object.entries(data.answers).map(([qIndex, aIndex]) => ({
        questionIndex: parseInt(qIndex),
        answerIndex: aIndex,
        correct:
          detailedResults.find((r) => r.questionIndex === parseInt(qIndex))
            ?.isCorrect ?? false,
      })),
      tabSwitches: data.tabSwitches,
      submittedAt: new Date().toISOString(),
    });

    // Check for existing attempt specifically FOR THIS SHIFT and candidate on this system
    const existingAttempt = await prisma.quizAttempt.findFirst({
      where: {
        quizId: data.quizDbId,
        shiftNumber: shiftNumber,
        OR: [
          { externalSystemId: system.id },
          ...(studentEmail ? [{ participantEmail: studentEmail }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    const uniqueUserId = `ext_${system.id}_s${shiftNumber}_${system.assignedResponseId || studentEmail?.replace(/[^a-zA-Z0-9]/g, "_") || Date.now()}`;

    let attemptRecordId: string = "";

    if (existingAttempt) {
      const updated = await prisma.quizAttempt.update({
        where: { id: existingAttempt.id },
        data: {
          score,
          totalQuestions,
          correctAnswers,
          pointsEarned,
          shiftNumber,
          shiftName,
          completedAt: new Date(),
          answersJson,
          participantName: studentName,
          participantEmail: studentEmail,
          externalSystemId: system.id,
        },
      });
      attemptRecordId = updated.id;
    } else {
      const created = await prisma.quizAttempt.create({
        data: {
          quizId: data.quizDbId,
          userId: uniqueUserId,
          setNumber,
          shiftNumber,
          shiftName,
          score,
          totalQuestions,
          correctAnswers,
          pointsEarned,
          completedAt: new Date(),
          answersJson,
          participantName: studentName,
          participantEmail: studentEmail,
          externalSystemId: system.id,
        },
      });
      attemptRecordId = created.id;
    }

    // Mark system as completed if not reset
    if (system.status !== "REGISTERED") {
      await prisma.externalQuizSystem.update({
        where: { id: system.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          attemptId: attemptRecordId,
        },
      });
    }

    const { emitSocketEvent } = await import("@/lib/socket-server");
    emitSocketEvent(`quiz-${data.quizDbId}`, "system-updated", {
      systemCode: data.systemCode,
      status: "COMPLETED",
      shiftNumber,
    });
    emitSocketEvent(`quiz-${data.quizId}`, "system-updated", {
      systemCode: data.systemCode,
      status: "COMPLETED",
      shiftNumber,
    });
    emitSocketEvent(`system-${data.systemCode}`, "status-changed", {
      status: "COMPLETED",
      shiftNumber,
    });

    revalidatePath(`/admin/quizzes/results/${data.quizId}`);

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
    console.error("Error submitting external quiz:", error);
    return {
      status: "error" as const,
      message: "Failed to submit quiz. Please try again.",
    };
  }
}
