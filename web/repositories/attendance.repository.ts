import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export class AttendanceRepository {
  /**
   * Find an attendance session by ID
   */
  static async findSessionById(sessionId: string) {
    return prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });
  }

  /**
   * Find an attendance session by session number
   */
  static async findSessionByNumber(sessionNumber: number) {
    return prisma.attendanceSession.findUnique({
      where: { sessionNumber },
    });
  }

  /**
   * List all attendance sessions ordered by session number or date
   */
  static async listSessions(limit: number = 100, offset: number = 0) {
    const [sessions, total] = await Promise.all([
      prisma.attendanceSession.findMany({
        orderBy: { sessionNumber: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.attendanceSession.count(),
    ]);
    return { sessions, total };
  }

  /**
   * Create a new attendance session
   */
  static async createSession(data: {
    sessionNumber: number;
    title: string;
    date: Date;
    day: string;
    targetBatchIds?: string[];
    createdBy: string;
  }) {
    return prisma.attendanceSession.create({
      data: {
        sessionNumber: data.sessionNumber,
        title: data.title,
        date: data.date,
        day: data.day,
        targetBatchIds: data.targetBatchIds || [],
        createdBy: data.createdBy,
      },
    });
  }

  /**
   * Get attendance record for a user in a session
   */
  static async findUserAttendance(sessionId: string, userId: string) {
    return prisma.attendance.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId,
        },
      },
    });
  }

  /**
   * Mark or update attendance record
   */
  static async markAttendance(params: {
    sessionId: string;
    userId: string;
    status: "present" | "absent" | "pending";
    points?: number;
    markedBy: string;
    method?: string;
  }) {
    return prisma.attendance.upsert({
      where: {
        sessionId_userId: {
          sessionId: params.sessionId,
          userId: params.userId,
        },
      },
      update: {
        status: params.status,
        points: params.points ?? 10,
        markedBy: params.markedBy,
        method: params.method || "manual",
        updatedAt: new Date(),
      },
      create: {
        sessionId: params.sessionId,
        userId: params.userId,
        status: params.status,
        points: params.points ?? 10,
        markedBy: params.markedBy,
        method: params.method || "manual",
      },
    });
  }

  /**
   * Get all attendance records for a session with user details
   */
  static async getSessionRecords(sessionId: string) {
    return prisma.attendance.findMany({
      where: { sessionId },
      include: {
        session: true,
      },
      orderBy: { markedAt: "desc" },
    });
  }

  /**
   * Get attendance history for a single user
   */
  static async getUserAttendanceHistory(userId: string) {
    return prisma.attendance.findMany({
      where: { userId },
      include: {
        session: true,
      },
      orderBy: { session: { sessionNumber: "desc" } },
    });
  }

  /**
   * Retrieve delegation code setting
   */
  static async getDelegationCodeSetting(code: string) {
    const setting = await prisma.systemSettings.findUnique({
      where: { key: `attendance-code-${code.trim().toUpperCase()}` },
    });
    return setting;
  }

  /**
   * Save delegation code setting
   */
  static async saveDelegationCodeSetting(code: string, data: object) {
    return prisma.systemSettings.upsert({
      where: { key: `attendance-code-${code.trim().toUpperCase()}` },
      update: {
        value: JSON.stringify(data),
        updatedAt: new Date(),
      },
      create: {
        key: `attendance-code-${code.trim().toUpperCase()}`,
        value: JSON.stringify(data),
        description: `Delegated attendance scanning code ${code.trim().toUpperCase()}`,
      },
    });
  }
}
