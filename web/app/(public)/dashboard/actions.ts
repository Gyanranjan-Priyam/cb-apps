"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { serializeSpecializedDomains } from "@/lib/specialized-domains";

export interface DashboardStats {
  totalPoints: number;
  pendingTasks: number;
  activeQuizzes: number;
  upcomingEvents: number;
}

export interface RecentActivity {
  id: string;
  type: 'task' | 'event' | 'quiz';
  title: string;
  description: string;
  date: Date;
  status?: string;
  points?: number;
}

export async function getUserDashboardData() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return {
        status: "error" as const,
        message: "Authentication required",
      };
    }

    const userId = session.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { batchId: true, role: true },
    });
    const userBatchId = user?.batchId || null;

    // Parallel data fetching for performance
    const [
      allAttendances,
      taskSubmissions,
      eventParticipations,
      quizAttempts,
      pendingTasksCount,
      activeQuizzesCount,
      upcomingEventsCount,
      userRoadmapProgress,
    ] = await Promise.all([
      // 1. Attendance Records
      prisma.attendance.findMany({
        where: { userId, status: 'present' },
        select: { points: true, markedAt: true },
      }),
      // 2. Task Submissions
      prisma.taskSubmission.findMany({
        where: { userId },
        include: { task: true },
        orderBy: { updatedAt: 'desc' },
      }),
      // 3. Event Participations
      prisma.eventParticipation.findMany({
        where: { userId },
        include: { event: true },
        orderBy: { updatedAt: 'desc' },
      }),
      // 4. Quiz Attempts
      prisma.quizAttempt.findMany({
        where: { userId },
        include: { quiz: true },
        orderBy: { updatedAt: 'desc' },
      }),
      // 5. Pending Tasks Count
      prisma.task.count({
        where: {
          dueDate: { gte: new Date() },
          submissions: { none: { userId } }
        }
      }),
      // 6. Active Quizzes Count (Internal only & Batch-scoped)
      prisma.quiz.count({
        where: {
          isActive: true,
          targetAudience: "INTERNAL",
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
          OR: [
            { endDateTime: null },
            { endDateTime: { gte: new Date() } }
          ],
          attempts: { none: { userId } }
        }
      }),
      // 7. Upcoming Events Count
      prisma.eventPoint.count({
        where: {
          eventDate: { gte: new Date() }
        }
      }),
      // 8. User Roadmaps Progress
      prisma.userRoadmapProgress.findMany({
        where: { userId },
        include: {
          roadmap: {
            select: {
              title: true,
              slug: true,
              category: true,
              badgeText: true,
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 3
      }),
    ]);

    const aPts = allAttendances.reduce((acc, curr) => acc + (curr.points || 0), 0);
    const tPts = taskSubmissions.reduce((acc, curr) => acc + (curr.pointsAwarded || 0), 0);
    const ePts = eventParticipations.reduce((acc, curr) => acc + (curr.pointsAwarded || 0), 0);
    const qPts = quizAttempts.reduce((acc, curr) => acc + (curr.pointsEarned || 0), 0);

    // Calculate Total Points
    const totalPoints = aPts + tPts + ePts + qPts;

    // Calculate Monthly Progress Breakdown for the past 6 months
    const now = new Date();
    const monthlyProgress: Array<{
      month: string;
      total: number;
      attendance: number;
      tasks: number;
      quizzes: number;
      events: number;
    }> = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthName = d.toLocaleString("default", { month: "short" });

      const att = allAttendances
        .filter((a) => a.markedAt >= mStart && a.markedAt <= mEnd)
        .reduce((sum, a) => sum + (a.points || 0), 0);

      const tsk = taskSubmissions
        .filter((t) => t.status === "approved" && t.updatedAt >= mStart && t.updatedAt <= mEnd)
        .reduce((sum, t) => sum + (t.pointsAwarded || 0), 0);

      const qz = quizAttempts
        .filter((q) => q.updatedAt >= mStart && q.updatedAt <= mEnd)
        .reduce((sum, q) => sum + (q.pointsEarned || 0), 0);

      const evt = eventParticipations
        .filter((e) => e.status === "approved" && e.updatedAt >= mStart && e.updatedAt <= mEnd)
        .reduce((sum, e) => sum + (e.pointsAwarded || 0), 0);

      monthlyProgress.push({
        month: monthName,
        total: att + tsk + qz + evt,
        attendance: att,
        tasks: tsk,
        quizzes: qz,
        events: evt,
      });
    }

    // Aggregate Recent Activities
    const activities: RecentActivity[] = [
      ...taskSubmissions.map(t => ({
        id: `task-${t.id}`,
        type: 'task' as const,
        title: `Task: ${t.task.title}`,
        description: `Status: ${t.status}`,
        date: t.updatedAt,
        status: t.status,
        points: t.pointsAwarded
      })),
      ...eventParticipations.map(e => ({
        id: `event-${e.id}`,
        type: 'event' as const,
        title: `Event: ${e.event.title}`,
        description: `Status: ${e.status}`,
        date: e.updatedAt,
        status: e.status,
        points: e.pointsAwarded
      })),
      ...quizAttempts.map(q => ({
        id: `quiz-${q.id}`,
        type: 'quiz' as const,
        title: `Quiz: ${q.quiz.title}`,
        description: `Score: ${q.score}/${q.totalQuestions}`,
        date: q.updatedAt,
        points: q.pointsEarned
      })),
    ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10);

    const stats = {
      totalPoints,
      attendancePoints: aPts,
      taskPoints: tPts,
      eventPoints: ePts,
      quizPoints: qPts,
      pendingTasks: pendingTasksCount,
      activeQuizzes: activeQuizzesCount,
      upcomingEvents: upcomingEventsCount,
      activeRoadmapsCount: userRoadmapProgress.length,
      monthlyProgress,
    };

    // Fetch complete user profile for profile completion calculation
    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        profileImageKey: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        mobileNumber: true,
        whatsappNumber: true,
        aadhaarNumber: true,
        upiId: true,
        state: true,
        district: true,
        collegeName: true,
        collegeAddress: true,
        username: true,
        cbUserId: true,
        firstName: true,
        middleName: true,
        lastName: true,
        registration: true,
        rollNumber: true,
        branch: true,
        admissionYear: true,
        address: true,
        postOffice: true,
        policeStation: true,
        block: true,
        pinCode: true,
        githubUsername: true,
        specializedDomain: true,
        role: true,
        socialLinks: true,
        customLinks: true,
        profileComplete: true,
        hasCompletedOnboarding: true,
        hasLoggedIn: true,
        lastLoginAt: true,
        loginCount: true,
        batch: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        }
      }
    });

    return {
      status: "success" as const,
      data: {
        stats,
        recentActivities: activities,
        roadmaps: userRoadmapProgress,
        user: userProfile || {
          id: session.user.id,
          name: session.user.name || "",
          email: session.user.email || "",
          image: session.user.image || null,
          profileImageKey: null,
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          mobileNumber: null,
          whatsappNumber: null,
          aadhaarNumber: null,
          upiId: null,
          state: null,
          district: null,
          collegeName: null,
          collegeAddress: null,
          username: null,
          cbUserId: null,
          firstName: null,
          middleName: null,
          lastName: null,
          registration: null,
          rollNumber: null,
          branch: null,
          admissionYear: null,
          address: null,
          postOffice: null,
          policeStation: null,
          block: null,
          pinCode: null,
          githubUsername: null,
          specializedDomain: null,
          role: null,
          socialLinks: null,
          customLinks: null,
          profileComplete: false,
          hasCompletedOnboarding: false,
          hasLoggedIn: true,
          lastLoginAt: null,
          loginCount: 0,
          batch: null,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return {
      status: "error" as const,
      message: "Failed to fetch dashboard data",
    };
  }
}

export async function completeUserOnboarding() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return {
        status: "error" as const,
        message: "Unauthorized. Please log in first.",
      };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        hasCompletedOnboarding: true,
        hasLoggedIn: true,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/dashboard");
    return {
      status: "success" as const,
      message: "Onboarding completed successfully",
    };
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return {
      status: "error" as const,
      message: "Failed to update onboarding status.",
    };
  }
}

export async function saveUserSpecializedDomain(domains: string[]) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return {
        status: "error" as const,
        message: "Unauthorized. Please log in first.",
      };
    }

    const serialized = serializeSpecializedDomains(domains);

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        specializedDomain: serialized,
        hasCompletedOnboarding: true,
        hasLoggedIn: true,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        specializedDomain: true,
        profileComplete: true,
        hasCompletedOnboarding: true,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    revalidatePath("/admin/members");

    return {
      status: "success" as const,
      data: updatedUser,
    };
  } catch (error) {
    console.error("Error saving user specialized domain:", error);
    return {
      status: "error" as const,
      message: "Failed to save domain preferences. Please try again.",
    };
  }
}