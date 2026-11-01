import { NextRequest, NextResponse } from "next/server";
import { AttendanceRepository } from "@/repositories/attendance.repository";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ success: false, error: "Code is required" }, { status: 400 });
    }

    const normalizedCode = code.trim().toUpperCase();
    const setting = await AttendanceRepository.getDelegationCodeSetting(normalizedCode);

    if (!setting) {
      return NextResponse.json({ success: false, valid: false, error: "Invalid attendance code" }, { status: 404 });
    }

    const codeData = JSON.parse(setting.value);
    const now = new Date();

    if (codeData.expiresAt && new Date(codeData.expiresAt) < now) {
      return NextResponse.json(
        { success: false, valid: false, error: "This attendance code has expired" },
        { status: 410 }
      );
    }

    if (!codeData.active) {
      return NextResponse.json(
        { success: false, valid: false, error: "This attendance code is inactive" },
        { status: 403 }
      );
    }

    const session = await AttendanceRepository.findSessionById(codeData.sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, valid: false, error: "Linked attendance session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      valid: true,
      code: normalizedCode,
      sessionId: session.id,
      sessionTitle: session.title,
      sessionNumber: session.sessionNumber,
      expiresAt: codeData.expiresAt,
    });
  } catch (error: any) {
    console.error("V1 validate-code error:", error);
    return NextResponse.json(
      { success: false, valid: false, error: error?.message || "Failed to validate code" },
      { status: 500 }
    );
  }
}
