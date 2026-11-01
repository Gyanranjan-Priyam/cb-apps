import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { UserService } from "@/services/user.service";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ authenticated: false, session: null, user: null });
    }

    const fullProfile = await UserService.getUserProfile(session.user.id);

    return NextResponse.json({
      authenticated: true,
      session,
      user: fullProfile || session.user,
    });
  } catch (error) {
    console.error("V1 Session fetch error:", error);
    return NextResponse.json({ authenticated: false, session: null, user: null }, { status: 500 });
  }
}
