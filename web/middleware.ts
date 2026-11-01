import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // Handle forms subdomain: forms.cbgcek.dev
  if (host.startsWith("forms.") || host.includes("forms.cbgcek.dev")) {
    // If accessing root only (forms.cbgcek.dev or forms.cbgcek.dev/), redirect to main app login/dashboard
    if (pathname === "/" || pathname === "") {
      return NextResponse.redirect("https://app.codebreakersgcek.tech/login");
    }
    // If accessing /[formId] directly without /forms prefix, rewrite internally
    if (
      !pathname.startsWith("/forms") &&
      !pathname.startsWith("/api") &&
      !pathname.startsWith("/_next")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = `/forms${pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match page routes only. Exclude api, _next/static, _next/image, manifest, favicon, sitemap, robots, assets.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|sitemap.xml|robots.txt|assets).*)",
  ],
};