import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import arcjet, { slidingWindow } from "@/lib/arcjet";

/**
 * External API endpoint for fetching member information
 * This endpoint can be used by other projects to fetch member data
 * 
 * Authentication: Requires API_KEY in Authorization header
 * Usage: Authorization: Bearer YOUR_API_KEY
 * 
 * Rate Limit: 100 requests per hour per IP
 * 
 * Query Parameters:
 * - limit: Number of members to fetch (default: 100, max: 1000)
 * - offset: Number of members to skip for pagination (default: 0)
 * - includePoints: Include points breakdown (default: false)
 * - branch: Filter by branch
 * - admissionYear: Filter by admission year
 * - profileComplete: Filter by profile completion status
 */

export async function GET(request: NextRequest) {
  try {
    // API Key Authentication
    const authHeader = request.headers.get("authorization");
    const apiKey = authHeader?.replace("Bearer ", "");

    if (!env.API_KEY || !apiKey || apiKey !== env.API_KEY) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid or missing API key" },
        { status: 401 }
      );
    }

    // Apply rate limiting - 100 requests per hour
    const aj = arcjet.withRule(
      slidingWindow({
        mode: "LIVE",
        interval: "1h",
        max: 100,
      })
    );

    const decision = await aj.protect(request, {
      fingerprint: apiKey,
    });

    if (decision.isDenied()) {
      return NextResponse.json(
        {
          error: "Too Many Requests",
          message: "Rate limit exceeded. Please try again later.",
        },
        { status: 429 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "100"),
      1000
    );
    const offset = parseInt(searchParams.get("offset") || "0");
    const includePoints = searchParams.get("includePoints") === "true";
    const branch = searchParams.get("branch");
    const admissionYear = searchParams.get("admissionYear");
    const profileComplete = searchParams.get("profileComplete");

    // Build where clause
    const where: any = {
      banned: { not: true },
    };

    if (branch) {
      where.branch = branch;
    }

    if (admissionYear) {
      where.admissionYear = admissionYear;
    }

    if (profileComplete !== null && profileComplete !== undefined) {
      where.profileComplete = profileComplete === "true";
    }

    // Fetch members
    const members = await prisma.user.findMany({
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
        
        // Academic details
        registration: true,
        rollNumber: true,
        branch: true,
        admissionYear: true,
        
        // Location
        state: true,
        district: true,
        collegeName: true,
        
        // Social
        githubUsername: true,
        
        // Status
        profileComplete: true,
        role: true,
        
        // Timestamps
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: offset,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await prisma.user.count({ where });

    // If points data is requested, fetch and attach it
    if (includePoints && members.length > 0) {
      const userIds = members.map((m) => m.id);

      // Get attendance points
      const attendanceData = await prisma.attendance.groupBy({
        by: ["userId"],
        _sum: {
          points: true,
        },
        _count: {
          _all: true,
        },
        where: {
          status: "present",
          userId: { in: userIds },
        },
      });

      // Get task points
      const taskData = await prisma.taskSubmission.groupBy({
        by: ["userId"],
        _sum: {
          pointsAwarded: true,
        },
        _count: {
          _all: true,
        },
        where: {
          status: "approved",
          userId: { in: userIds },
        },
      });

      // Get event points
      const eventData = await prisma.eventParticipation.groupBy({
        by: ["userId"],
        _sum: {
          pointsAwarded: true,
        },
        _count: {
          _all: true,
        },
        where: {
          status: "approved",
          userId: { in: userIds },
        },
      });

      // Get quiz points
      const quizAttempts = await prisma.quizAttempt.findMany({
        where: {
          userId: { in: userIds },
        },
        select: {
          userId: true,
          pointsEarned: true,
          answersJson: true,
        },
      });

      // Filter approved quiz attempts and aggregate
      const quizDataMap = new Map<string, { points: number; count: number }>();
      quizAttempts.forEach((attempt) => {
        if (!attempt.answersJson) return;
        try {
          const answers = JSON.parse(attempt.answersJson);
          const isApproved = answers?.approved === true;
          if (isApproved) {
            const current = quizDataMap.get(attempt.userId) || {
              points: 0,
              count: 0,
            };
            quizDataMap.set(attempt.userId, {
              points: current.points + (attempt.pointsEarned || 0),
              count: current.count + 1,
            });
          }
        } catch (e) {
          // Skip invalid JSON
        }
      });

      // Create lookup maps
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

      // Attach points to members
      const membersWithPoints = members.map((member) => {
        const attendance = attendanceMap.get(member.id) || {
          points: 0,
          count: 0,
        };
        const task = taskMap.get(member.id) || { points: 0, count: 0 };
        const event = eventMap.get(member.id) || { points: 0, count: 0 };
        const quiz = quizDataMap.get(member.id) || { points: 0, count: 0 };

        const totalPoints =
          attendance.points + task.points + event.points + quiz.points;

        return {
          ...member,
          points: {
            total: totalPoints,
            attendance: attendance.points,
            tasks: task.points,
            events: event.points,
            quizzes: quiz.points,
          },
          activity: {
            sessionsAttended: attendance.count,
            tasksCompleted: task.count,
            eventsParticipated: event.count,
            quizzesTaken: quiz.count,
          },
        };
      });

      return NextResponse.json({
        success: true,
        data: membersWithPoints,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Return without points data
    return NextResponse.json({
      success: true,
      data: members,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Members API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
