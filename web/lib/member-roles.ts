/**
 * CodeBreakers Member Roles Definition & Helper Utilities
 *
 * Rules:
 * 1. System Roles: Admin, Co-Admin
 * 2. Club Roles: Secretary, Assistant Secretary, Treasurer, Management Lead,
 *    Management Co-Lead, Management Team Member, Technical Lead, Tech Co-Lead,
 *    Tech Member, Event Coordinator, Event Co-Coordinator, Social Media Lead, Member
 * 3. Each member can have max 4 club roles assigned.
 * 4. System Admins and Co-Admins permanently retain their system status.
 */

export const SYSTEM_ROLE_ADMIN = "admin";
export const SYSTEM_ROLE_CO_ADMIN = "co-admin";

export const ASSIGNABLE_ROLES = [
  "Co-Admin",
  "Secretary",
  "Assistant Secretary",
  "Treasurer",
  "Technical Lead",
  "Tech Co-Lead",
  "Tech Member",
  "Management Lead",
  "Management Co-Lead",
  "Management Team Member",
  "Event Coordinator",
  "Event Co-Coordinator",
  "Social Media Lead",
  "Member",
] as const;

export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export const MAX_MEMBER_ROLES = 4;

/**
 * Checks if a raw role string indicates a full system administrator.
 */
export function isSystemAdminRole(rawRole: string | null | undefined): boolean {
  if (!rawRole) return false;
  const lower = rawRole.toLowerCase();
  if (lower === "admin") return true;
  return lower.split(",").some((part) => part.trim() === "admin");
}

/**
 * Checks if a raw role string indicates a co-admin.
 */
export function isCoAdminRole(rawRole: string | null | undefined): boolean {
  if (!rawRole) return false;
  const lower = rawRole.toLowerCase();
  if (lower === "co-admin" || lower === "co_admin" || lower === "coadmin") return true;
  return lower
    .split(",")
    .some((part) => {
      const p = part.trim();
      return p === "co-admin" || p === "co_admin" || p === "coadmin";
    });
}

/**
 * Checks if a user has full admin OR co-admin access.
 */
export function hasAdminOrCoAdminAccess(rawRole: string | null | undefined): boolean {
  return isSystemAdminRole(rawRole) || isCoAdminRole(rawRole);
}

/**
 * Parses raw role string from DB into an array of individual role strings.
 * If user is an admin or co-admin, that title is placed first.
 */
export function parseMemberRoles(rawRole: string | null | undefined): string[] {
  if (!rawRole) return ["Member"];
  const trimmed = rawRole.trim();
  const lower = trimmed.toLowerCase();

  if (lower === "user" || lower === "member" || lower === "normal member") {
    return ["Member"];
  }

  // Check if system admin or co-admin
  const hasAdmin = isSystemAdminRole(trimmed);
  const hasCoAdmin = !hasAdmin && isCoAdminRole(trimmed);

  // Support JSON array string
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

      if (hasAdmin) {
        return ["Admin", ...valid];
      }
      if (hasCoAdmin) {
        return ["Co-Admin", ...valid];
      }
      return valid.length > 0 ? valid : ["Member"];
    }
  } catch {
    // Not JSON
  }

  // Support comma-separated string
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

  if (hasAdmin) {
    return ["Admin", ...split];
  }
  if (hasCoAdmin) {
    return ["Co-Admin", ...split];
  }

  if (split.length === 0) {
    return ["Member"];
  }

  return split;
}

/**
 * Serializes an array of roles into a comma-separated string for DB storage.
 */
export function serializeMemberRoles(
  roles: string[],
  isSystemAdmin = false,
  isCoAdmin = false
): string {
  const cleanClubRoles = roles
    .map((r) => r.trim())
    .filter(
      (r) =>
        r.toLowerCase() !== "admin" &&
        r.toLowerCase() !== "co-admin" &&
        r.toLowerCase() !== "co_admin" &&
        r.toLowerCase() !== "coadmin" &&
        r.toLowerCase() !== "member" &&
        r.toLowerCase() !== "normal member" &&
        r.length > 0
    )
    .slice(0, MAX_MEMBER_ROLES);

  if (isSystemAdmin) {
    if (cleanClubRoles.length > 0) {
      return `admin, ${cleanClubRoles.join(", ")}`;
    }
    return "admin";
  }

  if (isCoAdmin) {
    if (cleanClubRoles.length > 0) {
      return `co-admin, ${cleanClubRoles.join(", ")}`;
    }
    return "co-admin";
  }

  if (cleanClubRoles.length === 0) {
    return "Member";
  }

  return cleanClubRoles.join(", ");
}

/**
 * Returns distinct themed badge colors for each role.
 */
export function getRoleBadgeClasses(role: string): {
  badgeClass: string;
} {
  const r = role.toLowerCase().trim();

  if (r === "admin") {
    return {
      badgeClass: "bg-purple-600 hover:bg-purple-700 text-white border-none shadow-xs font-semibold",
    };
  }
  if (r === "co-admin" || r === "co_admin" || r === "coadmin") {
    return {
      badgeClass:
        "bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-xs font-semibold",
    };
  }
  if (r.includes("secretary") || r.includes("sacratary")) {
    return {
      badgeClass:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20",
    };
  }
  if (r.includes("treasurer") || r.includes("tressurer")) {
    return {
      badgeClass:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20",
    };
  }
  if (r.includes("tech") || r.includes("technical")) {
    return {
      badgeClass:
        "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20",
    };
  }
  if (r.includes("management")) {
    return {
      badgeClass:
        "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30 hover:bg-teal-500/20",
    };
  }
  if (r.includes("event") || r.includes("coordinator")) {
    return {
      badgeClass:
        "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20",
    };
  }
  if (r.includes("social")) {
    return {
      badgeClass:
        "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30 hover:bg-pink-500/20",
    };
  }
  return {
    badgeClass:
      "bg-muted text-muted-foreground border-border hover:bg-muted/80",
  };
}

