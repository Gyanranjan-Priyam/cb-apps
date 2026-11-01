/**
 * Device & User-Agent Parsing Utility
 * Extracts readable browser, operating system, and device type from User-Agent strings.
 */

export interface ParsedDeviceInfo {
  browser: string;
  os: string;
  deviceType: "desktop" | "mobile" | "tablet" | "unknown";
  displayName: string;
}

export function parseUserAgent(userAgent?: string | null): ParsedDeviceInfo {
  if (!userAgent || typeof userAgent !== "string") {
    return {
      browser: "Unknown Browser",
      os: "Unknown Device",
      deviceType: "unknown",
      displayName: "Unknown Device",
    };
  }

  const ua = userAgent.toLowerCase();

  // 1. Detect Operating System
  let os = "Unknown OS";
  if (ua.includes("windows nt 10.0")) os = "Windows 10/11";
  else if (ua.includes("windows nt 6.3")) os = "Windows 8.1";
  else if (ua.includes("windows nt 6.2")) os = "Windows 8";
  else if (ua.includes("windows nt 6.1")) os = "Windows 7";
  else if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("android")) {
    const match = userAgent.match(/Android\s+([\d.]+)/i);
    os = match ? `Android ${match[1]}` : "Android";
  } else if (ua.includes("iphone")) {
    const match = userAgent.match(/OS\s+([\d_]+)/i);
    os = match ? `iOS ${match[1].replace(/_/g, ".")}` : "iOS (iPhone)";
  } else if (ua.includes("ipad")) {
    const match = userAgent.match(/OS\s+([\d_]+)/i);
    os = match ? `iPadOS ${match[1].replace(/_/g, ".")}` : "iPadOS (iPad)";
  } else if (ua.includes("macintosh") || ua.includes("mac os x")) {
    os = "macOS";
  } else if (ua.includes("cros")) {
    os = "ChromeOS";
  } else if (ua.includes("linux")) {
    os = "Linux";
  }

  // 2. Detect Browser
  let browser = "Web Browser";
  if (ua.includes("edg/") || ua.includes("edge/")) browser = "Microsoft Edge";
  else if (ua.includes("opr/") || ua.includes("opera/")) browser = "Opera";
  else if (ua.includes("brave")) browser = "Brave";
  else if (ua.includes("chrome") && !ua.includes("chromium") && !ua.includes("edg/")) browser = "Google Chrome";
  else if (ua.includes("firefox")) browser = "Mozilla Firefox";
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Apple Safari";
  else if (ua.includes("postman")) browser = "Postman";

  // 3. Detect Device Type
  let deviceType: "desktop" | "mobile" | "tablet" | "unknown" = "desktop";
  if (ua.includes("ipad") || (ua.includes("tablet") && !ua.includes("mobile"))) {
    deviceType = "tablet";
  } else if (ua.includes("mobile") || ua.includes("iphone") || (ua.includes("android") && !ua.includes("tablet"))) {
    deviceType = "mobile";
  }

  return {
    browser,
    os,
    deviceType,
    displayName: `${browser} on ${os}`,
  };
}
