"use server";

import { getCurrentUser } from "@/app/data/admin/get-current-user";
import { prisma } from "@/lib/db";

export async function getMyProjectSubmissions() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return {
        status: "error" as const,
        message: "Not authenticated",
        data: [],
      };
    }

    const submissions = await prisma.projectReview.findMany({
      where: {
        userId: currentUser.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      status: "success" as const,
      data: submissions,
    };
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return {
      status: "error" as const,
      message: "Failed to fetch submissions",
      data: [],
    };
  }
}

export async function deleteSubmission(submissionId: string) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    // Verify the submission belongs to the user
    const submission = await prisma.projectReview.findUnique({
      where: { id: submissionId },
    });

    if (!submission || submission.userId !== currentUser.id) {
      return {
        success: false,
        message: "Submission not found or unauthorized",
      };
    }

    // Only allow deleting pending submissions
    if (submission.status !== "pending") {
      return {
        success: false,
        message: "Can only delete pending submissions",
      };
    }

    await prisma.projectReview.delete({
      where: { id: submissionId },
    });

    return {
      success: true,
      message: "Submission deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting submission:", error);
    return {
      success: false,
      message: "Failed to delete submission",
    };
  }
}
