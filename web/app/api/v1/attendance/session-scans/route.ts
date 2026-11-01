import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "sessionId is required" }, { status: 400 });
    }

    const attendances = await prisma.attendance.findMany({
      where: {
        sessionId,
        status: "present",
      },
      orderBy: { markedAt: "desc" },
    });

    const userIds = attendances.map((a) => a.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        cbUserId: true,
        rollNumber: true,
        branch: true,
        profileImageKey: true,
        image: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const scans = attendances.map((a) => {
      const u = userMap.get(a.userId);
      return {
        id: a.id,
        sessionId: a.sessionId,
        userId: a.userId,
        userName: u?.name || "Unknown",
        cbUserId: u?.cbUserId || null,
        rollNumber: u?.rollNumber || null,
        branch: u?.branch || null,
        profileImageKey: u?.profileImageKey || null,
        image: u?.image || null,
        points: a.points,
        markedAt: a.markedAt.toISOString(),
        markedBy: a.markedBy,
        method: a.method,
      };
    });

    return NextResponse.json({ success: true, scans, count: scans.length });
  } catch (error: any) {
    console.error("V1 session-scans error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
