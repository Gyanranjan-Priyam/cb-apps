import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { GoogleDriveService } from "@/lib/google-drive-service";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const authUrl = GoogleDriveService.getAuthUrl(session.user.id, request.nextUrl.origin);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Error initiating Google Drive OAuth:", error);
    return NextResponse.redirect(
      new URL("/admin/settings?error=gdrive_oauth_init_failed", request.url)
    );
  }
}
