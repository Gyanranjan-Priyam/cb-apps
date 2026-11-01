import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // userId:redirectPath

    if (!code || !state) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/dashboard/settings?error=missing_params`
      );
    }

    // Parse state to get userId and redirect path
    const [userId, redirectPath] = state.split(":");
    const finalRedirectPath = redirectPath || "/dashboard/settings";

    // Verify the user is still authenticated
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.id !== userId) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}${finalRedirectPath}?error=unauthorized`
      );
    }

    // Exchange code for access token
    const clientId = process.env.GITHUB_LINK_CLIENT_ID || process.env.AUTH_GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_LINK_CLIENT_SECRET || process.env.AUTH_GITHUB_CLIENT_SECRET;

    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: clientId!,
          client_secret: clientSecret!,
          code,
          redirect_uri: `${request.nextUrl.origin}/api/user/link-github/callback`,
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error("GitHub OAuth token error:", tokenData);
      return NextResponse.redirect(
        `${request.nextUrl.origin}${finalRedirectPath}?error=token_failed`
      );
    }

    // Fetch GitHub user data
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/json",
      },
    });

    const githubUser = await userResponse.json();

    if (!githubUser.login) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}${finalRedirectPath}?error=user_fetch_failed`
      );
    }

    // Update user with GitHub username
    await prisma.user.update({
      where: { id: userId },
      data: {
        githubUsername: githubUser.login,
        updatedAt: new Date(),
      },
    });

    return NextResponse.redirect(
      `${request.nextUrl.origin}${finalRedirectPath}?github=linked`
    );
  } catch (error) {
    console.error("Error in GitHub OAuth callback:", error);
    // Fallback to dashboard if redirect path is not available
    return NextResponse.redirect(
      `${request.nextUrl.origin}/dashboard/settings?error=callback_failed`
    );
  }
}
