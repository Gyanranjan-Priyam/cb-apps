import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const callbackUrl = `${request.nextUrl.origin}/api/user/link-github/callback`;
    const clientId = process.env.GITHUB_LINK_CLIENT_ID || process.env.AUTH_GITHUB_CLIENT_ID;

    const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
    githubAuthUrl.searchParams.append("client_id", clientId!);
    githubAuthUrl.searchParams.append("redirect_uri", callbackUrl);
    githubAuthUrl.searchParams.append("scope", "read:user");
    githubAuthUrl.searchParams.append("state", `${session.user.id}:/dashboard/settings`);

    return NextResponse.redirect(githubAuthUrl.toString());
  } catch (error) {
    console.error("V1 GitHub Link error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to initiate GitHub linking" },
      { status: 500 }
    );
  }
}
