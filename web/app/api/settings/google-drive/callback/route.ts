/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { GoogleDriveService } from "@/lib/google-drive-service";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    console.error("Google OAuth returned error:", error);
    return NextResponse.redirect(
      `${origin}/admin/settings?error=gdrive_${encodeURIComponent(error)}`
    );
  }

  if (!code || !stateRaw) {
    return NextResponse.redirect(
      `${origin}/admin/settings?error=gdrive_missing_params`
    );
  }

  try {
    let userId = "";
    try {
      const stateObj = JSON.parse(Buffer.from(stateRaw, "base64url").toString());
      userId = stateObj.userId;
    } catch {
      userId = stateRaw;
    }

    if (!userId) {
      return NextResponse.redirect(
        `${origin}/admin/settings?error=gdrive_invalid_state`
      );
    }

    await GoogleDriveService.handleOAuthCallback(code, userId, origin);

    return NextResponse.redirect(
      `${origin}/admin/settings?gdrive=connected`
    );
  } catch (err: any) {
    console.error("Error in Google Drive OAuth callback:", err);
    return NextResponse.redirect(
      `${origin}/admin/settings?error=gdrive_callback_failed&details=${encodeURIComponent(
        err.message || "Failed to link Google Drive"
      )}`
    );
  }
}
