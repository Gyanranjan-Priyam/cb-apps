import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/services/user.service";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { available: false, reason: "Username parameter is required" },
        { status: 400 }
      );
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const result = await UserService.checkUsernameAvailability(username, session?.user?.id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("V1 check-username error:", error);
    return NextResponse.json(
      { available: false, reason: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
