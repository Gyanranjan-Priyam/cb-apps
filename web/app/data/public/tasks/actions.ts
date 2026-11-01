"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { S3 } from "@/lib/s3Client";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";

export interface PublicTaskData {
  id: string;
  taskNumber: number;
  title: string;
  description: string | null;
  startDate: Date;
  dueDate: Date;
  points: number;
  createdAt: Date;
}

export interface UserTaskSubmission {
  status: string;
  pointsAwarded: number;
  feedback: string | null;
  submittedAt: Date | null;
  evaluatedAt: Date | null;
  projectUrl: string | null;
  screenshotKey: string | null;
}

export async function getActiveTasks() {
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
    
    const tasks = await prisma.task.findMany({
      where: {
        startDate: {
          lte: now,
        },
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
        dueDate: 'asc',
      },
    });

    return {
      status: "success" as const,
      data: tasks,
    };
  } catch (error) {
    console.error("Error fetching active tasks:", error);
    return {
      status: "error" as const,
      message: "Failed to fetch tasks",
    };
  }
}

export async function getAllPublicTasks() {
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

    const tasks = await prisma.task.findMany({
      where: userBatchId
        ? {
            OR: [
              { targetBatchIds: { equals: [] } },
              { targetBatchIds: { has: userBatchId } },
            ],
          }
        : {
            targetBatchIds: { equals: [] },
          },
      orderBy: {
        taskNumber: 'desc',
      },
    });

    return {
      status: "success" as const,
      data: tasks,
    };
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return {
      status: "error" as const,
      message: "Failed to fetch tasks",
    };
  }
}

export async function getUserTaskSubmissions(userId: string) {
  try {
    const submissions = await prisma.taskSubmission.findMany({
      where: {
        userId,
      },
      include: {
        task: true,
      },
    });

    const submissionMap: Record<string, UserTaskSubmission> = {};
    
    submissions.forEach((sub) => {
      submissionMap[sub.taskId] = {
        status: sub.status,
        pointsAwarded: sub.pointsAwarded,
        feedback: sub.feedback,
        submittedAt: sub.submittedAt,
        evaluatedAt: sub.evaluatedAt,
        projectUrl: sub.projectUrl,
        screenshotKey: sub.screenshotKey,
      };
    });

    return {
      status: "success" as const,
      data: submissionMap,
    };
  } catch (error) {
    console.error("Error fetching user submissions:", error);
    return {
      status: "error" as const,
      message: "Failed to fetch submissions",
    };
  }
}

export async function getTaskDetails(taskNumber: number) {
  try {
    const task = await prisma.task.findUnique({
      where: {
        taskNumber,
      },
    });

    if (!task) {
      return {
        status: "error" as const,
        message: "Task not found",
      };
    }

    return {
      status: "success" as const,
      data: task,
    };
  } catch (error) {
    console.error("Error fetching task details:", error);
    return {
      status: "error" as const,
      message: "Failed to fetch task details",
    };
  }
}

export async function submitTask(
  taskId: string, 
  userId: string, 
  projectUrl: string, 
  screenshotKey?: string
) {
  try {
    // First, check if there's an existing submission
    const existingSubmission = await prisma.taskSubmission.findUnique({
      where: {
        taskId_userId: {
          taskId,
          userId,
        },
      },
      select: {
        screenshotKey: true,
      },
    });

    // If there's an existing screenshot and it's different from the new one, delete the old one from S3
    if (existingSubmission?.screenshotKey && existingSubmission.screenshotKey !== screenshotKey) {
      try {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
          Key: existingSubmission.screenshotKey,
        });
        await S3.send(deleteCommand);
        console.log(`Deleted old screenshot: ${existingSubmission.screenshotKey}`);
      } catch (deleteError) {
        console.error("Error deleting old screenshot:", deleteError);
        // Continue with submission even if deletion fails
      }
    }

    // Now upsert the submission with new data
    const submission = await prisma.taskSubmission.upsert({
      where: {
        taskId_userId: {
          taskId,
          userId,
        },
      },
      update: {
        status: "submitted",
        projectUrl,
        screenshotKey: screenshotKey || null,
        submittedAt: new Date(),
        updatedAt: new Date(),
        // Reset evaluation fields on resubmission
        pointsAwarded: 0,
        evaluatedAt: null,
        evaluatedBy: null,
        feedback: null,
      },
      create: {
        taskId,
        userId,
        status: "submitted",
        projectUrl,
        screenshotKey: screenshotKey || null,
        submittedAt: new Date(),
      },
    });

    return {
      status: "success" as const,
      message: existingSubmission ? "Task resubmitted successfully" : "Task submitted successfully",
      data: submission,
    };
  } catch (error) {
    console.error("Error submitting task:", error);
    return {
      status: "error" as const,
      message: "Failed to submit task",
    };
  }
}

export async function getUserGitHubRepos(username: string) {
  try {
    const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch repositories");
    }

    const repos = await response.json();
    
    return {
      status: "success" as const,
      data: repos.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        url: repo.html_url,
        description: repo.description,
        language: repo.language,
        updatedAt: repo.updated_at,
        private: repo.private,
      })),
    };
  } catch (error) {
    console.error("Error fetching GitHub repos:", error);
    return {
      status: "error" as const,
      message: "Failed to fetch repositories",
    };
  }
}
