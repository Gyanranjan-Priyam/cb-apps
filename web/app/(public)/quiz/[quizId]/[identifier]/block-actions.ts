"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/app/data/admin/get-current-user";
import { revalidatePath } from "next/cache";

interface BlockUserFromQuizParams {
  quizId: string; // The quiz database ID
  quizIdentifier: string; // The quiz public ID (quizId field)
  reason: string;
  violationType: string;
  violationCount: number;
  userId?: string;
  systemCode?: string;
}

export async function blockUserFromQuizAction(params: BlockUserFromQuizParams) {
  try {
    let targetUserId = params.userId || "";
    let systemObj: any = null;

    // Check if this is an external candidate
    if (params.systemCode || targetUserId.startsWith("ext_")) {
      if (params.systemCode) {
        systemObj = await prisma.externalQuizSystem.findUnique({
          where: { systemCode: params.systemCode },
        });
      } else if (targetUserId.startsWith("ext_")) {
        const sysId = targetUserId.replace("ext_", "");
        systemObj = await prisma.externalQuizSystem.findUnique({
          where: { id: sysId },
        });
      }

      if (systemObj) {
        targetUserId = `ext_${systemObj.id}`;
      }
    }

    // Fallback for internal user if no targetUserId established
    if (!targetUserId) {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        targetUserId = currentUser.id;
      }
    }

    if (!targetUserId) {
      return {
        status: "error" as const,
        message: "User identifier not authenticated or found",
      };
    }

    // Upsert quiz block record so repeat calls don't error out
    await prisma.quizBlock.upsert({
      where: {
        quizId_userId: {
          quizId: params.quizId,
          userId: targetUserId,
        },
      },
      create: {
        quizId: params.quizId,
        userId: targetUserId,
        reason: params.reason,
        violationType: params.violationType,
        violationCount: params.violationCount,
      },
      update: {
        reason: params.reason,
        violationType: params.violationType,
        violationCount: params.violationCount,
      },
    });

    // If external system candidate, update system status to BLOCKED and trigger Pusher WebSockets
    if (systemObj || targetUserId.startsWith("ext_")) {
      if (systemObj) {
        await prisma.externalQuizSystem.update({
          where: { id: systemObj.id },
          data: { status: "BLOCKED" },
        });

        const { emitSocketEvent } = await import("@/lib/socket-server");
        emitSocketEvent(`quiz-${params.quizId}`, "blocked-updated", { quizId: params.quizId });
        emitSocketEvent(`quiz-${params.quizId}`, "system-updated", { quizId: params.quizId, systemCode: systemObj.systemCode });
        emitSocketEvent(`quiz-${params.quizIdentifier}`, "blocked-updated", { quizId: params.quizIdentifier });
        emitSocketEvent(`quiz-${params.quizIdentifier}`, "system-updated", { quizId: params.quizIdentifier, systemCode: systemObj.systemCode });
        emitSocketEvent(`system-${systemObj.systemCode}`, "status-changed", { status: "BLOCKED" });
      }
    } else {
      // Internal user -> update global ban status
      await prisma.user.update({
        where: { id: targetUserId },
        data: {
          banned: true,
          banReason: `Blocked from quiz "${params.quizIdentifier}" - ${params.reason}`,
          banExpires: null,
        },
      });
    }

    revalidatePath("/admin/quizzes/blocked-members");
    revalidatePath(`/admin/quizzes/${params.quizIdentifier}`);

    return {
      status: "success" as const,
      message: "Candidate has been blocked from quiz",
    };
  } catch (error) {
    console.error("Error blocking candidate from quiz:", error);
    return {
      status: "error" as const,
      message: "Failed to block candidate from quiz",
    };
  }
}

export async function checkQuizBlockStatus(quizDbId: string, userId: string) {
  try {
    const block = await prisma.quizBlock.findUnique({
      where: {
        quizId_userId: {
          quizId: quizDbId,
          userId: userId,
        },
      },
    });

    return {
      status: "success" as const,
      isBlocked: !!block,
      blockDetails: block,
    };
  } catch (error) {
    console.error("Error checking quiz block status:", error);
    return {
      status: "error" as const,
      message: "Failed to check block status",
      isBlocked: false,
    };
  }
}
