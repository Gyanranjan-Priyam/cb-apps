import "server-only";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { cache } from "react";
import { hasAdminOrCoAdminAccess } from "@/lib/member-roles";

/**
 * Returns session if user is co-admin or admin, else returns null.
 */
export const requireCoAdminAPI = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  if (!hasAdminOrCoAdminAccess(session.user.role)) {
    return null;
  }

  return session;
});
