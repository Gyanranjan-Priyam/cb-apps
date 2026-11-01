"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { requireCoAdmin } from "@/app/data/admin/require-co-admin";
import { revalidatePath } from "next/cache";
import { emitSocketEvent } from "@/lib/socket-server";

export interface TaskData {
  id: string;
  taskNumber: number;
  title: string;
  description: string | null;
  startDate: Date;
  dueDate: Date;
  points: number;
  targetBatchIds?: string[];
  createdAt: Date;
}

export async function getAllTasks() {
  await requireCoAdmin();
  
  try {
    const tasks = await prisma.task.findMany({
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

export async function createTask(data: {
  taskNumber?: number;
  title: string;
  description?: string;
  startDate: Date;
  dueDate: Date;
  points: number;
  targetBatchIds?: string[];
  createdBy: string;
}) {
  await requireCoAdmin();
  
  try {
    let finalTaskNumber = data.taskNumber;

    if (!finalTaskNumber || finalTaskNumber <= 0) {
      const latest = await prisma.task.findFirst({
        orderBy: { taskNumber: "desc" },
        select: { taskNumber: true },
      });
      finalTaskNumber = (latest?.taskNumber || 0) + 1;
    } else {
      // Check if task number already exists
      const existingTask = await prisma.task.findUnique({
        where: { taskNumber: finalTaskNumber },
      });

      if (existingTask) {
        return {
          status: "error" as const,
          message: `Task #${finalTaskNumber} already exists`,
        };
      }
    }

    const task = await prisma.task.create({
      data: {
        taskNumber: finalTaskNumber,
        title: data.title,
        description: data.description || null,
        startDate: data.startDate,
        dueDate: data.dueDate,
        points: data.points,
        targetBatchIds: data.targetBatchIds || [],
        createdBy: data.createdBy,
      },
    });

    revalidatePath("/admin/tasks");
    revalidatePath("/admin/points");

    return {
      status: "success" as const,
      message: "Task created successfully",
      data: task,
    };
  } catch (error) {
    console.error("Error creating task:", error);
    return {
      status: "error" as const,
      message: "Failed to create task",
    };
  }
}

export async function getTaskById(id: string) {
  await requireCoAdmin();
  
  try {
    const task = await prisma.task.findUnique({
      where: { id },
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
    console.error("Error fetching task:", error);
    return {
      status: "error" as const,
      message: "Failed to fetch task",
    };
  }
}

export async function getTaskByNumber(taskNumber: number) {
  await requireCoAdmin();
  
  try {
    const task = await prisma.task.findUnique({
      where: { taskNumber },
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
    console.error("Error fetching task:", error);
    return {
      status: "error" as const,
      message: "Failed to fetch task",
    };
  }
}

export async function updateTask(
  id: string,
  data: {
    taskNumber: number;
    title: string;
    description?: string;
    startDate: Date;
    dueDate: Date;
    points: number;
    targetBatchIds?: string[];
  }
) {
  await requireCoAdmin();
  
  try {
    // Check if task number already exists for a different task
    const existingTask = await prisma.task.findUnique({
      where: { taskNumber: data.taskNumber },
    });

    if (existingTask && existingTask.id !== id) {
      return {
        status: "error" as const,
        message: "Task number already exists",
      };
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        taskNumber: data.taskNumber,
        title: data.title,
        description: data.description || null,
        startDate: data.startDate,
        dueDate: data.dueDate,
        points: data.points,
        ...(data.targetBatchIds !== undefined ? { targetBatchIds: data.targetBatchIds } : {}),
      },
    });

    revalidatePath("/admin/tasks");
    revalidatePath("/admin/points");
    revalidatePath(`/admin/tasks/${data.taskNumber}`);

    return {
      status: "success" as const,
      message: "Task updated successfully",
      data: task,
    };
  } catch (error) {
    console.error("Error updating task:", error);
    return {
      status: "error" as const,
      message: "Failed to update task",
    };
  }
}

export async function deleteTask(id: string) {
  await requireAdmin();
  
  try {
    await prisma.task.delete({
      where: { id },
    });

    revalidatePath("/admin/tasks");
    revalidatePath("/admin/points");

    return {
      status: "success" as const,
      message: "Task deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting task:", error);
    return {
      status: "error" as const,
      message: "Failed to delete task",
    };
  }
}

export interface MemberForTask {
  id: string;
  name: string;
  username: string | null;
  registration: string | null;
  branch: string | null;
  admissionYear: string | null;
}

export async function getAllMembers() {
  await requireCoAdmin();
  
  try {
    const members = await prisma.user.findMany({
      where: {
        profileComplete: true,
        role: { not: "admin" },
      },
      select: {
        id: true,
        name: true,
        username: true,
        registration: true,
        branch: true,
        admissionYear: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      status: "success" as const,
      data: members,
    };
  } catch (error) {
    console.error("Error fetching members:", error);
    return {
      status: "error" as const,
      message: "Failed to fetch members",
    };
  }
}

export async function getMembersWithSubmissions(taskId: string) {
  await requireCoAdmin();
  
  try {
    // Get all submissions for this task
    const submissions = await prisma.taskSubmission.findMany({
      where: {
        taskId: taskId,
      },
      select: {
        userId: true,
      },
    });

    const userIds = submissions.map(sub => sub.userId);

    // Get member details for users who have submitted
    const members = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        profileComplete: true,
        role: { not: "admin" },
      },
      select: {
        id: true,
        name: true,
        username: true,
        registration: true,
        branch: true,
        admissionYear: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      status: "success" as const,
      data: members,
    };
  } catch (error) {
    console.error("Error fetching members with submissions:", error);
    return {
      status: "error" as const,
      message: "Failed to fetch members",
    };
  }
}

export async function getTaskSubmissions(taskId: string) {
  await requireCoAdmin();
  
  try {
    const submissions = await prisma.taskSubmission.findMany({
      where: { taskId },
    });

    const submissionMap: Record<string, {
      status: string;
      pointsAwarded: number;
      feedback: string | null;
      submittedAt: Date | null;
      evaluatedAt: Date | null;
      projectUrl: string | null;
      screenshotKey: string | null;
    }> = {};
    
    submissions.forEach((sub) => {
      submissionMap[sub.userId] = {
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
    console.error("Error fetching task submissions:", error);
    return {
      status: "error" as const,
      message: "Failed to fetch submissions",
    };
  }
}

export async function evaluateSubmission(
  taskId: string,
  userId: string,
  status: string,
  pointsAwarded: number,
  feedback: string | null,
  evaluatedBy: string
) {
  await requireCoAdmin();
  
  // Force points to 0 if status is rejected or pending
  const finalPoints = (status === "rejected" || status === "pending") ? 0 : pointsAwarded;
  
  try {
    const submission = await prisma.taskSubmission.upsert({
      where: {
        taskId_userId: {
          taskId,
          userId,
        },
      },
      update: {
        status,
        pointsAwarded: finalPoints,
        feedback,
        evaluatedBy,
        evaluatedAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        taskId,
        userId,
        status,
        pointsAwarded: finalPoints,
        feedback,
        evaluatedBy,
        evaluatedAt: new Date(),
      },
    });

    // Realtime broadcast via Socket.IO
    try {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { id: true, title: true, taskNumber: true },
      });
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, cbUserId: true },
      });

      if (task && user) {
        const realtimePayload = {
          type: "task-evaluated",
          taskId: task.id,
          taskTitle: task.title,
          taskNumber: task.taskNumber,
          userId: user.id,
          userName: user.name,
          cbUserId: user.cbUserId,
          points: finalPoints,
          status,
          timestamp: new Date().toISOString(),
          message: `Your submission for Task #${task.taskNumber} (${task.title}) has been ${status}${finalPoints > 0 ? ` (+${finalPoints} points)` : ""}!`,
        };

        await emitSocketEvent(`user-${userId}`, "task-evaluated", realtimePayload);
        await emitSocketEvent("leaderboard", "leaderboard-updated", realtimePayload);
      }
    } catch (broadcastErr) {
      console.warn("Could not broadcast task evaluation socket event:", broadcastErr);
    }

    revalidatePath(`/admin/tasks`);
    revalidatePath(`/admin/points`);
    revalidatePath("/leaderboard");
    revalidatePath("/dashboard");

    return {
      status: "success" as const,
      message: `Submission ${status}${finalPoints > 0 ? ` (+${finalPoints} points)` : ""}`,
      data: submission,
    };
  } catch (error) {
    console.error("Error evaluating submission:", error);
    return {
      status: "error" as const,
      message: "Failed to evaluate submission",
    };
  }
}
