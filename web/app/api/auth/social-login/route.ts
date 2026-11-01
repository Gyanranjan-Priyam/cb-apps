import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const provider = url.searchParams.get("provider") as "google" | "github";
    const reqHeaders = await headers();
    const host = reqHeaders.get("x-forwarded-host") || reqHeaders.get("host") || "localhost:3000";
    const proto = reqHeaders.get("x-forwarded-proto") || "http";
    const baseOrigin = `${proto}://${host}`;

    const redirectUri = url.searchParams.get("redirect_uri");
    const callbackURL = redirectUri
      ? `${baseOrigin}/api/auth/mobile-callback?redirect_uri=${encodeURIComponent(redirectUri)}`
      : `${baseOrigin}/api/auth/mobile-callback`;

    // Initialize social sign in using Better Auth with asResponse: true to get all state cookies
    const authRes = await auth.api.signInSocial({
      body: {
        provider,
        callbackURL,
      },
      headers: await headers(),
      asResponse: true,
    });

    const data = await authRes.json();

    if (data && data.url) {
      const redirectRes = NextResponse.redirect(data.url);

      // Forward all set-cookie headers (state, pkce_verifier, etc.) to the browser
      const cookies = authRes.headers.getSetCookie
        ? authRes.headers.getSetCookie()
        : [authRes.headers.get("set-cookie")].filter(Boolean) as string[];

      for (const cookie of cookies) {
        if (cookie) {
          redirectRes.headers.append("set-cookie", cookie);
        }
      }

      return redirectRes;
    }

    return NextResponse.json({ error: "Failed to get auth URL" }, { status: 500 });
  } catch (error: any) {
    console.error("Social login redirect error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal error during social login" },
      { status: 500 }
    );
  }
}
