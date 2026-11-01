import { NextRequest, NextResponse } from "next/server";
import { AttendanceService } from "@/services/attendance.service";

/**
 * Mobile / Web Delegated Attendance Scan endpoint
 * Accepts: code (delegation code), qrContent (scanned QR content), scannerName (optional)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, qrContent, scannerName, sessionId } = body;

    if (!code && !sessionId) {
      return NextResponse.json(
        { success: false, error: "Attendance code or session ID is required" },
        { status: 400 }
      );
    }

    if (!qrContent) {
      return NextResponse.json(
        { success: false, error: "QR code content is required" },
        { status: 400 }
      );
    }

    const result = await AttendanceService.processScan({
      code,
      sessionId,
      qrContent,
      scannerName,
    });

    if (!result.success && result.status) {
      return NextResponse.json(
        { success: false, error: result.error, identifier: (result as any).identifier },
        { status: result.status }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("V1 attendance scan error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error while processing scan" },
      { status: 500 }
    );
  }
}
