import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { GoogleDriveService } from "@/lib/google-drive-service";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const status = await GoogleDriveService.getConnectionStatus(session?.user?.id);
    return NextResponse.json({ success: true, data: status });
  } catch (error: any) {
    console.error("Error fetching Google Drive status:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch Google Drive status" },
      { status: 500 }
    );
  }
}
