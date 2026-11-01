import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { isSystemAdminRole, hasAdminOrCoAdminAccess } from "@/lib/member-roles";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I/O/0/1 to avoid confusion
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const CODE_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * POST — Generate a new delegation code for an attendance session
 */
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

    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Verify attendance session exists
    const attendanceSession = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!attendanceSession) {
      return NextResponse.json(
        { error: "Attendance session not found" },
        { status: 404 }
      );
    }

    // Generate a unique code
    let code = generateCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.systemSettings.findUnique({
        where: { key: `attendance-code-${code}` },
      });
      if (!existing) break;
      code = generateCode();
      attempts++;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + CODE_EXPIRY_MS);

    await prisma.systemSettings.create({
      data: {
        key: `attendance-code-${code}`,
        value: JSON.stringify({
          sessionId: attendanceSession.id,
          sessionTitle: attendanceSession.title,
          sessionNumber: attendanceSession.sessionNumber,
          createdBy: session.user.id,
          createdByName: session.user.name,
          createdAt: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
          active: true,
        }),
        description: `Attendance delegation code for session #${attendanceSession.sessionNumber}: ${attendanceSession.title}`,
      },
    });

    return NextResponse.json({
      success: true,
      code,
      sessionId: attendanceSession.id,
      sessionTitle: attendanceSession.title,
      sessionNumber: attendanceSession.sessionNumber,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Error generating delegation code:", error);
    return NextResponse.json(
      { error: "Failed to generate delegation code" },
      { status: 500 }
    );
  }
}

/**
 * GET — List all active delegation codes (admin only)
 */
export async function GET() {
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
      .filter(Boolean);

    // Clean up expired codes (fire and forget)
    const expiredKeys = allCodes.filter((s) => {
      try {
        const data = JSON.parse(s.value);
        return data.expiresAt && new Date(data.expiresAt) < now;
      } catch {
        return false;
      }
    });

    if (expiredKeys.length > 0) {
      prisma.systemSettings
        .deleteMany({
          where: {
            key: { in: expiredKeys.map((s) => s.key) },
          },
        })
        .catch(() => {});
    }

    return NextResponse.json({
      success: true,
      codes: codes.filter((c) => c && c.active),
    });
  } catch (error) {
    console.error("Error fetching delegation codes:", error);
    return NextResponse.json(
      { error: "Failed to fetch delegation codes" },
      { status: 500 }
    );
  }
}

/**
 * DELETE — Revoke a delegation code
 */
export async function DELETE(req: NextRequest) {
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
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Code is required" },
        { status: 400 }
      );
    }

    await prisma.systemSettings.deleteMany({
      where: { key: `attendance-code-${code.toUpperCase()}` },
    });

    return NextResponse.json({
      success: true,
      message: `Code ${code} has been revoked`,
    });
  } catch (error) {
    console.error("Error revoking delegation code:", error);
    return NextResponse.json(
      { error: "Failed to revoke delegation code" },
      { status: 500 }
    );
  }
}
