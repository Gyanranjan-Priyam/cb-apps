import { NextRequest, NextResponse } from "next/server";
import { AttendanceService } from "@/services/attendance.service";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasAdminOrCoAdminAccess } from "@/lib/member-roles";

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

    const { sessionId, qrContent } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "sessionId is required" }, { status: 400 });
    }

    if (!qrContent) {
      return NextResponse.json({ success: false, error: "qrContent is required" }, { status: 400 });
    }

    const result = await AttendanceService.processScan({
      sessionId,
      qrContent,
      markedBy: session.user.id,
      scannerName: session.user.name,
      method: "admin-qr-scan",
    });

    if (!result.success && result.status) {
      return NextResponse.json(
        { success: false, error: result.error, identifier: (result as any).identifier },
        { status: result.status }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("V1 scan-student error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
