import "server-only";

import { prisma } from "@/lib/db";
import { requireCoAdmin } from "./require-co-admin";

export async function getDashboardStats() {
    await requireCoAdmin();
    
    try {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const monthStart = new Date(currentYear, currentMonth, 1);
        const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

        // Get user stats
        const [
            totalUsers,
            verifiedUsers,
            bannedUsers,
            newUsersThisMonth,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { emailVerified: true } }),
            prisma.user.count({ where: { banned: true } }),
            prisma.user.count({ 
                where: { 
                    createdAt: { gte: monthStart, lte: monthEnd }
                } 
            }),
        ]);

        // Get quizzes stats
        const [totalQuizzes, activeQuizzes, totalQuizAttempts] = await Promise.all([
            prisma.quiz.count(),
            prisma.quiz.count({ 
                where: { 
                    isActive: true,
                    OR: [
                        { endDateTime: null },
                        { endDateTime: { gte: currentDate } }
                    ]
                } 
            }),
            prisma.quizAttempt.count({ where: { completedAt: { not: null } } }),
        ]);

        // Get events and attendance stats
        const [totalEvents, upcomingEvents, totalAttendance] = await Promise.all([
            prisma.eventPoint.count(),
            prisma.eventPoint.count({ 
                where: { 
                    eventDate: { gte: currentDate }
                } 
            }),
            prisma.attendance.count({ where: { status: 'present' } }),
        ]);

        // Get tasks stats
        const [totalTasks, pendingTasks, approvedSubmissions] = await Promise.all([
            prisma.task.count(),
            prisma.task.count({ 
                where: { 
                    dueDate: { gte: currentDate }
                } 
            }),
            prisma.taskSubmission.count({ 
                where: { 
                    status: 'approved',
                    evaluatedAt: { gte: monthStart, lte: monthEnd }
                } 
            }),
        ]);

        // Calculate total points distributed
        const [attendancePoints, taskPoints, eventPoints, quizPoints] = await Promise.all([
            prisma.attendance.aggregate({
                _sum: { points: true },
                where: { status: 'present' }
            }),
            prisma.taskSubmission.aggregate({
                _sum: { pointsAwarded: true },
                where: { status: 'approved' }
            }),
            prisma.eventParticipation.aggregate({
                _sum: { pointsAwarded: true },
                where: { status: 'approved' }
            }),
            prisma.quizAttempt.aggregate({
                _sum: { pointsEarned: true },
                where: { completedAt: { not: null } }
            }),
        ]);

        const totalPointsDistributed = 
            (attendancePoints._sum.points || 0) +
            (taskPoints._sum.pointsAwarded || 0) +
            (eventPoints._sum.pointsAwarded || 0) +
            (quizPoints._sum.pointsEarned || 0);

        // Get Roadmap, Form, Batch, and Session stats in parallel
        const [
            totalRoadmaps,
            publishedRoadmaps,
            totalBatches,
            totalForms,
            activeForms,
            totalFormResponses,
            totalSessions,
        ] = await Promise.all([
            prisma.roadmap.count(),
            prisma.roadmap.count({ where: { isPublished: true } }),
            prisma.batch.count(),
            prisma.form.count(),
            prisma.form.count({ where: { isPublished: true, acceptingResponses: true } }),
            prisma.formResponse.count(),
            prisma.attendanceSession.count(),
        ]);

        // Get recent activities
        const recentUsers = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            take: 6,
            select: {
                id: true,
                name: true,
                email: true,
                username: true,
                createdAt: true,
                emailVerified: true,
                role: true,
                branch: true,
                batch: { select: { name: true, code: true } }
            }
        });

        // Calculate top performers leaderboard
        const [nonAdminUsers, batches] = await Promise.all([
            prisma.user.findMany({
                where: {
                    role: { not: "admin" },
                },
                select: {
                    id: true,
                    name: true,
                    username: true,
                    email: true,
                    branch: true,
                    batchId: true,
                    batch: { select: { id: true, name: true, code: true } },
                },
            }),
            prisma.batch.findMany({
                select: { id: true, name: true, code: true },
                orderBy: { name: "asc" },
            }),
        ]);

        const nonAdminUserIds = nonAdminUsers.map((u) => u.id);

        const [userAttendance, userTasks, userEvents, userQuizzes] = await Promise.all([
            prisma.attendance.groupBy({
                by: ["userId"],
                _sum: { points: true },
                where: { status: "present", userId: { in: nonAdminUserIds } },
            }),
            prisma.taskSubmission.groupBy({
                by: ["userId"],
                _sum: { pointsAwarded: true },
                where: { status: "approved", userId: { in: nonAdminUserIds } },
            }),
            prisma.eventParticipation.groupBy({
                by: ["userId"],
                _sum: { pointsAwarded: true },
                where: { status: "approved", userId: { in: nonAdminUserIds } },
            }),
            prisma.quizAttempt.findMany({
                where: { userId: { in: nonAdminUserIds } },
                select: { userId: true, pointsEarned: true, answersJson: true },
            }),
        ]);

        const attendanceMap = new Map(userAttendance.map((a) => [a.userId, a._sum.points || 0]));
        const taskMap = new Map(userTasks.map((t) => [t.userId, t._sum.pointsAwarded || 0]));
        const eventMap = new Map(userEvents.map((e) => [e.userId, e._sum.pointsAwarded || 0]));
        const quizMap = new Map<string, number>();

        for (const attempt of userQuizzes) {
            let isApproved = false;
            if (attempt.answersJson) {
                try {
                    const parsed = JSON.parse(attempt.answersJson);
                    isApproved = parsed.approvalStatus === "approved";
                } catch {
                    // ignore parse error
                }
            }
            if (isApproved) {
                quizMap.set(attempt.userId, (quizMap.get(attempt.userId) || 0) + attempt.pointsEarned);
            }
        }

        const topPerformers = nonAdminUsers
            .map((u) => {
                const aPoints = attendanceMap.get(u.id) || 0;
                const tPoints = taskMap.get(u.id) || 0;
                const ePoints = eventMap.get(u.id) || 0;
                const qPoints = quizMap.get(u.id) || 0;
                const totalPoints = aPoints + tPoints + ePoints + qPoints;

                return {
                    id: u.id,
                    name: u.name,
                    username: u.username,
                    email: u.email,
                    branch: u.branch,
                    batchId: u.batchId,
                    batch: u.batch,
                    points: totalPoints,
                    attendancePoints: aPoints,
                    taskPoints: tPoints,
                    eventPoints: ePoints,
                    quizPoints: qPoints,
                };
            })
            .sort((a, b) => b.points - a.points);

        return {
            // User stats
            totalUsers,
            verifiedUsers,
            bannedUsers,
            newUsersThisMonth,
            
            // Roadmaps & Curriculums
            totalRoadmaps,
            publishedRoadmaps,

            // Batches
            totalBatches,
            batches,

            // Forms & Applications
            totalForms,
            activeForms,
            totalFormResponses,

            // Quizzes
            totalQuizzes,
            activeQuizzes,
            totalQuizAttempts,
            
            // Events & Attendance
            totalEvents,
            upcomingEvents,
            totalAttendance,
            totalSessions,
            
            // Tasks
            totalTasks,
            pendingTasks,
            approvedSubmissions,
            
            // Points
            totalPointsDistributed,
            
            // Recent activities
            recentUsers,

            // Top Performers Leaderboard
            topPerformers,
        };
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        throw new Error('Failed to fetch dashboard stats');
    }
}