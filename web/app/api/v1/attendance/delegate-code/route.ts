import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasAdminOrCoAdminAccess } from "@/lib/member-roles";
import { AttendanceRepository } from "@/repositories/attendance.repository";
import { prisma } from "@/lib/db";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const CODE_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || !hasAdminOrCoAdminAccess(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin or Co-Admin access required." },
        { status: 401 }
      );
    }

    const { sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Session ID is required" },
        { status: 400 }
      );
    }

    const attendanceSession = await AttendanceRepository.findSessionById(sessionId);
    if (!attendanceSession) {
      return NextResponse.json(
        { success: false, error: "Attendance session not found" },
        { status: 404 }
      );
    }

    let code = generateCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await AttendanceRepository.getDelegationCodeSetting(code);
      if (!existing) break;
      code = generateCode();
      attempts++;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + CODE_EXPIRY_MS);

    await AttendanceRepository.saveDelegationCodeSetting(code, {
      sessionId: attendanceSession.id,
      sessionTitle: attendanceSession.title,
      sessionNumber: attendanceSession.sessionNumber,
      createdBy: session.user.id,
      createdByName: session.user.name,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      active: true,
    });

    return NextResponse.json({
      success: true,
      code,
      sessionId: attendanceSession.id,
      sessionTitle: attendanceSession.title,
      sessionNumber: attendanceSession.sessionNumber,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error("V1 delegate-code POST error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to generate delegation code" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || !hasAdminOrCoAdminAccess(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin or Co-Admin access required." },
        { status: 401 }
      );
    }

    const allCodes = await prisma.systemSettings.findMany({
      where: {
        key: { startsWith: "attendance-code-" },
      },
    });

    const now = new Date();
    const codes = allCodes
      .map((setting) => {
        const code = setting.key.replace("attendance-code-", "");
        try {
          const data = JSON.parse(setting.value);
          const isExpired = data.expiresAt && new Date(data.expiresAt) < now;
          return {
            code,
            ...data,
            expired: isExpired,
            active: data.active && !isExpired,
          };
        } catch {
          return null;
        }
      })
      .filter((c) => c && c.active);

    return NextResponse.json({
      success: true,
      codes,
    });
  } catch (error: any) {
    console.error("V1 delegate-code GET error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch delegation codes" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || !hasAdminOrCoAdminAccess(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin or Co-Admin access required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ success: false, error: "Code is required" }, { status: 400 });
    }

    await prisma.systemSettings.deleteMany({
      where: { key: `attendance-code-${code.toUpperCase()}` },
    });

    return NextResponse.json({
      success: true,
      message: `Code ${code} has been revoked`,
    });
  } catch (error: any) {
    console.error("V1 delegate-code DELETE error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to revoke delegation code" },
      { status: 500 }
    );
  }
}
