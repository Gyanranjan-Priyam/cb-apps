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

    const searchParams = request.nextUrl.searchParams;
    const callbackUrl = `${request.nextUrl.origin}/api/user/link-github/callback`;

    // Use separate OAuth credentials for linking if available, otherwise fall back to main auth credentials
    const clientId = process.env.GITHUB_LINK_CLIENT_ID || process.env.AUTH_GITHUB_CLIENT_ID;

    console.log("GitHub OAuth - Callback URL:", callbackUrl);
    console.log("GitHub OAuth - Client ID:", clientId);
    console.log("GitHub OAuth - Using separate credentials:", !!process.env.GITHUB_LINK_CLIENT_ID);

    // GitHub OAuth URL
    const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
    githubAuthUrl.searchParams.append("client_id", clientId!);
    githubAuthUrl.searchParams.append("redirect_uri", callbackUrl);
    githubAuthUrl.searchParams.append("scope", "read:user");
    // Encode state as userId:redirectPath
    githubAuthUrl.searchParams.append("state", `${session.user.id}:/dashboard/settings`);

    return NextResponse.redirect(githubAuthUrl.toString());
  } catch (error) {
    console.error("Error initiating GitHub OAuth:", error);
    return NextResponse.json(
      { success: false, message: "Failed to initiate GitHub linking" },
      { status: 500 }
    );
  }
}
