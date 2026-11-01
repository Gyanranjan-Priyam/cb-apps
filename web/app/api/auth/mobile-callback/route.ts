import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const url = new URL(request.url);
    const customScheme = url.searchParams.get("scheme") || "mobile";

    if (!session || !session.user) {
      return NextResponse.redirect(`${customScheme}://auth-callback?error=no_session`);
    }

    // Verify member exists in DB and is not banned
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, role: true, banned: true },
    });

    if (!dbUser || dbUser.banned) {
      await auth.api.signOut({ headers: await headers() });
      return NextResponse.redirect(
        `${customScheme}://auth-callback?error=unauthorized`
      );
    }

    // Update user login activity
    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        hasLoggedIn: true,
        emailVerified: true,
        lastLoginAt: new Date(),
        loginCount: { increment: 1 },
      },
    }).catch(() => {});

    const token = (session as any).token || (session.session as any)?.token || session.user.id;
    const email = encodeURIComponent(dbUser.email || session.user.email);
    const name = encodeURIComponent(dbUser.name || session.user.name || "");
    const role = encodeURIComponent(dbUser.role || "member");
    const userId = encodeURIComponent(dbUser.id);

    const targetRedirect = url.searchParams.get("redirect_uri") || `${customScheme}://auth-callback`;
    const delimiter = targetRedirect.includes("?") ? "&" : "?";

    return NextResponse.redirect(
      `${targetRedirect}${delimiter}token=${token}&userId=${userId}&email=${email}&name=${name}&role=${role}`
    );
  } catch (error) {
    console.error("Mobile OAuth callback error:", error);
    const customScheme = new URL(request.url).searchParams.get("scheme") || "mobile";
    return NextResponse.redirect(`${customScheme}://auth-callback?error=server_error`);
  }
}
