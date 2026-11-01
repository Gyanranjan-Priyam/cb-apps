import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET — Public endpoint to fetch scanned students for a delegated session.
 * Used to hydrate the live feed on page load and provide silent polling fallback.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Code is required" },
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
    const sessionId = codeData.sessionId;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session not linked" },
        { status: 404 }
      );
    }

    // Fetch all present attendances for this session
    const attendances = await prisma.attendance.findMany({
      where: {
        sessionId,
        status: "present",
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 100,
    });

    const formattedScans = await Promise.all(
      attendances.map(async (att) => {
        const user = await prisma.user.findUnique({
          where: { id: att.userId },
          select: {
            id: true,
            name: true,
            email: true,
            cbUserId: true,
            registration: true,
            rollNumber: true,
            branch: true,
            profileImageKey: true,
            image: true,
          },
        });

        const userName = user?.name || "Student";
        return {
          userId: att.userId,
          userName,
          userEmail: user?.email || "",
          cbUserId: user?.cbUserId || null,
          registration: user?.registration || null,
          rollNumber: user?.rollNumber || null,
          branch: user?.branch || null,
          profileImageKey: user?.profileImageKey || null,
          image: user?.image || null,
          points: att.points,
          status: att.status,
          method: att.method,
          markedBy: att.markedBy,
          scannerName: att.markedBy?.startsWith("delegate-")
            ? `Scanner ${att.markedBy.replace("delegate-", "")}`
            : "Admin",
          timestamp: att.updatedAt.toISOString(),
          message: `Marked Present: ${userName}`,
        };
      })
    );

    return NextResponse.json({
      success: true,
      sessionId,
      total: formattedScans.length,
      scans: formattedScans,
    });
  } catch (error) {
    console.error("Error fetching session scans:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
