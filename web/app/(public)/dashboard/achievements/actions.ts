"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function getUserAchievements(userId: string) {
  try {
    // Get attendance points
    const attendanceData = await prisma.attendance.findMany({
      where: {
        userId,
        status: 'present',
      },
      include: {
        session: {
          select: {
            title: true,
            date: true,
            day: true,
          },
        },
      },
      orderBy: {
        markedAt: 'desc',
      },
    });

    // Get task submissions
    const taskData = await prisma.taskSubmission.findMany({
      where: {
        userId,
        status: 'approved',
      },
      include: {
        task: {
          select: {
            title: true,
            description: true,
            dueDate: true,
          },
        },
      },
      orderBy: {
        evaluatedAt: 'desc',
      },
    });

    // Get event participations
    const eventData = await prisma.eventParticipation.findMany({
      where: {
        userId,
        status: 'approved',
      },
      include: {
        event: {
          select: {
            title: true,
            description: true,
            eventDate: true,
          },
        },
      },
      orderBy: {
        evaluatedAt: 'desc',
      },
    });

    // Get quiz attempts
    const quizData = await prisma.quizAttempt.findMany({
      where: {
        userId,
        completedAt: { not: null },
      },
      include: {
        quiz: {
          select: {
            title: true,
            quizId: true,
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    // Calculate totals
    const totalAttendancePoints = attendanceData.reduce((sum, a) => sum + a.points, 0);
    const totalTaskPoints = taskData.reduce((sum, t) => sum + t.pointsAwarded, 0);
    const totalEventPoints = eventData.reduce((sum, e) => sum + e.pointsAwarded, 0);
    const totalQuizPoints = quizData.reduce((sum, q) => sum + q.pointsEarned, 0);
    const totalPoints = totalAttendancePoints + totalTaskPoints + totalEventPoints + totalQuizPoints;

    return {
      status: "success" as const,
      data: {
        attendance: {
          items: attendanceData,
          totalPoints: totalAttendancePoints,
          count: attendanceData.length,
        },
        tasks: {
          items: taskData,
          totalPoints: totalTaskPoints,
          count: taskData.length,
        },
        events: {
          items: eventData,
          totalPoints: totalEventPoints,
          count: eventData.length,
        },
        quizzes: {
          items: quizData,
          totalPoints: totalQuizPoints,
          count: quizData.length,
        },
        summary: {
          totalPoints,
          totalActivities: attendanceData.length + taskData.length + eventData.length + quizData.length,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching user achievements:", error);
    return {
      status: "error" as const,
      message: "Failed to fetch achievements",
    };
  }
}
