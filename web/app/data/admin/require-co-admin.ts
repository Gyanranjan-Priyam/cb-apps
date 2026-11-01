import "server-only";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { hasAdminOrCoAdminAccess } from "@/lib/member-roles";

/**
 * Ensures user has at least Co-Admin or Full Admin access.
 * Used for /co-admin pages and shared operational actions.
 */
export const requireCoAdmin = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/login");
  }

  if (!hasAdminOrCoAdminAccess(session.user.role)) {
    return redirect("/dashboard");
  }

  return session;
});
