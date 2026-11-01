/**
 * CodeBreakers Member Roles Definition & Utilities (Mobile)
 */

export const SYSTEM_ROLE_ADMIN = "admin";
export const SYSTEM_ROLE_CO_ADMIN = "co-admin";

/**
 * Checks if a role indicates a system administrator.
 */
export function isSystemAdminRole(rawRole: string | null | undefined): boolean {
  if (!rawRole) return false;
  const lower = rawRole.toLowerCase();
  if (lower === "admin") return true;
  return lower.split(",").some((part) => part.trim() === "admin");
}

/**
 * Checks if a role indicates a co-admin.
 */
export function isCoAdminRole(rawRole: string | null | undefined): boolean {
  if (!rawRole) return false;
  const lower = rawRole.toLowerCase();
  if (lower === "co-admin" || lower === "co_admin" || lower === "coadmin") return true;
  return lower.split(",").some((part) => {
    const p = part.trim();
    return p === "co-admin" || p === "co_admin" || p === "coadmin";
  });
}

/**
 * Checks if a user has admin or co-admin access.
 */
export function hasAdminOrCoAdminAccess(rawRole: string | null | undefined): boolean {
  return isSystemAdminRole(rawRole) || isCoAdminRole(rawRole);
}

/**
 * Parses raw role string into an array of individual roles.
 */
export function parseMemberRoles(rawRole: string | null | undefined): string[] {
  if (!rawRole) return ["Member"];
  const trimmed = rawRole.trim();
  const lower = trimmed.toLowerCase();

  if (lower === "user" || lower === "member" || lower === "normal member") {
    return ["Member"];
  }

  const hasAdmin = isSystemAdminRole(trimmed);
  const hasCoAdmin = !hasAdmin && isCoAdminRole(trimmed);

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const valid = parsed
        .map((r) => String(r).trim())
        .filter(
          (r) =>
            r.length > 0 &&
            r.toLowerCase() !== "admin" &&
            r.toLowerCase() !== "co-admin" &&
            r.toLowerCase() !== "co_admin" &&
            r.toLowerCase() !== "coadmin"
        );

      if (hasAdmin) return ["Admin", ...valid];
      if (hasCoAdmin) return ["Co-Admin", ...valid];
      return valid.length > 0 ? valid : ["Member"];
    }
  } catch {}

  const split = trimmed
    .split(",")
    .map((r) => r.trim())
    .filter(
      (r) =>
        r.length > 0 &&
        r.toLowerCase() !== "admin" &&
        r.toLowerCase() !== "co-admin" &&
        r.toLowerCase() !== "co_admin" &&
        r.toLowerCase() !== "coadmin"
    );

  if (hasAdmin) return ["Admin", ...split];
  if (hasCoAdmin) return ["Co-Admin", ...split];
  return split.length > 0 ? split : ["Member"];
}
