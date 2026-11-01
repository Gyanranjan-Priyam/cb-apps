import { NextRequest, NextResponse } from "next/server";
import { isRegistrationEnabled } from "@/lib/system-settings";

export async function checkRegistrationStatus(request: NextRequest) {
  // Only check for registration-related routes
  const pathname = request.nextUrl.pathname;
  const registrationRoutes = ["/register", "/signup", "/events/register"];

  // Check if this is a registration-related route
  const isRegistrationRoute = registrationRoutes.some(
    (route) => pathname.startsWith(route) || pathname.includes("register"),
  );

  if (isRegistrationRoute) {
    try {
      const registrationEnabled = await isRegistrationEnabled();

      if (!registrationEnabled) {
        // Redirect to thank you page if registration is disabled
        return NextResponse.redirect(new URL("/thank-you", request.url));
      }
    } catch (error) {
      console.error("Error checking registration status:", error);
      // If there's an error, allow the request to proceed (fail open)
    }
  }

  return NextResponse.next();
}
