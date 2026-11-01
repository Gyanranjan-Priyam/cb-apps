import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { emitSocketEvent, emitSocketEventToRooms } from "@/lib/socket-server";
import { extractStudentIdentifier } from "@/app/api/admin/attendance/scan-student/route";

/**
 * POST — Public endpoint for delegated attendance scanning.
 * No login required — the delegation code acts as the auth token.
 * Scans a student QR code and marks attendance for the linked session.
 */
export async function POST(req: NextRequest) {
  try {
    const { code, qrContent, scannerName } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Attendance code is required" },
        { status: 400 }
      );
    }

    if (!qrContent || typeof qrContent !== "string") {
      return NextResponse.json(
        { error: "QR code content is required" },
        { status: 400 }
      );
    }

    const normalizedCode = code.trim().toUpperCase();

    // Validate the delegation code
    const setting = await prisma.systemSettings.findUnique({
      where: { key: `attendance-code-${normalizedCode}` },
    });

    if (!setting) {
      return NextResponse.json(
        { error: "Invalid attendance code" },
        { status: 401 }
      );
    }

    const codeData = JSON.parse(setting.value);

    // Check expiry
    if (codeData.expiresAt && new Date(codeData.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "This attendance code has expired" },
        { status: 401 }
      );
    }

    if (!codeData.active) {
      return NextResponse.json(
        { error: "This attendance code has been deactivated" },
        { status: 401 }
      );
    }

    const sessionId = codeData.sessionId;

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

    // Extract student identifier from QR content
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
        },
        { status: 403 }
      );
    }

    // Check batch eligibility
    if (session.targetBatchIds && session.targetBatchIds.length > 0) {
      if (!user.batchId || !session.targetBatchIds.includes(user.batchId)) {
        return NextResponse.json(
          {
            error: `Session restricted: ${user.name} is not in the assigned batch for this session.`,
          },
          { status: 403 }
        );
      }
    }

    // Check if already marked
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId: user.id,
        },
      },
    });

    if (existingAttendance && existingAttendance.status === "present") {
      const alreadyPayload = {
        type: "delegate-scan",
        sessionId: session.id,
        sessionTitle: session.title,
        sessionNumber: session.sessionNumber,
        userId: user.id,
        userName: user.name,
        cbUserId: user.cbUserId,
        branch: user.branch,
        profileImageKey: user.profileImageKey,
        image: user.image,
        points: existingAttendance.points || 10,
        status: "present",
        alreadyMarked: true,
        scannerName: scannerName || "Scanner",
        delegateCode: normalizedCode,
        timestamp: new Date().toISOString(),
        message: `${user.name} is already marked Present`,
      };

      // Broadcast to delegate room so all scanner devices see it
      await emitSocketEvent(
        `attendance-delegate-${normalizedCode}`,
        "delegate-scan",
        alreadyPayload
      );

      // Also notify the student
      const userRooms = Array.from(
        new Set([
          `user-${user.id}`,
          `user:${user.id}`,
          ...(user.cbUserId ? [`user-${user.cbUserId}`, `user:${user.cbUserId}`] : []),
        ])
      );
      await emitSocketEventToRooms(userRooms, "attendance-marked", {
        ...alreadyPayload,
        type: "attendance-marked",
      });

      return NextResponse.json({
        success: true,
        alreadyMarked: true,
        message: `${user.name} (${user.cbUserId || user.rollNumber || "Member"}) is already marked Present.`,
        user,
      });
    }

    // Mark attendance
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
        markedBy: `delegate-${normalizedCode}`,
        method: "delegate-qr-scan",
        updatedAt: new Date(),
      },
      create: {
        sessionId,
        userId: user.id,
        status: "present",
        points: 10,
        markedBy: `delegate-${normalizedCode}`,
        method: "delegate-qr-scan",
      },
    });

    const scanPayload = {
      type: "delegate-scan",
      sessionId: session.id,
      sessionTitle: session.title,
      sessionNumber: session.sessionNumber,
      userId: user.id,
      userName: user.name,
      cbUserId: user.cbUserId,
      branch: user.branch,
      rollNumber: user.rollNumber,
      registration: user.registration,
      profileImageKey: user.profileImageKey,
      image: user.image,
      points: 10,
      status: "present",
      alreadyMarked: false,
      scannerName: scannerName || "Scanner",
      delegateCode: normalizedCode,
      timestamp: new Date().toISOString(),
      message: `Marked Present: ${user.name} (+10 pts)`,
    };

    // 1. Broadcast to delegate code room → all scanner devices + admin
    await emitSocketEvent(
      `attendance-delegate-${normalizedCode}`,
      "delegate-scan",
      scanPayload
    );

    // 2. Broadcast to admin attendance session room → admin live list
    await emitSocketEvent(
      `attendance-session-${sessionId}`,
      "attendance-updated",
      scanPayload
    );

    // 3. Notify the student's personal rooms
    const userRooms = Array.from(
      new Set([
        `user-${user.id}`,
        `user:${user.id}`,
        ...(user.cbUserId ? [`user-${user.cbUserId}`, `user:${user.cbUserId}`] : []),
      ])
    );
    await emitSocketEventToRooms(userRooms, "attendance-marked", {
      ...scanPayload,
      type: "attendance-marked",
      message: `Your attendance for "${session.title}" (Session #${session.sessionNumber}) has been marked Present (+10 points)!`,
    });

    // 4. Leaderboard update
    await emitSocketEvent("leaderboard", "leaderboard-updated", scanPayload);

    return NextResponse.json({
      success: true,
      alreadyMarked: false,
      message: `Marked Present: ${user.name} (${user.cbUserId || user.branch || "Member"}) +10 pts`,
      user,
      attendance,
    });
  } catch (error) {
    console.error("Error in delegated attendance scan:", error);
    return NextResponse.json(
      { error: "Internal server error while processing scan" },
      { status: 500 }
    );
  }
}
