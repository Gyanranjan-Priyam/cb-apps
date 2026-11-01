"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { revalidatePath } from "next/cache";
import { emitSocketEvent, emitSocketEventToRooms } from "@/lib/socket-server";

export interface AttendanceSessionData {
  id: string;
  sessionNumber: number;
  title: string;
  date: Date;
  day: string;
  targetBatchIds?: string[];
  createdAt: Date;
}

export interface MemberForAttendance {
  id: string;
  name: string;
  email: string;
  cbUserId: string | null;
  username: string | null;
  registration: string | null;
  rollNumber: string | null;
  branch: string | null;
  admissionYear: string | null;
  batchId?: string | null;
  batch?: { id: string; name: string; code: string } | null;
  mobileNumber: string | null;
  role: string | null;
}

export async function getAllMembers(targetBatchIds?: string[]) {
  await requireAdmin();
  
  try {
    const whereClause =
      targetBatchIds && targetBatchIds.length > 0
        ? { batchId: { in: targetBatchIds } }
        : {};

    const members = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        cbUserId: true,
        username: true,
        registration: true,
        rollNumber: true,
        branch: true,
        admissionYear: true,
        batchId: true,
        batch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        mobileNumber: true,
        role: true,
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

export async function getAllAttendanceSessions() {
  await requireAdmin();
  
  try {
    const sessions = await prisma.attendanceSession.findMany({
      orderBy: {
        sessionNumber: 'desc',
      },
    });

    return {
      status: "success" as const,
      data: sessions,
    };
  } catch (error) {
    console.error("Error fetching attendance sessions:", error);
    return {
      status: "error" as const,
      message: "Failed to fetch attendance sessions",
    };
  }
}

export async function createAttendanceSession(data: {
  sessionNumber?: number;
  title: string;
  date: Date;
  day: string;
  targetBatchIds?: string[];
  createdBy: string;
}) {
  await requireAdmin();
  
  try {
    let finalSessionNumber = data.sessionNumber;

    if (!finalSessionNumber || finalSessionNumber <= 0) {
      const latest = await prisma.attendanceSession.findFirst({
        orderBy: { sessionNumber: "desc" },
        select: { sessionNumber: true },
      });
      finalSessionNumber = (latest?.sessionNumber || 0) + 1;
    } else {
      // Check if session number already exists
      const existingSession = await prisma.attendanceSession.findUnique({
        where: { sessionNumber: finalSessionNumber },
      });

      if (existingSession) {
        return {
          status: "error" as const,
          message: `Session #${finalSessionNumber} already exists`,
        };
      }
    }

    const session = await prisma.attendanceSession.create({
      data: {
        sessionNumber: finalSessionNumber,
        title: data.title,
        date: data.date,
        day: data.day,
        targetBatchIds: data.targetBatchIds || [],
        createdBy: data.createdBy,
      },
    });

    revalidatePath("/admin/points");

    return {
      status: "success" as const,
      message: "Attendance session created successfully",
      data: session,
    };
  } catch (error) {
    console.error("Error creating attendance session:", error);
    return {
      status: "error" as const,
      message: "Failed to create attendance session",
    };
  }
}

export async function getAttendanceSessionById(id: string) {
  await requireAdmin();
  
  try {
    const session = await prisma.attendanceSession.findUnique({
      where: { id },
    });

    if (!session) {
      return {
        status: "error" as const,
        message: "Session not found",
      };
    }

    return {
      status: "success" as const,
      data: session,
    };
  } catch (error) {
    console.error("Error fetching attendance session:", error);
    return {
      status: "error" as const,
      message: "Failed to fetch attendance session",
    };
  }
}

export async function getAttendanceSessionByNumber(sessionNumber: number) {
  await requireAdmin();
  
  try {
    const session = await prisma.attendanceSession.findUnique({
      where: { sessionNumber },
    });

    if (!session) {
      return {
        status: "error" as const,
        message: "Session not found",
      };
    }

    return {
      status: "success" as const,
      data: session,
    };
  } catch (error) {
    console.error("Error fetching attendance session:", error);
    return {
      status: "error" as const,
      message: "Failed to fetch attendance session",
    };
  }
}

export async function updateAttendanceSession(
  id: string,
  data: {
    sessionNumber: number;
    title: string;
    date: Date;
    day: string;
    targetBatchIds?: string[];
  }
) {
  await requireAdmin();
  
  try {
    // Check if session number already exists for a different session
    const existingSession = await prisma.attendanceSession.findUnique({
      where: { sessionNumber: data.sessionNumber },
    });

    if (existingSession && existingSession.id !== id) {
      return {
        status: "error" as const,
        message: "Session number already exists",
      };
    }

    const session = await prisma.attendanceSession.update({
      where: { id },
      data: {
        sessionNumber: data.sessionNumber,
        title: data.title,
        date: data.date,
        day: data.day,
        ...(data.targetBatchIds !== undefined ? { targetBatchIds: data.targetBatchIds } : {}),
      },
    });

    revalidatePath("/admin/points");
    revalidatePath(`/admin/points/${data.sessionNumber}`);

    return {
      status: "success" as const,
      message: "Attendance session updated successfully",
      data: session,
    };
  } catch (error) {
    console.error("Error updating attendance session:", error);
    return {
      status: "error" as const,
      message: "Failed to update attendance session",
    };
  }
}

export async function markAttendance(
  sessionId: string,
  userId: string,
  status: string,
  markedBy: string
) {
  await requireAdmin();
  
  try {
    // Calculate points based on status
    let points = 0;
    if (status === "present") {
      points = 10;
    } else if (status === "absent") {
      points = 0;
    }
    // pending stays 0

    const attendance = await prisma.attendance.upsert({
      where: {
        sessionId_userId: {
          sessionId,
          userId,
        },
      },
      update: {
        status,
        points,
        markedBy,
        updatedAt: new Date(),
      },
      create: {
        sessionId,
        userId,
        status,
        points,
        markedBy,
      },
    });

    // Realtime broadcast via Socket.IO
    try {
      const session = await prisma.attendanceSession.findUnique({
        where: { id: sessionId },
        select: { id: true, title: true, sessionNumber: true },
      });
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, cbUserId: true },
      });

      if (session && user) {
        const realtimePayload = {
          type: "attendance-marked",
          sessionId: session.id,
          sessionTitle: session.title,
          sessionNumber: session.sessionNumber,
          userId: user.id,
          userName: user.name,
          cbUserId: user.cbUserId,
          points,
          status,
          timestamp: new Date().toISOString(),
          message: `Your attendance for "${session.title}" (Session #${session.sessionNumber}) has been marked as ${status}${points > 0 ? ` (+${points} points)` : ""}!`,
        };

        const userRooms = Array.from(
          new Set([
            `user-${userId}`,
            `user:${userId}`,
            ...(user.cbUserId ? [`user-${user.cbUserId}`, `user:${user.cbUserId}`] : []),
          ])
        );

        await emitSocketEventToRooms(userRooms, "attendance-marked", realtimePayload);
        await emitSocketEvent(`attendance-session-${sessionId}`, "attendance-updated", realtimePayload);
        await emitSocketEvent("leaderboard", "leaderboard-updated", realtimePayload);
      }
    } catch (broadcastErr) {
      console.warn("Could not broadcast attendance socket event:", broadcastErr);
    }

    revalidatePath(`/admin/points`);
    revalidatePath("/leaderboard");
    revalidatePath("/dashboard");

    return {
      status: "success" as const,
      message: `Attendance marked as ${status}${points > 0 ? ` (+${points} points)` : ""}`,
      data: attendance,
    };
  } catch (error) {
    console.error("Error marking attendance:", error);
    return {
      status: "error" as const,
      message: "Failed to mark attendance",
    };
  }
}

export async function getSessionAttendance(sessionId: string) {
  await requireAdmin();
  
  try {
    const attendances = await prisma.attendance.findMany({
      where: { sessionId },
    });

    const attendanceMap: Record<string, string> = {};
    attendances.forEach((att) => {
      attendanceMap[att.userId] = att.status;
    });

    return {
      status: "success" as const,
      data: attendanceMap,
    };
  } catch (error) {
    console.error("Error fetching session attendance:", error);
    return {
      status: "error" as const,
      message: "Failed to fetch attendance",
    };
  }
}

export async function deleteAttendanceSession(id: string) {
  await requireAdmin();
  
  try {
    await prisma.attendanceSession.delete({
      where: { id },
    });

    revalidatePath("/admin/points");

    return {
      status: "success" as const,
      message: "Attendance session deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting attendance session:", error);
    return {
      status: "error" as const,
      message: "Failed to delete attendance session",
    };
  }
}
