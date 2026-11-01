import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { hasAdminOrCoAdminAccess } from "@/lib/member-roles";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || !hasAdminOrCoAdminAccess(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized. Admin or Co-Admin access required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Get attendance records with user details
    const attendances = await prisma.attendance.findMany({
      where: {
        sessionId,
      },
      include: {
        session: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        markedAt: "desc",
      },
    });

    // Fetch user details for each attendance
    const attendancesWithUsers = await Promise.all(
      attendances.map(async (attendance) => {
        const user = await prisma.user.findUnique({
          where: { id: attendance.userId },
          select: {
            name: true,
            email: true,
            registration: true,
            rollNumber: true,
            branch: true,
          },
        });

        return {
          id: attendance.id,
          status: attendance.status,
          points: attendance.points,
          markedAt: attendance.markedAt,
          method: attendance.method,
          user: user || {
            name: "Unknown User",
            email: "",
            registration: null,
            rollNumber: null,
            branch: null,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      attendances: attendancesWithUsers,
      total: attendancesWithUsers.length,
    });
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance records" },
      { status: 500 }
    );
  }
}
