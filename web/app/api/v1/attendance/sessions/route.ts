import { NextRequest, NextResponse } from "next/server";
import { AttendanceService } from "@/services/attendance.service";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasAdminOrCoAdminAccess } from "@/lib/member-roles";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    const result = await AttendanceService.listSessions(limit, offset);

    return NextResponse.json({
      success: true,
      sessions: result.sessions,
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: offset + limit < result.total,
      },
    });
  } catch (error: any) {
    console.error("V1 attendance sessions GET error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { sessionNumber, title, date, day, targetBatchIds } = body;

    if (!sessionNumber || !title || !date || !day) {
      return NextResponse.json(
        { success: false, error: "sessionNumber, title, date, and day are required" },
        { status: 400 }
      );
    }

    const created = await AttendanceService.createSession({
      sessionNumber: Number(sessionNumber),
      title,
      date,
      day,
      targetBatchIds: targetBatchIds || [],
      createdBy: session.user.id,
    });

    return NextResponse.json({ success: true, session: created }, { status: 201 });
  } catch (error: any) {
    console.error("V1 attendance sessions POST error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create session" },
      { status: 500 }
    );
  }
}
