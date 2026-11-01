import "server-only";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { isSystemAdminRole } from "@/lib/member-roles";

export const requireAdmin = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/login");
  }

  if (!isSystemAdminRole(session.user.role)) {
    return redirect("/not-admin");
  }

  return session;
});