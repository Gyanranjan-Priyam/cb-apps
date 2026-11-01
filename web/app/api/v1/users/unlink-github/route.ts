import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { UserService } from "@/services/user.service";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    await UserService.unlinkGithubAccount(session.user.id);

    return NextResponse.json({
      success: true,
      message: "GitHub account unlinked successfully",
    });
  } catch (error: any) {
    console.error("V1 unlink-github error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to unlink GitHub account" },
      { status: 500 }
    );
  }
}
