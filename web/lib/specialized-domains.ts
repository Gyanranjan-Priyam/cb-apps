/**
 * CodeBreakers Specialized Domains Definition & Helpers
 */

export const PREDEFINED_DOMAINS = [
  "Web Development",
  "Frontend Development",
  "Backend Development",
  "Full Stack Development",
  "AI & Machine Learning",
  "Data Science & Analytics",
  "Cloud Computing & DevOps",
  "Cybersecurity",
  "Mobile App Development",
  "Competitive Programming",
  "Blockchain & Web3",
  "UI/UX Design",
  "Embedded Systems & IoT",
  "Game Development",
  "Robotics & Automation",
] as const;

export type PredefinedDomain = (typeof PREDEFINED_DOMAINS)[number];

/**
 * Parse specialized domains string into an array of trimmed unique domain names.
 * Supports comma-separated values, JSON arrays, or single values.
 */
export function parseSpecializedDomains(domain: string | null | undefined): string[] {
  if (!domain || !domain.trim()) return [];
  const raw = domain.trim();

  if (raw.startsWith("[") && raw.endsWith("]")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .map((d) => (typeof d === "string" ? d.trim() : ""))
          .filter(Boolean);
      }
    } catch {
      // Fallback to comma splitting
    }
  }

  return raw
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
}

/**
 * Serialize an array of domains into a clean comma-separated string
 */
export function serializeSpecializedDomains(domains: string[]): string | null {
  const unique = Array.from(
    new Set(domains.map((d) => d.trim()).filter(Boolean))
  );
  return unique.length > 0 ? unique.join(", ") : null;
}

export function getDomainBadgeClasses(domain: string | null | undefined): {
  badgeClass: string;
} {
  if (!domain) {
    return {
      badgeClass: "bg-muted text-muted-foreground border-border",
    };
  }

  const d = domain.toLowerCase();

  if (d.includes("ai") || d.includes("machine") || d.includes("data") || d.includes("ml")) {
    return {
      badgeClass:
        "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20",
    };
  }
  if (d.includes("web") || d.includes("frontend") || d.includes("backend") || d.includes("full stack") || d.includes("react") || d.includes("next")) {
    return {
      badgeClass:
        "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20",
    };
  }
  if (d.includes("cyber") || d.includes("security") || d.includes("ethical")) {
    return {
      badgeClass:
        "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/20",
    };
  }
  if (d.includes("cloud") || d.includes("devops") || d.includes("aws") || d.includes("docker")) {
    return {
      badgeClass:
        "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 hover:bg-sky-500/20",
    };
  }
  if (d.includes("mobile") || d.includes("app") || d.includes("android") || d.includes("flutter") || d.includes("ios")) {
    return {
      badgeClass:
        "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30 hover:bg-violet-500/20",
    };
  }
  if (d.includes("competitive") || d.includes("programming") || d.includes("dsa") || d.includes("cpp")) {
    return {
      badgeClass:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20",
    };
  }
  if (d.includes("design") || d.includes("ui") || d.includes("ux") || d.includes("figma")) {
    return {
      badgeClass:
        "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30 hover:bg-pink-500/20",
    };
  }
  if (d.includes("blockchain") || d.includes("web3") || d.includes("crypto") || d.includes("solidity")) {
    return {
      badgeClass:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20",
    };
  }
  if (d.includes("iot") || d.includes("embedded") || d.includes("robotics") || d.includes("hardware")) {
    return {
      badgeClass:
        "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30 hover:bg-teal-500/20",
    };
  }

  return {
    badgeClass:
      "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20",
  };
}
