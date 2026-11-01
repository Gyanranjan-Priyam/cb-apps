import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST — Public endpoint to validate an attendance delegation code.
 * No auth required — anyone with the code can check if it's valid.
 */
export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { valid: false, error: "Code is required" },
        { status: 400 }
      );
    }

    const normalizedCode = code.trim().toUpperCase();

    const setting = await prisma.systemSettings.findUnique({
      where: { key: `attendance-code-${normalizedCode}` },
    });

    if (!setting) {
      return NextResponse.json({
        valid: false,
        error: "Invalid attendance code. Please check and try again.",
      });
    }

    const data = JSON.parse(setting.value);

    // Check expiry
    if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
      // Cleanup expired code
      await prisma.systemSettings.delete({
        where: { key: `attendance-code-${normalizedCode}` },
      }).catch(() => {});

      return NextResponse.json({
        valid: false,
        error: "This attendance code has expired. Please request a new code from the admin.",
      });
    }

    // Check active
    if (!data.active) {
      return NextResponse.json({
        valid: false,
        error: "This attendance code has been deactivated by the admin.",
      });
    }

    // Verify the attendance session still exists
    const attendanceSession = await prisma.attendanceSession.findUnique({
      where: { id: data.sessionId },
      include: {
        _count: {
          select: { attendances: true },
        },
      },
    });

    if (!attendanceSession) {
      return NextResponse.json({
        valid: false,
        error: "The linked attendance session no longer exists.",
      });
    }

    return NextResponse.json({
      valid: true,
      sessionTitle: attendanceSession.title,
      sessionNumber: attendanceSession.sessionNumber,
      sessionDate: attendanceSession.date,
      sessionDay: attendanceSession.day,
      totalMarked: attendanceSession._count.attendances,
      expiresAt: data.expiresAt,
    });
  } catch (error) {
    console.error("Error validating attendance code:", error);
    return NextResponse.json(
      { valid: false, error: "Server error while validating code" },
      { status: 500 }
    );
  }
}
