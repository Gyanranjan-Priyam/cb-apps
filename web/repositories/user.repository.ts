import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export class UserRepository {
  /**
   * Find a user by their primary ID
   */
  static async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        batch: true,
      },
    });
  }

  /**
   * Find a user by email
   */
  static async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: {
        batch: true,
      },
    });
  }

  /**
   * Find a user by username
   */
  static async findByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username: username.trim().toLowerCase() },
      include: {
        batch: true,
      },
    });
  }

  /**
   * Find a user by cbUserId (e.g. CB-2024-001)
   */
  static async findByCbUserId(cbUserId: string) {
    return prisma.user.findUnique({
      where: { cbUserId: cbUserId.trim().toUpperCase() },
      include: {
        batch: true,
      },
    });
  }

  /**
   * Update user details
   */
  static async update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
      include: {
        batch: true,
      },
    });
  }

  /**
   * Search users by name, email, roll number, or username
   */
  static async searchUsers(query: string, limit: number = 20) {
    const trimmed = query.trim();
    return prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: trimmed, mode: "insensitive" } },
          { email: { contains: trimmed, mode: "insensitive" } },
          { username: { contains: trimmed, mode: "insensitive" } },
          { rollNumber: { contains: trimmed, mode: "insensitive" } },
          { cbUserId: { contains: trimmed, mode: "insensitive" } },
        ],
      },
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        cbUserId: true,
        registration: true,
        rollNumber: true,
        branch: true,
        admissionYear: true,
        profileImageKey: true,
        image: true,
        role: true,
        batch: true,
      },
    });
  }

  /**
   * Query members with filtering, pagination, and sorting
   */
  static async findMembers(params: {
    branch?: string | null;
    admissionYear?: string | null;
    profileComplete?: boolean | null;
    batchId?: string | null;
    limit?: number;
    offset?: number;
  }) {
    const limit = Math.min(params.limit || 100, 1000);
    const offset = params.offset || 0;

    const where: Prisma.UserWhereInput = {
      banned: { not: true },
    };

    if (params.branch) where.branch = params.branch;
    if (params.admissionYear) where.admissionYear = params.admissionYear;
    if (params.profileComplete !== null && params.profileComplete !== undefined) {
      where.profileComplete = params.profileComplete;
    }
    if (params.batchId) where.batchId = params.batchId;

    const [members, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          firstName: true,
          middleName: true,
          lastName: true,
          mobileNumber: true,
          whatsappNumber: true,
          profileImageKey: true,
          image: true,
          registration: true,
          rollNumber: true,
          branch: true,
          admissionYear: true,
          state: true,
          district: true,
          collegeName: true,
          githubUsername: true,
          profileComplete: true,
          role: true,
          batchId: true,
          specializedDomain: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: offset,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { members, totalCount, limit, offset };
  }

  /**
   * Fetch aggregated points (Attendance, Tasks, Events, Quizzes) for a set of users
   */
  static async getMembersPointsData(userIds: string[]) {
    if (userIds.length === 0) return new Map();

    const [attendanceData, taskData, eventData, quizAttempts] = await Promise.all([
      prisma.attendance.groupBy({
        by: ["userId"],
        _sum: { points: true },
        _count: { _all: true },
        where: { status: "present", userId: { in: userIds } },
      }),
      prisma.taskSubmission.groupBy({
        by: ["userId"],
        _sum: { pointsAwarded: true },
        _count: { _all: true },
        where: { status: "approved", userId: { in: userIds } },
      }),
      prisma.eventParticipation.groupBy({
        by: ["userId"],
        _sum: { pointsAwarded: true },
        _count: { _all: true },
        where: { status: "approved", userId: { in: userIds } },
      }),
      prisma.quizAttempt.findMany({
        where: { userId: { in: userIds } },
        select: { userId: true, pointsEarned: true, answersJson: true },
      }),
    ]);

    const quizMap = new Map<string, { points: number; count: number }>();
    quizAttempts.forEach((attempt) => {
      if (!attempt.answersJson) return;
      try {
        const answers = JSON.parse(attempt.answersJson);
        if (answers?.approved === true) {
          const curr = quizMap.get(attempt.userId) || { points: 0, count: 0 };
          quizMap.set(attempt.userId, {
            points: curr.points + (attempt.pointsEarned || 0),
            count: curr.count + 1,
          });
        }
      } catch {
        // Ignore invalid json
      }
    });

    const attendanceMap = new Map(
      attendanceData.map((a) => [
        a.userId,
        { points: a._sum.points || 0, count: a._count._all },
      ])
    );
    const taskMap = new Map(
      taskData.map((t) => [
        t.userId,
        { points: t._sum.pointsAwarded || 0, count: t._count._all },
      ])
    );
    const eventMap = new Map(
      eventData.map((e) => [
        e.userId,
        { points: e._sum.pointsAwarded || 0, count: e._count._all },
      ])
    );

    const resultMap = new Map<
      string,
      {
        points: {
          total: number;
          attendance: number;
          tasks: number;
          events: number;
          quizzes: number;
        };
        activity: {
          sessionsAttended: number;
          tasksCompleted: number;
          eventsParticipated: number;
          quizzesTaken: number;
        };
      }
    >();

    userIds.forEach((id) => {
      const att = attendanceMap.get(id) || { points: 0, count: 0 };
      const tsk = taskMap.get(id) || { points: 0, count: 0 };
      const evt = eventMap.get(id) || { points: 0, count: 0 };
      const qz = quizMap.get(id) || { points: 0, count: 0 };

      resultMap.set(id, {
        points: {
          total: att.points + tsk.points + evt.points + qz.points,
          attendance: att.points,
          tasks: tsk.points,
          events: evt.points,
          quizzes: qz.points,
        },
        activity: {
          sessionsAttended: att.count,
          tasksCompleted: tsk.count,
          eventsParticipated: evt.count,
          quizzesTaken: qz.count,
        },
      });
    });

    return resultMap;
  }
}
