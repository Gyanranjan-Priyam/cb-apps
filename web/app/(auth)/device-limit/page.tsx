import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isSystemAdminRole } from "@/lib/member-roles";
import { parseUserAgent } from "@/lib/device-parser";
import { DeviceLimitClient } from "./_components/device-limit-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Device Limit Reached | CodeBreakers",
  description: "Manage your active devices to continue logging in.",
};

export default async function DeviceLimitPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return redirect("/login");
  }

  // If user is admin, they have unlimited devices -> proceed to admin or dashboard
  if (isSystemAdminRole(session.user.role)) {
    return redirect("/admin");
  }

  const currentToken = session.session?.token || session.session?.id || "";
  const currentSessionId = session.session?.id || "";

  // Query all active non-expired sessions for this user
  const rawSessions = await prisma.session.findMany({
    where: {
      userId: session.user.id,
      expiresAt: { gt: new Date() },
    },
    orderBy: { updatedAt: "desc" },
  });

  // If user has 2 or fewer sessions, they are within the limit -> proceed to dashboard
  if (rawSessions.length <= 2) {
    return redirect("/dashboard");
  }

  // Separate other sessions and current session
  const otherSessions = rawSessions
    .filter((s) => s.token !== currentToken && s.id !== currentSessionId)
    .map((s) => ({
      id: s.id,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      deviceInfo: parseUserAgent(s.userAgent),
    }));

  const currentSessionData = {
    id: currentSessionId,
    ipAddress: session.session?.ipAddress || null,
    userAgent: session.session?.userAgent || null,
    deviceInfo: parseUserAgent(session.session?.userAgent),
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 w-full max-w-xl mx-auto">
      <DeviceLimitClient
        userName={session.user.name || "Member"}
        otherSessions={otherSessions}
        currentSession={currentSessionData}
      />
    </div>
  );
}
