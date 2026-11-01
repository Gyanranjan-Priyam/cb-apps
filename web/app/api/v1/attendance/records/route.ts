import { NextRequest, NextResponse } from "next/server";
import { AttendanceRepository } from "@/repositories/attendance.repository";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasAdminOrCoAdminAccess } from "@/lib/member-roles";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("sessionId");
    const userId = searchParams.get("userId");

    // If requesting for specific user history
    if (userId) {
      // User can only view their own history unless they are admin
      if (userId !== session.user.id && !hasAdminOrCoAdminAccess(session.user.role)) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }

      const history = await AttendanceRepository.getUserAttendanceHistory(userId);
      return NextResponse.json({ success: true, records: history });
    }

    // If requesting for specific session
    if (sessionId) {
      if (!hasAdminOrCoAdminAccess(session.user.role)) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }

      const records = await AttendanceRepository.getSessionRecords(sessionId);
      return NextResponse.json({ success: true, records });
    }

    return NextResponse.json(
      { success: false, error: "Either sessionId or userId parameter is required" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("V1 attendance records error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
