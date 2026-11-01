import { NextRequest, NextResponse } from "next/server";
import { UserRepository } from "@/repositories/user.repository";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!query) {
      return NextResponse.json({ success: true, users: [] });
    }

    const users = await UserRepository.searchUsers(query, limit);
    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    console.error("V1 Users search error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
