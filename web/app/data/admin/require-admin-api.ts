import "server-only";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { cache } from "react";
import { isSystemAdminRole } from "@/lib/member-roles";

export const requireAdminAPI = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  if (!isSystemAdminRole(session.user.role)) {
    return null;
  }

  return session;
});