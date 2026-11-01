/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { requireCoAdmin } from "@/app/data/admin/require-co-admin";
import { revalidatePath } from "next/cache";
import { emitSocketEvent, emitSocketEventToRooms } from "@/lib/socket-server";

export interface QuizShiftConfig {
  shiftNumber: number;
  name: string;
  set?: string;
  sets?: string[];
  status?: "PENDING" | "ACTIVE" | "COMPLETED";
}

export interface QuizData {
  id: string;
  quizId: string;
  title: string;
  description: string;
  sets: number;
  shifts?: number | null;
  shiftsJson?: string | null;
  activeShift?: number | null;
  duration: number;
  pointsPerQuestion: number;
  startDateTime: Date | null;
  endDateTime: Date | null;
  questionsJson: string;
  isActive: boolean;
  targetAudience: string;
  accessCode: string | null;
  formId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  answer: string;
}

export async function getAllQuizzes() {
  await requireCoAdmin();
  
  try {
    const quizzes = await prisma.quiz.findMany({
      orderBy: {
        createdAt: 'desc',
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
    };
  }
}

export async function getQuizById(id: string) {
  await requireCoAdmin();
  
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        externalSystems: true,
      },
    });

    if (!quiz) {
      return {
        status: "error" as const,
        message: "Quiz not found",
      };
    }

    return {
      status: "success" as const,
      data: quiz,
    };
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return {
      status: "error" as const,
      message: "Failed to fetch quiz",
    };
  }
}

export async function getQuizByQuizId(quizId: string) {
  await requireCoAdmin();
  
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { quizId },
      include: {
        externalSystems: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!quiz) {
      return {
        status: "error" as const,
        message: "Quiz not found",
      };
    }

    return {
      status: "success" as const,
      data: quiz,
    };
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return {
      status: "error" as const,
      message: "Failed to fetch quiz",
    };
  }
}

export async function createQuiz(data: {
  quizId: string;
  title: string;
  description: string;
  sets: number;
  shifts?: number | null;
  shiftsJson?: string | null;
  activeShift?: number | null;
  duration: number;
  pointsPerQuestion: number;
  startDateTime: Date | null;
  endDateTime: Date | null;
  questionsJson: string;
  createdBy: string;
  targetAudience?: string;
  targetBatchIds?: string[];
  accessCode?: string | null;
  formId?: string | null;
  feedbackFormId?: string | null;
  cutoffMarks?: number | null;
  cutoffType?: string | null;
  topSelectCount?: number | null;
}) {
  await requireAdmin();
  
  try {
    // Validate questions JSON
    try {
      const questions = JSON.parse(data.questionsJson);
      
      if (typeof questions === 'object' && !Array.isArray(questions) && questions !== null) {
        for (const setKey of Object.keys(questions)) {
          const val = questions[setKey];
          if (Array.isArray(val)) {
            for (const q of val) {
              if (q.id === undefined || !q.question || !Array.isArray(q.options) || q.answer === undefined) {
                return {
                  status: "error" as const,
                  message: `Each question in Set ${setKey} must have id, question, options array, and answer`,
                };
              }
            }
          } else if (typeof val === 'object' && val !== null) {
            // Nested shift map: { "shift_1": { "A": [...], "B": [...] } }
            for (const subKey of Object.keys(val)) {
              const subVal = val[subKey];
              if (Array.isArray(subVal)) {
                for (const q of subVal) {
                  if (q.id === undefined || !q.question || !Array.isArray(q.options) || q.answer === undefined) {
                    return {
                      status: "error" as const,
                      message: `Each question in ${setKey} Set ${subKey} must have id, question, options array, and answer`,
                    };
                  }
                }
              }
            }
          }
        }
      } else if (Array.isArray(questions)) {
        for (const q of questions) {
          if (q.id === undefined || !q.question || !Array.isArray(q.options) || q.answer === undefined) {
            return {
              status: "error" as const,
              message: "Each question must have id, question, options array, and answer",
            };
          }
        }
      } else {
        return {
          status: "error" as const,
          message: "Questions must be an array or an object with sets",
        };
      }
    } catch (parseError) {
      return {
        status: "error" as const,
        message: "Invalid JSON format for questions",
      };
    }

    // Check if quizId already exists
    const existingQuiz = await prisma.quiz.findUnique({
      where: { quizId: data.quizId },
    });

    if (existingQuiz) {
      return {
        status: "error" as const,
        message: "Quiz ID already exists",
      };
    }

    const quiz = await prisma.quiz.create({
      data: {
        quizId: data.quizId,
        title: data.title,
        description: data.description,
        sets: data.sets,
        shifts: data.shifts || 1,
        shiftsJson: data.shiftsJson || null,
        activeShift: data.activeShift || 1,
        duration: data.duration,
        pointsPerQuestion: data.pointsPerQuestion,
        startDateTime: data.startDateTime,
        endDateTime: data.endDateTime,
        questionsJson: data.questionsJson,
        createdBy: data.createdBy,
        targetAudience: data.targetAudience || "INTERNAL",
        targetBatchIds: data.targetBatchIds || [],
        accessCode: data.accessCode || null,
        formId: data.formId || null,
        feedbackFormId: data.feedbackFormId || null,
        cutoffMarks: data.cutoffMarks !== undefined && data.cutoffMarks !== null ? data.cutoffMarks : 50,
        cutoffType: data.cutoffType || "PERCENTAGE",
        topSelectCount: data.topSelectCount || null,
      },
    });

    revalidatePath("/admin/quizzes");

    return {
      status: "success" as const,
      message: "Quiz created successfully",
      data: quiz,
    };
  } catch (error) {
    console.error("Error creating quiz:", error);
    return {
      status: "error" as const,
      message: "Failed to create quiz",
    };
  }
}

export async function updateQuiz(
  id: string,
  data: {
    title: string;
    description: string;
    sets: number;
    shifts?: number | null;
    shiftsJson?: string | null;
    activeShift?: number | null;
    duration: number;
    pointsPerQuestion: number;
    startDateTime: Date | null;
    endDateTime: Date | null;
    questionsJson: string;
    isActive: boolean;
    targetAudience?: string;
    targetBatchIds?: string[];
    accessCode?: string | null;
    formId?: string | null;
    feedbackFormId?: string | null;
    cutoffMarks?: number | null;
    cutoffType?: string | null;
    topSelectCount?: number | null;
  }
) {
  await requireAdmin();
  
  try {
    try {
      const questions = JSON.parse(data.questionsJson);
      
      if (typeof questions === 'object' && !Array.isArray(questions) && questions !== null) {
        for (const setKey of Object.keys(questions)) {
          const val = questions[setKey];
          if (Array.isArray(val)) {
            for (const q of val) {
              if (q.id === undefined || !q.question || !Array.isArray(q.options) || q.answer === undefined) {
                return {
                  status: "error" as const,
                  message: `Each question in Set ${setKey} must have id, question, options array, and answer`,
                };
              }
            }
          } else if (typeof val === 'object' && val !== null) {
            // Nested shift map: { "shift_1": { "A": [...], "B": [...] } }
            for (const subKey of Object.keys(val)) {
              const subVal = val[subKey];
              if (Array.isArray(subVal)) {
                for (const q of subVal) {
                  if (q.id === undefined || !q.question || !Array.isArray(q.options) || q.answer === undefined) {
                    return {
                      status: "error" as const,
                      message: `Each question in ${setKey} Set ${subKey} must have id, question, options array, and answer`,
                    };
                  }
                }
              }
            }
          }
        }
      } else if (Array.isArray(questions)) {
        for (const q of questions) {
          if (q.id === undefined || !q.question || !Array.isArray(q.options) || q.answer === undefined) {
            return {
              status: "error" as const,
              message: "Each question must have id, question, options array, and answer",
            };
          }
        }
      } else {
        return {
          status: "error" as const,
          message: "Questions must be an array or an object with sets",
        };
      }
    } catch (parseError) {
      return {
        status: "error" as const,
        message: "Invalid JSON format for questions",
      };
    }

    const quiz = await prisma.quiz.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        sets: data.sets,
        ...(data.shifts !== undefined ? { shifts: data.shifts || 1 } : {}),
        ...(data.shiftsJson !== undefined ? { shiftsJson: data.shiftsJson } : {}),
        ...(data.activeShift !== undefined ? { activeShift: data.activeShift || 1 } : {}),
        duration: data.duration,
        pointsPerQuestion: data.pointsPerQuestion,
        startDateTime: data.startDateTime,
        endDateTime: data.endDateTime,
        questionsJson: data.questionsJson,
        isActive: data.isActive,
        targetAudience: data.targetAudience,
        ...(data.targetBatchIds !== undefined ? { targetBatchIds: data.targetBatchIds } : {}),
        accessCode: data.accessCode,
        formId: data.formId,
        feedbackFormId: data.feedbackFormId,
        cutoffMarks: data.cutoffMarks !== undefined && data.cutoffMarks !== null ? data.cutoffMarks : 50,
        cutoffType: data.cutoffType || "PERCENTAGE",
        topSelectCount: data.topSelectCount || null,
      },
    });

    revalidatePath("/admin/quizzes");
    revalidatePath(`/admin/quizzes/${quiz.quizId}`);

    return {
      status: "success" as const,
      message: "Quiz updated successfully",
      data: quiz,
    };
  } catch (error) {
    console.error("Error updating quiz:", error);
    return {
      status: "error" as const,
      message: "Failed to update quiz",
    };
  }
}

export async function deleteQuiz(id: string) {
  await requireAdmin();
  
  try {
    await prisma.quiz.delete({
      where: { id },
    });

    revalidatePath("/admin/quizzes");

    return {
      status: "success" as const,
      message: "Quiz deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting quiz:", error);
    return {
      status: "error" as const,
      message: "Failed to delete quiz",
    };
  }
}

export async function toggleQuizStatus(id: string, isActive: boolean) {
  await requireAdmin();
  
  try {
    const quiz = await prisma.quiz.update({
      where: { id },
      data: { isActive },
    });

    revalidatePath("/admin/quizzes");

    return {
      status: "success" as const,
      message: `Quiz ${isActive ? "activated" : "deactivated"} successfully`,
      data: quiz,
    };
  } catch (error) {
    console.error("Error toggling quiz status:", error);
    return {
      status: "error" as const,
      message: "Failed to update quiz status",
    };
  }
}

// ----------------------------------------------------
// EXTERNAL QUIZ SYSTEM ACTIONS & REAL-TIME MANAGEMENT
// ----------------------------------------------------

export async function getIsExternalQuizActiveAction() {
  try {
    const { isExternalQuizEnabled } = await import("@/lib/system-settings");
    const enabled = await isExternalQuizEnabled();
    return { status: "success" as const, data: enabled };
  } catch (error) {
    console.error("Error checking if external quiz is active:", error);
    return { status: "error" as const, message: "Failed to check status", data: false };
  }
}

export async function registerExternalSystem(accessCode: string, systemNumber: string) {
  try {
    const { isExternalQuizEnabled } = await import("@/lib/system-settings");
    const isEnabled = await isExternalQuizEnabled();
    if (!isEnabled) {
      return {
        status: "error" as const,
        message: "External Quiz System is currently disabled by administrator.",
      };
    }

    const cleanCode = accessCode.trim();
    const cleanSysNumber = systemNumber.trim();

    if (!cleanCode || !cleanSysNumber) {
      return { status: "error" as const, message: "Quiz Access Code and System Number are required" };
    }


    const quiz = await prisma.quiz.findFirst({
      where: {
        accessCode: cleanCode,
        targetAudience: "EXTERNAL",
        isActive: true,
      },
    });

    if (!quiz) {
      return { status: "error" as const, message: "Invalid or inactive 6-digit Quiz Access Code" };
    }

    // Check existing systems to compute alternating set for conjugate system
    const existing = await prisma.externalQuizSystem.findMany({
      where: { quizId: quiz.id },
      select: { systemNumber: true, assignedSet: true },
    });

    // Clean up any stale uncompleted system with the same systemNumber on this quiz
    const staleSystems = await prisma.externalQuizSystem.findMany({
      where: {
        quizId: quiz.id,
        systemNumber: cleanSysNumber,
        status: { in: ["REGISTERED", "ASSIGNED"] },
      },
    });

    if (staleSystems.length > 0) {
      const staleIds = staleSystems.map((s) => s.id);
      await prisma.externalQuizSystem.deleteMany({
        where: { id: { in: staleIds } },
      });
    }

    const sortedExisting = existing.sort((a, b) =>
      a.systemNumber.localeCompare(b.systemNumber, undefined, { numeric: true, sensitivity: "base" })
    );

    const allSysNumbers = Array.from(new Set([...sortedExisting.map((s) => s.systemNumber), cleanSysNumber]));
    allSysNumbers.sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    );

    const sortedIndex = allSysNumbers.indexOf(cleanSysNumber);
    const numSets = quiz.sets || 1;
    let autoAssignedSet = "A";

    if (numSets > 1) {
      const setLetters = Array.from({ length: numSets }, (_, i) => String.fromCharCode(65 + i));
      const prevSysNum = sortedIndex > 0 ? allSysNumbers[sortedIndex - 1] : null;
      const nextSysNum = sortedIndex < allSysNumbers.length - 1 ? allSysNumbers[sortedIndex + 1] : null;

      const prevSys = sortedExisting.find((s) => s.systemNumber === prevSysNum);
      const nextSys = sortedExisting.find((s) => s.systemNumber === nextSysNum);

      const neighborSets = new Set([prevSys?.assignedSet, nextSys?.assignedSet].filter(Boolean));
      const validSets = setLetters.filter((s) => !neighborSets.has(s));

      if (validSets.length > 0) {
        autoAssignedSet = validSets[Math.floor(Math.random() * validSets.length)];
      } else {
        const nonPrev = setLetters.filter((s) => s !== prevSys?.assignedSet);
        autoAssignedSet = (nonPrev.length > 0 ? nonPrev[Math.floor(Math.random() * nonPrev.length)] : null) || setLetters[sortedIndex % numSets];
      }
    }

    const systemCode = `SYS-${Math.floor(100000 + Math.random() * 900000)}`;

    const system = await prisma.externalQuizSystem.create({
      data: {
        quizId: quiz.id,
        systemNumber: cleanSysNumber,
        systemCode,
        assignedSet: autoAssignedSet,
        status: "REGISTERED",
      },
    });

    emitSocketEvent(`quiz-${quiz.id}`, "system-updated", { systemCode: system.systemCode, quizId: quiz.id });
    emitSocketEvent(`quiz-${quiz.quizId}`, "system-updated", { systemCode: system.systemCode, quizId: quiz.quizId });

    return {
      status: "success" as const,
      message: "System registered successfully",
      data: {
        systemCode: system.systemCode,
        systemNumber: system.systemNumber,
        quizTitle: quiz.title,
        quizId: quiz.quizId,
      },
    };
  } catch (error) {
    console.error("Error registering external system:", error);
    return { status: "error" as const, message: "Failed to register system" };
  }
}

export async function unregisterExternalSystem(systemCode: string) {
  try {
    const cleanCode = systemCode.trim();
    if (!cleanCode) {
      return { status: "error" as const, message: "System code is required" };
    }

    const system = await prisma.externalQuizSystem.findUnique({
      where: { systemCode: cleanCode },
      include: { quiz: { select: { id: true, quizId: true } } },
    });

    if (!system) {
      return { status: "success" as const, message: "System not found or already cleared" };
    }

    await prisma.externalQuizSystem.delete({
      where: { id: system.id },
    });

    emitSocketEvent(`quiz-${system.quiz.id}`, "system-updated", { systemCode: system.systemCode, quizId: system.quiz.id, action: "removed" });
    emitSocketEvent(`quiz-${system.quiz.quizId}`, "system-updated", { systemCode: system.systemCode, quizId: system.quiz.quizId, action: "removed" });
    emitSocketEvent(`system-${system.systemCode}`, "status-changed", { status: "DISCONNECTED" });

    revalidatePath(`/admin/quizzes/${system.quiz.id}`);

    return { status: "success" as const, message: "System registration cleared successfully" };
  } catch (error) {
    console.error("Error unregistering external system:", error);
    return { status: "error" as const, message: "Failed to clear registration" };
  }
}

export async function deleteExternalSystem(systemId: string) {
  await requireCoAdmin();

  try {
    const system = await prisma.externalQuizSystem.findUnique({
      where: { id: systemId },
      include: { quiz: { select: { id: true, quizId: true } } },
    });

    if (!system) {
      return { status: "error" as const, message: "System not found" };
    }

    await prisma.externalQuizSystem.delete({
      where: { id: systemId },
    });

    emitSocketEvent(`quiz-${system.quiz.id}`, "system-updated", { systemCode: system.systemCode, quizId: system.quiz.id, action: "removed" });
    emitSocketEvent(`quiz-${system.quiz.quizId}`, "system-updated", { systemCode: system.systemCode, quizId: system.quiz.quizId, action: "removed" });
    emitSocketEvent(`system-${system.systemCode}`, "status-changed", { status: "DISCONNECTED" });

    revalidatePath(`/admin/quizzes/${system.quiz.id}`);

    return { status: "success" as const, message: "System removed successfully" };
  } catch (error) {
    console.error("Error deleting external system:", error);
    return { status: "error" as const, message: "Failed to delete system" };
  }
}

export async function clearAllExternalSystems(quizId: string) {
  await requireCoAdmin();

  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { id: true, quizId: true },
    });

    if (!quiz) {
      return { status: "error" as const, message: "Quiz not found" };
    }

    const systems = await prisma.externalQuizSystem.findMany({
      where: { quizId: quiz.id },
      select: { systemCode: true },
    });

    await prisma.externalQuizSystem.deleteMany({
      where: { quizId: quiz.id },
    });

    systems.forEach((s) => {
      emitSocketEvent(`system-${s.systemCode}`, "status-changed", { status: "DISCONNECTED" });
    });

    emitSocketEvent(`quiz-${quiz.id}`, "system-updated", { quizId: quiz.id, action: "cleared-all" });
    emitSocketEvent(`quiz-${quiz.quizId}`, "system-updated", { quizId: quiz.quizId, action: "cleared-all" });

    revalidatePath(`/admin/quizzes/${quiz.id}`);

    return { status: "success" as const, message: `Cleared ${systems.length} systems successfully` };
  } catch (error) {
    console.error("Error clearing all external systems:", error);
    return { status: "error" as const, message: "Failed to clear systems" };
  }
}

export async function getExternalSystems(quizId: string) {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { sets: true },
    });
    const numSets = quiz?.sets || 1;

    const systems = await prisma.externalQuizSystem.findMany({
      where: { quizId },
    });

    // Natural alphanumeric sorting by systemNumber (e.g. 1, 2, 10, 32, 37)
    systems.sort((a, b) =>
      a.systemNumber.localeCompare(b.systemNumber, undefined, { numeric: true, sensitivity: "base" })
    );

    // Auto-compute alternating sets for conjugate systems if not explicitly set
    const processedSystems = systems.map((sys, idx) => ({
      ...sys,
      assignedSet: sys.assignedSet || String.fromCharCode(65 + (idx % numSets)),
    }));

    return { status: "success" as const, data: processedSystems };
  } catch (error) {
    console.error("Error fetching external systems:", error);
    return { status: "error" as const, message: "Failed to fetch external systems" };
  }
}

export async function assignStudentToSystem({
  systemId,
  systemCode,
  formResponseId,
  studentName,
  studentEmail,
  assignedSet = "A",
  assignedShift,
  assignedShiftName,
}: {
  systemId?: string;
  systemCode?: string;
  formResponseId?: string;
  studentName: string;
  studentEmail: string;
  assignedSet?: string;
  assignedShift?: number;
  assignedShiftName?: string;
}) {
  await requireCoAdmin();

  try {
    let whereClause: any = {};
    if (systemId) {
      whereClause = { id: systemId };
    } else if (systemCode) {
      whereClause = { systemCode };
    } else {
      return { status: "error" as const, message: "System ID or System Code is required" };
    }

    const existingSys = await prisma.externalQuizSystem.findUnique({
      where: whereClause,
      include: { quiz: { select: { id: true, quizId: true, sets: true, shifts: true, shiftsJson: true, activeShift: true } } },
    });

    if (!existingSys) {
      return { status: "error" as const, message: "System not found" };
    }

    const cleanEmail = studentEmail.trim().toLowerCase();
    const cleanResponseId = formResponseId && formResponseId !== "custom" ? formResponseId.trim() : null;

    // Check if another system in the same quiz already has this response ID or email assigned
    const duplicateSystem = await prisma.externalQuizSystem.findFirst({
      where: {
        quizId: existingSys.quizId,
        id: { not: existingSys.id },
        OR: [
          ...(cleanResponseId ? [{ assignedResponseId: cleanResponseId }] : []),
          ...(cleanEmail ? [{ assignedStudentEmail: cleanEmail }] : []),
        ],
      },
    });

    if (duplicateSystem) {
      const matchReason = (cleanResponseId && duplicateSystem.assignedResponseId === cleanResponseId)
        ? `Response ID (${cleanResponseId})`
        : `Email (${cleanEmail})`;
      return {
        status: "error" as const,
        message: `This candidate with ${matchReason} is already assigned to ${duplicateSystem.systemNumber}. A candidate cannot be assigned to multiple systems.`,
      };
    }

    const finalShiftNumber = assignedShift || existingSys.quiz.activeShift || existingSys.assignedShift || 1;
    const finalShiftName = assignedShiftName || `Shift ${finalShiftNumber}`;

    let finalAssignedSet = assignedSet;
    if (!finalAssignedSet || finalAssignedSet === "AUTO") {
      // Check if shift configuration specifies question sets for this shift
      let availableSets: string[] = [];
      try {
        if (existingSys.quiz.shiftsJson) {
          const shiftConfigs: QuizShiftConfig[] = JSON.parse(existingSys.quiz.shiftsJson);
          const matchedShift = shiftConfigs.find((s) => s.shiftNumber === finalShiftNumber);
          if (matchedShift?.sets && matchedShift.sets.length > 0) {
            availableSets = matchedShift.sets;
          } else if (matchedShift?.set) {
            availableSets = [matchedShift.set];
          }
        }
      } catch (e) {
        console.error("Error parsing shift set:", e);
      }

      if (availableSets.length > 0) {
        finalAssignedSet = availableSets[0];
      } else {
        finalAssignedSet = existingSys?.assignedSet || "A";
      }
    }

    const system = await prisma.externalQuizSystem.update({
      where: whereClause,
      data: {
        assignedResponseId: cleanResponseId,
        assignedStudentName: studentName.trim(),
        assignedStudentEmail: cleanEmail,
        assignedSet: finalAssignedSet,
        assignedShift: finalShiftNumber,
        assignedShiftName: finalShiftName,
        status: "ASSIGNED",
      },
    });

    emitSocketEvent(`quiz-${system.quizId}`, "system-updated", { systemCode: system.systemCode });
    emitSocketEvent(`system-${system.systemCode}`, "status-changed", {
      status: "ASSIGNED",
      assignedStudentName: system.assignedStudentName,
      assignedSet: system.assignedSet,
      assignedShift: system.assignedShift,
      assignedShiftName: system.assignedShiftName,
    });

    revalidatePath(`/admin/quizzes/${system.quizId}`);

    return { status: "success" as const, message: "Student assigned to system successfully", data: system };
  } catch (error) {
    console.error("Error assigning student to system:", error);
    return { status: "error" as const, message: "Failed to assign student" };
  }
}

/**
 * Mark Shift X as Completed, reset active student assignments on connected systems, and advance to next shift.
 */
export async function completeQuizShift(quizId: string, shiftNumber: number) {
  await requireCoAdmin();

  try {
    const quiz = await prisma.quiz.findFirst({
      where: {
        OR: [{ id: quizId }, { quizId: quizId }],
      },
    });

    if (!quiz) {
      return { status: "error" as const, message: "Quiz not found" };
    }

    // Parse shift configuration
    let shiftsList: QuizShiftConfig[] = [];
    try {
      if (quiz.shiftsJson) {
        shiftsList = JSON.parse(quiz.shiftsJson);
      }
    } catch (e) {
      console.error("Error parsing shiftsJson:", e);
    }

    const totalShifts = quiz.shifts || 1;
    if (shiftsList.length === 0) {
      for (let i = 1; i <= totalShifts; i++) {
        shiftsList.push({
          shiftNumber: i,
          name: `Shift ${i}`,
          set: String.fromCharCode(65 + ((i - 1) % (quiz.sets || 1))),
          status: i < shiftNumber ? "COMPLETED" : i === shiftNumber ? "COMPLETED" : "PENDING",
        });
      }
    } else {
      shiftsList = shiftsList.map((s) => {
        if (s.shiftNumber === shiftNumber) {
          return { ...s, status: "COMPLETED" };
        }
        return s;
      });
    }

    // Determine next active shift
    const nextPendingShift = shiftsList.find((s) => s.status !== "COMPLETED" && s.shiftNumber > shiftNumber);
    const nextActiveShift = nextPendingShift ? nextPendingShift.shiftNumber : Math.min(shiftNumber + 1, totalShifts);

    // Update next active shift status in shiftsList if found
    shiftsList = shiftsList.map((s) => {
      if (s.shiftNumber === nextActiveShift && s.status !== "COMPLETED") {
        return { ...s, status: "ACTIVE" };
      }
      return s;
    });

    await prisma.quiz.update({
      where: { id: quiz.id },
      data: {
        shiftsJson: JSON.stringify(shiftsList),
        activeShift: nextActiveShift,
      },
    });

    const { emitSocketEvent } = await import("@/lib/socket-server");

    // Fetch all external kiosk systems for this quiz
    const systems = await prisma.externalQuizSystem.findMany({
      where: { quizId: quiz.id },
    });

    // 1. Broadcast force-submit and shift-completed to all kiosks
    systems.forEach((s) => {
      emitSocketEvent(`system-${s.systemCode}`, "shift-completed", {
        shiftCompleted: shiftNumber,
        nextActiveShift,
      });
      emitSocketEvent(`system-${s.systemCode}`, "status-changed", {
        status: "REGISTERED",
        shiftCompleted: shiftNumber,
        nextActiveShift,
      });
      emitSocketEvent(`system-${s.systemCode}`, "shift-changed", {
        activeShift: nextActiveShift,
        completedShift: shiftNumber,
      });
    });

    // 2. For any candidate who was assigned/in-progress during this shift and has no attempt recorded in DB yet, record their attempt
    for (const sys of systems) {
      if (sys.assignedStudentName && sys.assignedStudentEmail) {
        const currentShiftNum = sys.assignedShift || shiftNumber;
        const existingAttempt = await prisma.quizAttempt.findFirst({
          where: {
            quizId: quiz.id,
            externalSystemId: sys.id,
            shiftNumber: currentShiftNum,
            participantEmail: sys.assignedStudentEmail,
          },
        });

        if (!existingAttempt) {
          let totalQ = 0;
          try {
            const qData = JSON.parse(quiz.questionsJson);
            const setKey = sys.assignedSet || "A";
            if (qData && typeof qData === "object" && Array.isArray(qData[setKey])) {
              totalQ = qData[setKey].length;
            } else if (Array.isArray(qData)) {
              totalQ = qData.length;
            }
          } catch (e) {}

          const currentShiftName = sys.assignedShiftName || `Shift ${currentShiftNum}`;
          const currentSetNum = (sys.assignedSet || "A").charCodeAt(0) - 64;
          const uniqueUserId = `ext_${sys.id}_s${currentShiftNum}_${sys.assignedResponseId || sys.assignedStudentEmail.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}`;

          try {
            await prisma.quizAttempt.create({
              data: {
                quizId: quiz.id,
                userId: uniqueUserId,
                participantName: sys.assignedStudentName,
                participantEmail: sys.assignedStudentEmail,
                externalSystemId: sys.id,
                setNumber: currentSetNum,
                shiftNumber: currentShiftNum,
                shiftName: currentShiftName,
                score: 0,
                totalQuestions: totalQ,
                correctAnswers: 0,
                pointsEarned: 0,
                answersJson: JSON.stringify({ answers: [], note: "Submitted on Shift Completion" }),
                startedAt: sys.startedAt || new Date(),
                completedAt: new Date(),
              },
            });
          } catch (createErr) {
            console.error("Error creating fallback quiz attempt on shift completion:", createErr);
          }
        }
      }
    }

    // 3. Reset active student assignments on connected kiosk systems without deleting the kiosk registrations
    await prisma.externalQuizSystem.updateMany({
      where: { quizId: quiz.id },
      data: {
        assignedResponseId: null,
        assignedStudentName: null,
        assignedStudentEmail: null,
        assignedSet: null,
        assignedShift: nextActiveShift,
        assignedShiftName: `Shift ${nextActiveShift}`,
        status: "REGISTERED",
        attemptId: null,
        startedAt: null,
        completedAt: null,
      },
    });

    emitSocketEvent(`quiz-${quiz.id}`, "system-updated", {
      quizId: quiz.id,
      action: "shift-completed",
      completedShift: shiftNumber,
      nextActiveShift,
    });
    emitSocketEvent(`quiz-${quiz.quizId}`, "system-updated", {
      quizId: quiz.quizId,
      action: "shift-completed",
      completedShift: shiftNumber,
      nextActiveShift,
    });
    emitSocketEvent(`quiz-${quiz.id}`, "shift-changed", {
      quizId: quiz.id,
      activeShift: nextActiveShift,
      completedShift: shiftNumber,
    });
    emitSocketEvent(`quiz-${quiz.quizId}`, "shift-changed", {
      quizId: quiz.quizId,
      activeShift: nextActiveShift,
      completedShift: shiftNumber,
    });

    revalidatePath(`/admin/quizzes/${quiz.id}`);
    revalidatePath(`/admin/quizzes/${quiz.quizId}`);
    revalidatePath(`/admin/quizzes/${quiz.quizId}/systems`);
    revalidatePath(`/admin/quizzes/results/${quiz.quizId}`);
    revalidatePath(`/quiz/system-register`);

    return {
      status: "success" as const,
      message: `Shift ${shiftNumber} marked as completed successfully! Active student assignments have been reset for Shift ${nextActiveShift}. All completed quiz attempts and overall rankings remain fully preserved.`,
      nextActiveShift,
    };
  } catch (error) {
    console.error("Error completing shift:", error);
    return { status: "error" as const, message: "Failed to complete shift" };
  }
}

/**
 * Manually switch or activate a specific Shift
 */
export async function setActiveQuizShift(quizId: string, targetShiftNumber: number) {
  await requireCoAdmin();

  try {
    const quiz = await prisma.quiz.findFirst({
      where: {
        OR: [{ id: quizId }, { quizId: quizId }],
      },
    });

    if (!quiz) {
      return { status: "error" as const, message: "Quiz not found" };
    }

    let shiftsList: QuizShiftConfig[] = [];
    try {
      if (quiz.shiftsJson) {
        shiftsList = JSON.parse(quiz.shiftsJson);
      }
    } catch (e) {
      console.error("Error parsing shiftsJson:", e);
    }

    const totalShifts = quiz.shifts || 1;
    if (shiftsList.length === 0) {
      for (let i = 1; i <= totalShifts; i++) {
        shiftsList.push({
          shiftNumber: i,
          name: `Shift ${i}`,
          set: String.fromCharCode(65 + ((i - 1) % (quiz.sets || 1))),
          status: i === targetShiftNumber ? "ACTIVE" : i < targetShiftNumber ? "COMPLETED" : "PENDING",
        });
      }
    } else {
      shiftsList = shiftsList.map((s) => {
        if (s.shiftNumber === targetShiftNumber) {
          return { ...s, status: "ACTIVE" };
        }
        return s;
      });
    }

    await prisma.quiz.update({
      where: { id: quiz.id },
      data: {
        shiftsJson: JSON.stringify(shiftsList),
        activeShift: targetShiftNumber,
      },
    });

    // Update all registered systems to point to this active shift if currently in REGISTERED status
    await prisma.externalQuizSystem.updateMany({
      where: {
        quizId: quiz.id,
        status: "REGISTERED",
      },
      data: {
        assignedShift: targetShiftNumber,
        assignedShiftName: `Shift ${targetShiftNumber}`,
      },
    });

    const { emitSocketEvent } = await import("@/lib/socket-server");

    // Fetch systems
    const systems = await prisma.externalQuizSystem.findMany({
      where: { quizId: quiz.id },
      select: { systemCode: true },
    });

    systems.forEach((s) => {
      emitSocketEvent(`system-${s.systemCode}`, "shift-changed", {
        activeShift: targetShiftNumber,
      });
      emitSocketEvent(`system-${s.systemCode}`, "status-changed", {
        status: "REGISTERED",
        activeShift: targetShiftNumber,
      });
    });

    emitSocketEvent(`quiz-${quiz.id}`, "shift-changed", {
      quizId: quiz.id,
      activeShift: targetShiftNumber,
    });
    emitSocketEvent(`quiz-${quiz.quizId}`, "shift-changed", {
      quizId: quiz.quizId,
      activeShift: targetShiftNumber,
    });
    emitSocketEvent(`quiz-${quiz.id}`, "system-updated", {
      quizId: quiz.id,
      action: "shift-changed",
      activeShift: targetShiftNumber,
    });
    emitSocketEvent(`quiz-${quiz.quizId}`, "system-updated", {
      quizId: quiz.quizId,
      action: "shift-changed",
      activeShift: targetShiftNumber,
    });

    revalidatePath(`/admin/quizzes/${quiz.id}`);
    revalidatePath(`/admin/quizzes/${quiz.quizId}`);
    revalidatePath(`/admin/quizzes/${quiz.quizId}/systems`);
    revalidatePath(`/quiz/system-register`);

    return {
      status: "success" as const,
      message: `Shift ${targetShiftNumber} is now active!`,
      activeShift: targetShiftNumber,
    };
  } catch (error) {
    console.error("Error setting active shift:", error);
    return { status: "error" as const, message: "Failed to activate shift" };
  }
}

export async function unassignStudentFromSystem(systemId: string) {
  await requireCoAdmin();

  try {
    const system = await prisma.externalQuizSystem.update({
      where: { id: systemId },
      data: {
        assignedResponseId: null,
        assignedStudentName: null,
        assignedStudentEmail: null,
        assignedSet: null,
        status: "REGISTERED",
      },
    });

    emitSocketEvent(`quiz-${system.quizId}`, "system-updated", { systemCode: system.systemCode });
    emitSocketEvent(`system-${system.systemCode}`, "status-changed", { status: "REGISTERED" });

    revalidatePath(`/admin/quizzes/${system.quizId}`);

    return { status: "success" as const, message: "Student unassigned successfully", data: system };
  } catch (error) {
    console.error("Error unassigning student:", error);
    return { status: "error" as const, message: "Failed to unassign student" };
  }
}

export async function autoShuffleAndAssignSets(quizId: string) {
  await requireCoAdmin();

  try {
    const quiz = await prisma.quiz.findFirst({
      where: { OR: [{ id: quizId }, { quizId }] },
      select: { id: true, quizId: true, sets: true, shiftsJson: true, activeShift: true },
    });

    if (!quiz) {
      return { status: "error" as const, message: "Quiz not found" };
    }

    const systems = await prisma.externalQuizSystem.findMany({
      where: { quizId: quiz.id },
    });

    if (systems.length === 0) {
      return { status: "error" as const, message: "No systems registered to assign sets." };
    }

    // Determine available set letters for active shift or quiz
    let setLetters: string[] = [];
    const currentShift = quiz.activeShift || 1;
    if (quiz.shiftsJson) {
      try {
        const shiftConfigs: QuizShiftConfig[] = JSON.parse(quiz.shiftsJson);
        const matched = shiftConfigs.find((s) => s.shiftNumber === currentShift);
        if (matched?.sets && matched.sets.length > 0) {
          setLetters = matched.sets;
        } else if (matched?.set) {
          setLetters = [matched.set];
        }
      } catch (e) {
        console.error("Error parsing shifts in shuffle:", e);
      }
    }

    if (setLetters.length === 0) {
      const numSets = quiz.sets || 1;
      setLetters = Array.from({ length: numSets }, (_, i) => String.fromCharCode(65 + i));
    }

    // Sort systems naturally by system number
    systems.sort((a, b) =>
      a.systemNumber.localeCompare(b.systemNumber, undefined, { numeric: true, sensitivity: "base" })
    );

    // Generate non-consecutive shuffled set sequence
    const assignedSequence: string[] = [];
    let lastSet = "";

    for (let i = 0; i < systems.length; i++) {
      const validOptions = setLetters.length > 1 ? setLetters.filter((s) => s !== lastSet) : setLetters;
      const chosenSet = validOptions[Math.floor(Math.random() * validOptions.length)] || setLetters[i % setLetters.length];
      assignedSequence.push(chosenSet);
      lastSet = chosenSet;
    }

    // Update each system with its newly shuffled set
    const updatePromises = systems.map((sys, idx) =>
      prisma.externalQuizSystem.update({
        where: { id: sys.id },
        data: { assignedSet: assignedSequence[idx] },
      })
    );

    await Promise.all(updatePromises);

    // Emit real-time events to all systems and quiz room
    systems.forEach((sys, idx) => {
      emitSocketEvent(`system-${sys.systemCode}`, "status-changed", {
        status: sys.status,
        assignedStudentName: sys.assignedStudentName,
        assignedSet: assignedSequence[idx],
      });
    });

    emitSocketEvent(`quiz-${quiz.id}`, "system-updated", { quizId: quiz.id, action: "sets-shuffled" });
    emitSocketEvent(`quiz-${quiz.quizId}`, "system-updated", { quizId: quiz.quizId, action: "sets-shuffled" });

    revalidatePath(`/admin/quizzes/${quiz.id}`);
    revalidatePath(`/admin/quizzes/${quiz.quizId}`);

    return {
      status: "success" as const,
      message: `Successfully shuffled and distributed question sets (${setLetters.join(", ")}) across ${systems.length} systems!`,
    };
  } catch (error) {
    console.error("Error auto-shuffling sets:", error);
    return { status: "error" as const, message: "Failed to auto-assign sets" };
  }
}

export async function startSystemQuiz(systemId: string) {
  await requireCoAdmin();

  try {
    const system = await prisma.externalQuizSystem.update({
      where: { id: systemId },
      data: {
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });

    emitSocketEvent(`quiz-${system.quizId}`, "system-updated", { systemCode: system.systemCode });
    emitSocketEvent(`system-${system.systemCode}`, "status-changed", { status: "IN_PROGRESS" });
    emitSocketEvent(`system-${system.systemCode}`, "quiz-started", { systemCode: system.systemCode });

    revalidatePath(`/admin/quizzes/${system.quizId}`);

    return { status: "success" as const, message: "Quiz started for system", data: system };
  } catch (error) {
    console.error("Error starting system quiz:", error);
    return { status: "error" as const, message: "Failed to start quiz" };
  }
}

export async function startAllSystems(quizId: string) {
  await requireCoAdmin();

  try {
    // First fetch all ASSIGNED systems so we can send per-system events
    const assignedSystems = await prisma.externalQuizSystem.findMany({
      where: {
        quizId,
        status: "ASSIGNED",
      },
      select: { id: true, systemCode: true },
    });

    if (assignedSystems.length === 0) {
      return { status: "error" as const, message: "No assigned systems to start" };
    }

    // Batch update all to IN_PROGRESS
    await prisma.externalQuizSystem.updateMany({
      where: {
        quizId,
        status: "ASSIGNED",
      },
      data: {
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });

    // Notify admin dashboard
    emitSocketEvent(`quiz-${quizId}`, "system-updated", { quizId });
    emitSocketEvent(`quiz-${quizId}`, "quiz-started-all", { quizId });

    // Send per-system events so EVERY student client auto-starts without refresh
    const systemRooms = assignedSystems.map((s) => `system-${s.systemCode}`);
    emitSocketEventToRooms(
      systemRooms,
      "quiz-started",
      { quizId }
    );
    emitSocketEventToRooms(
      systemRooms,
      "status-changed",
      { status: "IN_PROGRESS" }
    );

    revalidatePath(`/admin/quizzes/${quizId}`);

    return { status: "success" as const, message: `Started quiz for ${assignedSystems.length} systems` };
  } catch (error) {
    console.error("Error starting all systems:", error);
    return { status: "error" as const, message: "Failed to start all systems" };
  }
}

export async function getSystemState(systemCode: string) {
  try {
    const { isExternalQuizEnabled } = await import("@/lib/system-settings");
    const isEnabled = await isExternalQuizEnabled();
    if (!isEnabled) {
      return { status: "error" as const, message: "External Quiz System is currently disabled by administrator." };
    }

    const system = await prisma.externalQuizSystem.findUnique({
      where: { systemCode },
      include: {
        quiz: {
          select: {
            id: true,
            quizId: true,
            title: true,
            description: true,
            duration: true,
            pointsPerQuestion: true,
            questionsJson: true,
            sets: true,
            shifts: true,
            shiftsJson: true,
            activeShift: true,
            isActive: true,
          },
        },
      },
    });

    if (!system) {
      return { status: "error" as const, message: "System session not found" };
    }

    return { status: "success" as const, data: system };
  } catch (error) {
    console.error("Error fetching system state:", error);
    return { status: "error" as const, message: "Failed to fetch system state" };
  }
}

export async function submitExternalQuizAttempt({
  systemCode,
  answersJson,
  totalQuestions,
  correctAnswers,
  score,
  pointsEarned,
  setNumber = 1,
}: {
  systemCode: string;
  answersJson: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  pointsEarned: number;
  setNumber?: number;
}) {
  try {
    const system = await prisma.externalQuizSystem.findUnique({
      where: { systemCode },
      include: { quiz: true },
    });

    if (!system || !system.assignedStudentName || !system.assignedStudentEmail) {
      return { status: "error" as const, message: "Invalid system session or unassigned student" };
    }

    const userId = `ext_${system.id}`;
    const shiftNumber = system.assignedShift || 1;
    const shiftName = system.assignedShiftName || `Shift ${shiftNumber}`;

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: system.quizId,
        userId,
        participantName: system.assignedStudentName,
        participantEmail: system.assignedStudentEmail,
        externalSystemId: system.id,
        setNumber,
        shiftNumber,
        shiftName,
        score,
        totalQuestions,
        correctAnswers,
        pointsEarned,
        answersJson,
        startedAt: system.startedAt || new Date(),
        completedAt: new Date(),
      },
    });

    await prisma.externalQuizSystem.update({
      where: { id: system.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        attemptId: attempt.id,
      },
    });

    return { status: "success" as const, message: "Quiz submitted successfully", attemptId: attempt.id };
  } catch (error) {
    console.error("Error submitting external quiz attempt:", error);
    return { status: "error" as const, message: "Failed to submit quiz attempt" };
  }
}

export async function publishStudentResult(attemptId: string) {
  await requireAdmin();

  try {
    const { sendQuizResultEmail } = await import("@/lib/mailer");

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          select: {
            title: true,
            questionsJson: true,
            cutoffType: true,
            cutoffMarks: true,
            topSelectCount: true,
          },
        },
      },
    });

    if (!attempt) {
      return { status: "error" as const, message: "Attempt not found" };
    }

    let recipientEmail = attempt.participantEmail;
    let recipientName = attempt.participantName || "Student";

    if (!recipientEmail && attempt.userId && !attempt.userId.startsWith("ext_")) {
      const user = await prisma.user.findUnique({
        where: { id: attempt.userId },
        select: { email: true, name: true },
      });
      if (user) {
        recipientEmail = user.email;
        recipientName = user.name;
      }
    }

    if (!recipientEmail) {
      return { status: "error" as const, message: "Student email address not found" };
    }

    // Helper to find correct answer index across multiple data types
    const findCorrectAnswerIndex = (question: any): number => {
      if (!question || !Array.isArray(question.options)) return -1;
      const options = question.options.map((opt: any) =>
        opt !== null && opt !== undefined ? String(opt).trim() : ""
      );

      if (typeof question.correctAnswer === "number" && question.correctAnswer >= 0 && question.correctAnswer < options.length) {
        return question.correctAnswer;
      }
      if (typeof question.answer === "number" && question.answer >= 0 && question.answer < options.length) {
        return question.answer;
      }

      const rawTarget = question.correctAnswer !== undefined && question.correctAnswer !== null ? question.correctAnswer : question.answer;
      if (rawTarget === undefined || rawTarget === null) return -1;
      const targetStr = String(rawTarget).trim();

      const exactIdx = options.findIndex((opt: string) => opt.toLowerCase() === targetStr.toLowerCase());
      if (exactIdx !== -1) return exactIdx;

      const parsedNum = parseInt(targetStr, 10);
      if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum < options.length && String(parsedNum) === targetStr) {
        return parsedNum;
      }

      if (targetStr.length === 1) {
        const letterIdx = targetStr.toUpperCase().charCodeAt(0) - 65;
        if (letterIdx >= 0 && letterIdx < options.length) {
          return letterIdx;
        }
      }

      return -1;
    };

    // Build answers breakdown
    let answersBreakdown: Array<{
      question: string;
      userAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
    }> = [];

    try {
      const parsedAnswers = JSON.parse(attempt.answersJson || "{}");
      const allQuestions = JSON.parse(attempt.quiz.questionsJson || "{}");

      let questionsList: any[] = [];
      const setLetter = attempt.setNumber && attempt.setNumber >= 1 && attempt.setNumber <= 26
        ? String.fromCharCode(64 + attempt.setNumber)
        : "A";

      if (typeof allQuestions === "object" && !Array.isArray(allQuestions) && allQuestions !== null) {
        questionsList = allQuestions[setLetter] || allQuestions["A"] || [];
      } else if (Array.isArray(allQuestions)) {
        questionsList = allQuestions;
      }

      let userAnswersMap: Record<number, any> = {};
      if (parsedAnswers) {
        if (Array.isArray(parsedAnswers.answers)) {
          parsedAnswers.answers.forEach((ans: any, idx: number) => {
            const qIdx = typeof ans.questionIndex === "number" ? ans.questionIndex : idx;
            const aVal = ans.answerIndex !== undefined ? ans.answerIndex : ans.userAnswer;
            if (aVal !== undefined && aVal !== null) userAnswersMap[qIdx] = aVal;
          });
        } else if (typeof parsedAnswers.answers === "object" && parsedAnswers.answers !== null) {
          Object.entries(parsedAnswers.answers).forEach(([k, v]) => {
            const qIdx = parseInt(k, 10);
            if (!isNaN(qIdx) && v !== undefined && v !== null) userAnswersMap[qIdx] = v;
          });
        } else if (typeof parsedAnswers === "object") {
          Object.entries(parsedAnswers).forEach(([k, v]) => {
            if (k === "tabSwitches" || k === "submittedAt") return;
            const qIdx = parseInt(k, 10);
            if (!isNaN(qIdx) && v !== undefined && v !== null) userAnswersMap[qIdx] = v;
          });
        }
      }

      answersBreakdown = questionsList.map((q: any, idx: number) => {
        const options: string[] = Array.isArray(q.options) ? q.options : [];
        const rawAns = userAnswersMap[idx];

        let uOptIdx = -1;
        if (typeof rawAns === "number" && rawAns >= 0 && rawAns < options.length) {
          uOptIdx = rawAns;
        } else if (rawAns !== undefined && rawAns !== null) {
          const str = String(rawAns).trim();
          const parsedNum = parseInt(str, 10);
          if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum < options.length && String(parsedNum) === str) {
            uOptIdx = parsedNum;
          } else {
            uOptIdx = options.findIndex((opt) => String(opt).trim().toLowerCase() === str.toLowerCase());
            if (uOptIdx === -1 && str.length === 1) {
              const letterIdx = str.toUpperCase().charCodeAt(0) - 65;
              if (letterIdx >= 0 && letterIdx < options.length) uOptIdx = letterIdx;
            }
          }
        }

        const correctOptIdx = findCorrectAnswerIndex(q);
        const uAnsText = uOptIdx !== -1 && options[uOptIdx] ? options[uOptIdx] : "Unanswered";
        const cAnsText = correctOptIdx !== -1 && options[correctOptIdx] ? options[correctOptIdx] : (q.answer || "N/A");
        const isCorrect = uOptIdx !== -1 && correctOptIdx !== -1 && uOptIdx === correctOptIdx;

        return {
          question: q.question,
          userAnswer: uAnsText,
          correctAnswer: cAnsText,
          isCorrect,
        };
      });
    } catch (parseErr) {
      console.error("Error parsing answers for breakdown:", parseErr);
    }

    let isPassed = attempt.score >= 50;
    let statusLabel = isPassed ? "QUALIFIED / PASSED" : "FAILED / NOT QUALIFIED";

    const mode = attempt.quiz.cutoffType || "PERCENTAGE";
    if (mode === "TOP_N") {
      const { calculateQuizRankings } = await import("@/lib/quiz-ranking");
      const allQuizAttempts = await prisma.quizAttempt.findMany({
        where: { quizId: attempt.quizId },
      });
      const { rankMap, rankedDetailsMap } = calculateQuizRankings(allQuizAttempts);
      const rank = rankMap.get(attempt.id) || 1;
      const isTied = rankedDetailsMap.get(attempt.id)?.isTied || false;
      const topCount = attempt.quiz.topSelectCount || 10;
      isPassed = rank > 0 && rank <= topCount;
      const rankSuffix = isTied ? ` (Rank #${rank} Tied)` : ` (Rank #${rank})`;
      statusLabel = isPassed ? `QUALIFIED${rankSuffix}` : `FAILED${rankSuffix}`;
    } else if (mode === "MARKS") {
      const minMarks = attempt.quiz.cutoffMarks ?? 0;
      isPassed = (attempt.pointsEarned ?? 0) >= minMarks;
      statusLabel = isPassed ? `QUALIFIED (>= ${minMarks} pts)` : `FAILED (< ${minMarks} pts)`;
    } else {
      const minPercentage = attempt.quiz.cutoffMarks ?? 50;
      isPassed = (attempt.score ?? 0) >= minPercentage;
      statusLabel = isPassed ? `QUALIFIED (>= ${minPercentage}%)` : `FAILED (< ${minPercentage}%)`;
    }

    const emailResult = await sendQuizResultEmail({
      to: recipientEmail,
      recipientName,
      quizTitle: attempt.quiz.title,
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      correctAnswers: attempt.correctAnswers,
      pointsEarned: attempt.pointsEarned,
      isPassed,
      statusLabel,
      answersBreakdown,
    });

    if (!emailResult.success) {
      return { status: "error" as const, message: "Failed to send email to student" };
    }

    const updated = await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    revalidatePath(`/admin/quizzes/results/${attempt.quizId}`);

    return { status: "success" as const, message: `Results published and emailed to ${recipientEmail}`, data: updated };
  } catch (error) {
    console.error("Error publishing student result:", error);
    return { status: "error" as const, message: "Failed to publish result" };
  }
}

export async function publishAllResults(quizId: string) {
  await requireAdmin();

  try {
    const attempts = await prisma.quizAttempt.findMany({
      where: { 
        quizId,
        isPublished: false,
        completedAt: { not: null }
      },
      select: { id: true },
    });

    if (attempts.length === 0) {
      return { status: "error" as const, message: "No unpublished, completed attempts found." };
    }

    let successCount = 0;
    let failCount = 0;

    for (const attempt of attempts) {
      const res = await publishStudentResult(attempt.id);
      if (res.status === "success") {
        successCount++;
      } else {
        failCount++;
      }
    }

    revalidatePath(`/admin/quizzes/results/${quizId}`);

    return { 
      status: "success" as const, 
      message: `Published results: ${successCount} sent, ${failCount} failed.`, 
      data: { successCount, failCount } 
    };
  } catch (error) {
    console.error("Error publishing all results:", error);
    return { status: "error" as const, message: "Failed to publish all results" };
  }
}

/**
 * Fetch Student Details (Name & Email) by Response ID from FormResponse
 */
export async function getStudentDetailsByResponseId(responseId: string) {
  try {
    if (!responseId || !responseId.trim()) {
      return { status: "error" as const, message: "Response ID is required" };
    }

    const cleanId = responseId.trim();

    // Query FormResponse by id or partial id match
    let formResponse = await prisma.formResponse.findUnique({
      where: { id: cleanId },
      include: { form: true },
    });

    if (!formResponse) {
      // Try search by ID prefix or containing cleanId
      formResponse = await prisma.formResponse.findFirst({
        where: {
          OR: [
            { id: { contains: cleanId, mode: "insensitive" } },
          ],
        },
        include: { form: true },
      });
    }

    if (!formResponse) {
      return { status: "error" as const, message: `No form response found matching Response ID '${cleanId}'` };
    }

    const answersObj = (formResponse.answers || {}) as Record<string, unknown>;
    let studentName = "";
    let studentEmail = "";

    for (const [k, v] of Object.entries(answersObj)) {
      if (typeof v === "string") {
        const valStr = v.trim();
        const keyLower = k.toLowerCase();

        if (!studentEmail && (keyLower.includes("email") || (valStr.includes("@") && valStr.includes(".")))) {
          studentEmail = valStr;
        }
        if (!studentName && (keyLower.includes("name") || keyLower.includes("candidate") || keyLower.includes("student"))) {
          studentName = valStr;
        }
      }
    }

    // Fallback search if name or email not identified by key name
    if (!studentName || !studentEmail) {
      for (const [_, v] of Object.entries(answersObj)) {
        if (typeof v === "string") {
          const valStr = v.trim();
          if (!studentEmail && valStr.includes("@") && valStr.includes(".")) {
            studentEmail = valStr;
          } else if (!studentName && valStr.length > 2 && !valStr.includes("@") && !/\d{5,}/.test(valStr)) {
            studentName = valStr;
          }
        }
      }
    }

    return {
      status: "success" as const,
      message: "Student details fetched successfully",
      data: {
        responseId: formResponse.id,
        formTitle: formResponse.form?.title || "Form Response",
        studentName: studentName || `Candidate (${formResponse.id.slice(0, 6)})`,
        studentEmail: studentEmail || "",
      },
    };
  } catch (error) {
    console.error("Error fetching student by Response ID:", error);
    return { status: "error" as const, message: "Failed to fetch student details" };
  }
}

/**
 * Combined monitor data fetch (systems + blocked members) to optimize server load
 */
export async function getQuizMonitorData(quizId: string) {
  try {
    const quiz = await prisma.quiz.findFirst({
      where: { OR: [{ id: quizId }, { quizId }] },
      select: { id: true, quizId: true, title: true, sets: true, shifts: true, shiftsJson: true, activeShift: true },
    });

    const targetIds = quiz ? [quiz.id, quiz.quizId] : [quizId];

    const [systems, blocks] = await Promise.all([
      prisma.externalQuizSystem.findMany({
        where: { quizId: { in: targetIds } },
      }),
      prisma.quizBlock.findMany({
        where: { quizId: { in: targetIds } },
        orderBy: { blockedAt: "desc" },
      }),
    ]);

    const numSets = quiz?.sets || 1;

    systems.sort((a, b) =>
      a.systemNumber.localeCompare(b.systemNumber, undefined, { numeric: true, sensitivity: "base" })
    );

    const processedSystems = systems.map((sys, idx) => ({
      ...sys,
      assignedSet: sys.assignedSet || String.fromCharCode(65 + (idx % numSets)),
    }));

    const userIds = blocks.map((b) => b.userId).filter((id) => !id.startsWith("ext_"));
    const users =
      userIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, email: true },
          })
        : [];

    const userMap = new Map(users.map((u) => [u.id, u]));

    const blockedMembersMap = new Map<string, any>();

    blocks.forEach((block) => {
      const extSys = systems.find(
        (s) => `ext_${s.id}` === block.userId || s.id === block.userId || s.systemCode === block.userId
      );

      let name = "Candidate";
      let email = "";
      let systemNumber = "";

      if (extSys) {
        name = extSys.assignedStudentName || `Kiosk ${extSys.systemNumber}`;
        email = extSys.assignedStudentEmail || "";
        systemNumber = extSys.systemNumber;
      } else {
        const u = userMap.get(block.userId);
        if (u) {
          name = u.name || "Member";
          email = u.email || "";
        }
      }

      blockedMembersMap.set(block.userId, {
        id: block.id,
        quizId: block.quizId,
        userId: block.userId,
        reason: block.reason,
        violationType: block.violationType,
        violationCount: block.violationCount,
        blockedAt: block.blockedAt.toISOString(),
        name,
        email,
        systemNumber,
      });
    });

    // Also include any systems explicitly marked as BLOCKED
    systems.forEach((sys) => {
      if (sys.status === "BLOCKED") {
        const uId = `ext_${sys.id}`;
        if (!blockedMembersMap.has(uId) && !blockedMembersMap.has(sys.id) && !blockedMembersMap.has(sys.systemCode)) {
          blockedMembersMap.set(uId, {
            id: sys.id,
            quizId: quiz?.id || quizId,
            userId: uId,
            reason: "Multiple proctoring violations detected",
            violationType: "SECURITY_VIOLATION",
            violationCount: 1,
            blockedAt: new Date().toISOString(),
            name: sys.assignedStudentName || `Kiosk ${sys.systemNumber}`,
            email: sys.assignedStudentEmail || "",
            systemNumber: sys.systemNumber,
          });
        }
      }
    });

    const blockedMembers = Array.from(blockedMembersMap.values());

    return {
      status: "success" as const,
      data: {
        quiz,
        systems: processedSystems,
        blockedMembers,
      },
    };
  } catch (error) {
    console.error("Error fetching quiz monitor data:", error);
    return { status: "error" as const, message: "Failed to fetch quiz monitor data" };
  }
}

export async function setSystemAttemptingAction(systemCode: string) {
  try {
    const system = await prisma.externalQuizSystem.update({
      where: { systemCode },
      data: { status: "ATTEMPTING" },
    });

    const { emitSocketEvent } = await import("@/lib/socket-server");
    emitSocketEvent(`quiz-${system.quizId}`, "system-updated", { systemCode });
    emitSocketEvent(`system-${systemCode}`, "status-changed", { status: "ATTEMPTING" });

    return { status: "success" as const };
  } catch (error) {
    console.error("Error setting system status to ATTEMPTING:", error);
    return { status: "error" as const, message: "Failed to update status" };
  }
}

export async function unblockQuizCandidate(quizId: string, userId: string) {
  await requireCoAdmin();

  try {
    const rawId = userId.replace("ext_", "");

    // Find external system by ID, raw ID, or systemCode
    const sys = await prisma.externalQuizSystem.findFirst({
      where: {
        OR: [
          { id: rawId },
          { id: userId },
          { systemCode: userId },
          { systemCode: rawId },
        ],
      },
    });

    // Delete matching QuizBlocks
    await prisma.quizBlock.deleteMany({
      where: {
        quizId,
        OR: [
          { userId },
          { userId: rawId },
          { userId: `ext_${rawId}` },
          ...(sys ? [{ userId: sys.id }, { userId: sys.systemCode }, { userId: `ext_${sys.id}` }] : []),
        ],
      },
    });

    const { emitSocketEvent } = await import("@/lib/socket-server");

    if (sys) {
      await prisma.externalQuizSystem.update({
        where: { id: sys.id },
        data: { status: "ATTEMPTING" },
      });

      emitSocketEvent(`system-${sys.systemCode}`, "unblocked", { systemCode: sys.systemCode });
      emitSocketEvent(`system-${sys.systemCode}`, "status-changed", { status: "ATTEMPTING" });
      emitSocketEvent(`quiz-${sys.quizId}`, "system-updated", { systemCode: sys.systemCode });
    }

    emitSocketEvent(`quiz-${quizId}`, "blocked-updated", { quizId, userId });
    emitSocketEvent(`quiz-${quizId}`, "system-updated", { quizId });

    revalidatePath(`/admin/quizzes/${quizId}`);

    return { status: "success" as const, message: "Candidate unblocked successfully" };
  } catch (error) {
    console.error("Error unblocking candidate:", error);
    return { status: "error" as const, message: "Failed to unblock candidate" };
  }
}



