import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { isSystemAdminRole, hasAdminOrCoAdminAccess } from "@/lib/member-roles";
import { emitSocketEvent, emitSocketEventToRooms } from "@/lib/socket-server";

export function extractStudentIdentifier(qrContent: string): string {
  if (!qrContent) return "";
  const text = qrContent.trim();

  // Try JSON
  if (text.startsWith("{") && text.endsWith("}")) {
    try {
      const parsed = JSON.parse(text);
      if (parsed.cbUserId) return String(parsed.cbUserId).trim();
      if (parsed.userId) return String(parsed.userId).trim();
      if (parsed.id) return String(parsed.id).trim();
      if (parsed.email) return String(parsed.email).trim();
      if (parsed.registration) return String(parsed.registration).trim();
      if (parsed.rollNumber) return String(parsed.rollNumber).trim();
      if (parsed.username) return String(parsed.username).trim();
    } catch {
      // Continue
    }
  }

  // Check for URL containing /member/
  if (text.includes("/member/")) {
    try {
      const parts = text.split("/member/");
      if (parts[1]) {
        const cleanSegment = parts[1].split("?")[0].split("#")[0].split("/")[0];
        return decodeURIComponent(cleanSegment).trim();
      }
    } catch {
      // Continue
    }
  }

  return text;
}

export async function POST(req: NextRequest) {
  try {
    const authSession = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authSession?.user || !hasAdminOrCoAdminAccess(authSession.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized. Admin or Co-Admin access required." },
        { status: 401 }
      );
    }

    const { sessionId, qrContent } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    if (!qrContent || typeof qrContent !== "string") {
      return NextResponse.json(
        { error: "QR code content is required" },
        { status: 400 }
      );
    }

    // Verify session exists
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Attendance session not found" },
        { status: 404 }
      );
    }

    const identifier = extractStudentIdentifier(qrContent);

    if (!identifier) {
      return NextResponse.json(
        { error: "Could not read student identifier from QR code" },
        { status: 400 }
      );
    }

    // Find student in database
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { cbUserId: { equals: identifier, mode: "insensitive" } },
          { id: identifier },
          { email: { equals: identifier, mode: "insensitive" } },
          { username: { equals: identifier, mode: "insensitive" } },
          { registration: { equals: identifier, mode: "insensitive" } },
          { rollNumber: { equals: identifier, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        cbUserId: true,
        registration: true,
        rollNumber: true,
        branch: true,
        batchId: true,
        profileImageKey: true,
        image: true,
        banned: true,
        banReason: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: `Member not found for scanned ID: "${identifier}"`,
          identifier,
        },
        { status: 404 }
      );
    }

    if (user.banned) {
      return NextResponse.json(
        {
          error: `Member is banned: ${user.name} (${user.banReason || "No reason specified"})`,
          user,
        },
        { status: 403 }
      );
    }

    // Check batch eligibility if session is targeted
    if (session.targetBatchIds && session.targetBatchIds.length > 0) {
      if (!user.batchId || !session.targetBatchIds.includes(user.batchId)) {
        return NextResponse.json(
          {
            error: `Session restricted: ${user.name} is not in the assigned batch for this session.`,
            user,
          },
          { status: 403 }
        );
      }
    }

    // Check if attendance already marked
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId: user.id,
        },
      },
    });

    if (existingAttendance && existingAttendance.status === "present") {
      const verifyPayload = {
        type: "attendance-marked",
        sessionId: session.id,
        sessionTitle: session.title,
        sessionNumber: session.sessionNumber,
        userId: user.id,
        userName: user.name,
        cbUserId: user.cbUserId,
        points: existingAttendance.points || 10,
        status: "present",
        alreadyMarked: true,
        timestamp: new Date().toISOString(),
        message: `${user.name}, your attendance for "${session.title}" is already recorded as Present!`,
      };

      const userRooms = Array.from(
        new Set([
          `user-${user.id}`,
          `user:${user.id}`,
          ...(user.cbUserId ? [`user-${user.cbUserId}`, `user:${user.cbUserId}`] : []),
        ])
      );
      await emitSocketEventToRooms(userRooms, "attendance-marked", verifyPayload);

      return NextResponse.json({
        success: true,
        alreadyMarked: true,
        message: `${user.name} (${user.cbUserId || user.rollNumber || "Member"}) is already marked Present.`,
        user,
        attendance: existingAttendance,
        sessionTitle: session.title,
      });
    }

    // Mark attendance as present with 10 points
    const attendance = await prisma.attendance.upsert({
      where: {
        sessionId_userId: {
          sessionId,
          userId: user.id,
        },
      },
      update: {
        status: "present",
        points: 10,
        markedBy: authSession.user.id,
        method: "admin-qr-scan",
        updatedAt: new Date(),
      },
      create: {
        sessionId,
        userId: user.id,
        status: "present",
        points: 10,
        markedBy: authSession.user.id,
        method: "admin-qr-scan",
      },
    });

    // Realtime broadcast via Socket.IO:
    // 1. To the student's personal rooms -> updates student dashboard instantly + triggers browser push notification
    const realtimePayload = {
      type: "attendance-marked",
      sessionId: session.id,
      sessionTitle: session.title,
      sessionNumber: session.sessionNumber,
      userId: user.id,
      userName: user.name,
      cbUserId: user.cbUserId,
      points: 10,
      status: "present",
      timestamp: new Date().toISOString(),
      message: `Your attendance for "${session.title}" (Session #${session.sessionNumber}) has been marked Present (+10 points)!`,
    };

    const userRooms = Array.from(
      new Set([
        `user-${user.id}`,
        `user:${user.id}`,
        ...(user.cbUserId ? [`user-${user.cbUserId}`, `user:${user.cbUserId}`] : []),
      ])
    );
    await emitSocketEventToRooms(userRooms, "attendance-marked", realtimePayload);
    // 2. To the attendance session room for live admin monitor screens
    await emitSocketEvent(`attendance-session-${sessionId}`, "attendance-updated", realtimePayload);
    // 3. To the global leaderboard room for real-time leaderboard ranking updates
    await emitSocketEvent("leaderboard", "leaderboard-updated", realtimePayload);

    return NextResponse.json({
      success: true,
      alreadyMarked: false,
      message: `Marked Present: ${user.name} (${user.cbUserId || user.branch || "Member"}) +10 pts`,
      user,
      attendance,
      sessionTitle: session.title,
    });
  } catch (error) {
    console.error("Error scanning student QR code:", error);
    return NextResponse.json(
      { error: "Internal server error while processing QR code" },
      { status: 500 }
    );
  }
}
