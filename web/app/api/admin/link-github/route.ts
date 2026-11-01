import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const callbackUrl = `${request.nextUrl.origin}/api/user/link-github/callback`;
    const clientId = process.env.GITHUB_LINK_CLIENT_ID || process.env.AUTH_GITHUB_CLIENT_ID;
    
    // Encode state as userId:redirectPath
    const state = `${session.user.id}:/admin/settings`;

    const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
    githubAuthUrl.searchParams.append("client_id", clientId!);
    githubAuthUrl.searchParams.append("redirect_uri", callbackUrl);
    githubAuthUrl.searchParams.append("scope", "read:user");
    githubAuthUrl.searchParams.append("state", state);

    return NextResponse.redirect(githubAuthUrl.toString());
  } catch (error) {
    console.error("Error initiating GitHub OAuth:", error);
    return NextResponse.redirect(
      new URL("/admin/settings?error=oauth_initiation_failed", request.url)
    );
  }
}
