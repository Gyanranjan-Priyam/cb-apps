import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { GoogleDriveService } from "@/lib/google-drive-service";

export async function POST() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await GoogleDriveService.disconnect(session.user.id);

    return NextResponse.json({
      success: true,
      message: "Google Drive disconnected successfully",
    });
  } catch (error: any) {
    console.error("Error disconnecting Google Drive:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to disconnect Google Drive" },
      { status: 500 }
    );
  }
}
