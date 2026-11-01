"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { isSystemAdminRole } from "@/lib/member-roles";

export async function blockUserFromQuiz(
  userId: string,
  reason: string,
  banDays: number = 7
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || !isSystemAdminRole(session.user.role)) {
      return {
        status: "error" as const,
        message: "Unauthorized access",
      };
    }

    // Calculate ban expiration
    const banExpires = banDays > 0 
      ? new Date(Date.now() + banDays * 24 * 60 * 60 * 1000)
      : null; // null means permanent ban

    // Update user ban status
    await prisma.user.update({
      where: { id: userId },
      data: {
        banned: true,
        banReason: reason,
        banExpires: banExpires,
      },
    });

    revalidatePath("/admin/quizzes/blocked-members");
    revalidatePath("/admin/members");
    revalidatePath("/dashboard/activities/quizzes");
    revalidatePath("/quiz");

    return {
      status: "success" as const,
      message: "User has been blocked from quizzes",
    };
  } catch (error) {
    console.error("Error blocking user:", error);
    return {
      status: "error" as const,
      message: "Failed to block user",
    };
  }
}

export async function unblockUserFromQuiz(userId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || !isSystemAdminRole(session.user.role)) {
      return {
        status: "error" as const,
        message: "Unauthorized access",
      };
    }

    // Remove all quiz blocks for this user
    await prisma.quizBlock.deleteMany({
      where: { userId },
    });

    // Remove global ban from user
    await prisma.user.update({
      where: { id: userId },
      data: {
        banned: false,
        banReason: null,
        banExpires: null,
      },
    });

    revalidatePath("/admin/quizzes/blocked-members");
    revalidatePath("/admin/members");
    revalidatePath("/dashboard/activities/quizzes");
    revalidatePath("/quiz");

    return {
      status: "success" as const,
      message: "User has been unblocked from all quizzes",
    };
  } catch (error) {
    console.error("Error unblocking user:", error);
    return {
      status: "error" as const,
      message: "Failed to unblock user",
    };
  }
}

export async function unblockUserFromSpecificQuiz(userId: string, quizId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || !isSystemAdminRole(session.user.role)) {
      return {
        status: "error" as const,
        message: "Unauthorized access",
      };
    }

    // Remove quiz block for this specific quiz
    await prisma.quizBlock.delete({
      where: {
        quizId_userId: {
          quizId,
          userId,
        },
      },
    });

    // Check if user has other quiz blocks
    const remainingBlocks = await prisma.quizBlock.count({
      where: { userId },
    });

    // If no more blocks, remove global ban
    if (remainingBlocks === 0) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          banned: false,
          banReason: null,
          banExpires: null,
        },
      });
    }

    revalidatePath("/admin/quizzes/blocked-members");
    revalidatePath("/admin/members");
    revalidatePath("/dashboard/activities/quizzes");
    revalidatePath("/quiz");

    return {
      status: "success" as const,
      message: "User has been unblocked from this quiz",
    };
  } catch (error) {
    console.error("Error unblocking user from quiz:", error);
    return {
      status: "error" as const,
      message: "Failed to unblock user from quiz",
    };
  }
}

export async function getQuizzesWithBlockedMembers() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || !isSystemAdminRole(session.user.role)) {
      return {
        status: "error" as const,
        message: "Unauthorized access",
      };
    }

    // Get all quizzes
    const quizzes = await prisma.quiz.findMany({
      select: {
        id: true,
        quizId: true,
        title: true,
        description: true,
        startDateTime: true,
        endDateTime: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // For each quiz, get quiz-specific blocks
    const quizzesWithBlockedMembers = await Promise.all(
      quizzes.map(async (quiz) => {
        // Get quiz-specific blocks
        const quizBlocks = await prisma.quizBlock.findMany({
          where: {
            quizId: quiz.id,
          },
          select: {
            id: true,
            userId: true,
            reason: true,
            violationType: true,
            violationCount: true,
            blockedAt: true,
          },
        });

        // Get user details for blocked users
        const blockedUserIds = quizBlocks.map(block => block.userId);
        const blockedUsers = await prisma.user.findMany({
          where: {
            id: {
              in: blockedUserIds,
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            profileImageKey: true,
            branch: true,
            banned: true,
            banReason: true,
            banExpires: true,
          },
        });

        // Combine user data with block data
        const blockedMembers = blockedUsers.map(user => {
          const blockInfo = quizBlocks.find(block => block.userId === user.id);
          return {
            ...user,
            quizBlockId: blockInfo?.id,
            quizBlockReason: blockInfo?.reason,
            violationType: blockInfo?.violationType,
            violationCount: blockInfo?.violationCount,
            blockedAt: blockInfo?.blockedAt,
          };
        });

        return {
          ...quiz,
          blockedMembers,
          blockedCount: blockedMembers.length,
        };
      })
    );

    // Filter to only show quizzes with blocked members
    const quizzesWithBlocked = quizzesWithBlockedMembers.filter(
      (q) => q.blockedCount > 0
    );

    return {
      status: "success" as const,
      data: quizzesWithBlocked,
    };
  } catch (error) {
    console.error("Error fetching quizzes with blocked members:", error);
    return {
      status: "error" as const,
      message: "Failed to fetch blocked members data",
    };
  }
}
