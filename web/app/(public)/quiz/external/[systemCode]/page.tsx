/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isExternalQuizEnabled } from "@/lib/system-settings";
import ExternalQuizWrapper from "./_components/external-quiz-wrapper";

export default async function ExternalExamRoomPage({
  params,
}: {
  params: Promise<{ systemCode: string }>;
}) {
  const isEnabled = await isExternalQuizEnabled();
  if (!isEnabled) {
    redirect("/quiz/system-register");
  }

  const { systemCode } = await params;

  const system = await prisma.externalQuizSystem.findUnique({
    where: { systemCode },
    include: { quiz: true },
  });

  if (!system || !system.quiz) {
    notFound();
  }

  // If system is only REGISTERED or ASSIGNED (admin has not clicked "Start Quiz"), redirect back to registration status page
  if (system.status === "REGISTERED" || system.status === "ASSIGNED") {
    redirect("/quiz/system-register");
  }


  // When candidate enters exam room, promote status from IN_PROGRESS to ATTEMPTING
  if (system.status === "IN_PROGRESS") {
    try {
      await prisma.externalQuizSystem.update({
        where: { id: system.id },
        data: { status: "ATTEMPTING" },
      });
      const { emitSocketEvent } = await import("@/lib/socket-server");
      emitSocketEvent(`quiz-${system.quiz.id}`, "system-updated", { systemCode: system.systemCode });
      emitSocketEvent(`system-${system.systemCode}`, "status-changed", { status: "ATTEMPTING" });
    } catch (e) {
      console.error("Error setting status to ATTEMPTING:", e);
    }
  }

  const shiftNumber = system.assignedShift || system.quiz.activeShift || 1;
  const shiftName = system.assignedShiftName || `Shift ${shiftNumber}`;
  const userId = `ext_${system.id}_s${shiftNumber}_${system.assignedResponseId || system.assignedStudentEmail?.replace(/[^a-zA-Z0-9]/g, "_") || "kiosk"}`;

  // Check if candidate is blocked for this quiz and shift
  const existingBlock = await prisma.quizBlock.findFirst({
    where: {
      quizId: system.quiz.id,
      OR: [
        { userId: userId },
        { userId: `ext_${system.id}` },
        { userId: system.id },
        { userId: system.systemCode },
      ],
    },
  });

  // Check if an attempt was already submitted for THIS system in THIS active shift for THIS student
  const existingAttempt = system.assignedStudentEmail
    ? await prisma.quizAttempt.findFirst({
        where: {
          quizId: system.quiz.id,
          externalSystemId: system.id,
          shiftNumber: shiftNumber,
          participantEmail: system.assignedStudentEmail,
        },
      })
    : null;

  const isBlocked = system.status === "BLOCKED" || !!existingBlock;
  const isCompleted = system.status === "COMPLETED" && !!existingAttempt;
  const isAttempting = system.status === "ATTEMPTING" || system.status === "IN_PROGRESS";

  const assignedSet = system.assignedSet || "A";

  const quiz = {
    id: system.quiz.id,
    quizId: system.quiz.quizId,
    title: system.quiz.title,
    description: system.quiz.description,
    sets: system.quiz.sets,
    duration: system.quiz.duration,
    pointsPerQuestion: system.quiz.pointsPerQuestion,
    questionsJson: system.quiz.questionsJson,
    shift: shiftNumber,
    shiftName: shiftName,
    startDateTime: system.quiz.startDateTime?.toISOString() ?? null,
    endDateTime: system.quiz.endDateTime?.toISOString() ?? null,
    feedbackFormId: system.quiz.feedbackFormId,
    createdAt: system.quiz.createdAt?.toISOString() ?? null,
    updatedAt: system.quiz.updatedAt?.toISOString() ?? null,
  };

  const user = {
    id: userId,
    name: system.assignedStudentName || "Participant",
    email: system.assignedStudentEmail || "",
    registration: `${system.systemNumber} · ${shiftName}`,
    username: system.systemCode,
    mobile: null,
    branch: null,
  };

  return (
    <ExternalQuizWrapper
      quiz={quiz as any}
      user={user}
      assignedSet={assignedSet}
      systemCode={system.systemCode}
      isCompleted={isCompleted}
      isBlocked={isBlocked}
      isAttempting={isAttempting}
      blockReason={existingBlock?.reason || "Proctoring violation limit reached"}
    />
  );
}
