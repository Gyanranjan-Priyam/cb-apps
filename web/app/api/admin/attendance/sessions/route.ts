import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { isSystemAdminRole, hasAdminOrCoAdminAccess } from "@/lib/member-roles";

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

    const attendanceSessions = await prisma.attendanceSession.findMany({
      orderBy: {
        sessionNumber: "desc",
      },
      include: {
        _count: {
          select: {
            attendances: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      sessions: attendanceSessions,
    });
  } catch (error) {
    console.error("Error fetching attendance sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance sessions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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

    const { sessionNumber, title, date, day, targetBatchIds } = await req.json();

    if (!title || !date || !day) {
      return NextResponse.json(
        { error: "Title, date, and day are required" },
        { status: 400 }
      );
    }

    let finalSessionNumber: number;
    if (!sessionNumber || parseInt(sessionNumber) <= 0) {
      const latest = await prisma.attendanceSession.findFirst({
        orderBy: { sessionNumber: "desc" },
        select: { sessionNumber: true },
      });
      finalSessionNumber = (latest?.sessionNumber || 0) + 1;
    } else {
      finalSessionNumber = parseInt(sessionNumber);
      // Check if session number already exists
      const existingSession = await prisma.attendanceSession.findUnique({
        where: { sessionNumber: finalSessionNumber },
      });

      if (existingSession) {
        return NextResponse.json(
          { error: `Session #${finalSessionNumber} already exists` },
          { status: 400 }
        );
      }
    }

    const attendanceSession = await prisma.attendanceSession.create({
      data: {
        sessionNumber: finalSessionNumber,
        title,
        date: new Date(date),
        day,
        targetBatchIds: targetBatchIds || [],
        createdBy: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Attendance session created successfully",
      session: attendanceSession,
    });
  } catch (error) {
    console.error("Error creating attendance session:", error);
    return NextResponse.json(
      { error: "Failed to create attendance session" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || !isSystemAdminRole(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    await prisma.attendanceSession.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Attendance session deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting attendance session:", error);
    return NextResponse.json(
      { error: "Failed to delete attendance session" },
      { status: 500 }
    );
  }
}
