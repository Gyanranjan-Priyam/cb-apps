/**
 * User Agent Parser Utility
 * Extracts readable browser, operating system, and device type from User-Agent string.
 */

export interface ParsedDeviceInfo {
  browser: string;
  os: string;
  deviceType: "desktop" | "mobile" | "tablet" | "unknown";
  raw: string;
}

export function parseUserAgent(userAgent?: string | null): ParsedDeviceInfo {
  if (!userAgent || typeof userAgent !== "string") {
    return {
      browser: "Unknown Browser",
      os: "Unknown OS",
      deviceType: "desktop",
      raw: "Unknown",
    };
  }

  const ua = userAgent;

  // 1. Device Type
  let deviceType: "desktop" | "mobile" | "tablet" | "unknown" = "desktop";
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    deviceType = "tablet";
  } else if (
    /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(
      ua
    )
  ) {
    deviceType = "mobile";
  }

  // 2. Operating System
  let os = "Unknown OS";
  if (/windows nt 10\.0/i.test(ua)) {
    os = "Windows 10/11";
  } else if (/windows nt 6\.3/i.test(ua)) {
    os = "Windows 8.1";
  } else if (/windows nt 6\.2/i.test(ua)) {
    os = "Windows 8";
  } else if (/windows nt 6\.1/i.test(ua)) {
    os = "Windows 7";
  } else if (/windows/i.test(ua)) {
    os = "Windows";
  } else if (/iphone os ([0-9_]+)/i.test(ua)) {
    const match = ua.match(/iphone os ([0-9_]+)/i);
    os = match ? `iOS ${match[1].replace(/_/g, ".")}` : "iOS";
  } else if (/ipad.*os ([0-9_]+)/i.test(ua)) {
    const match = ua.match(/os ([0-9_]+)/i);
    os = match ? `iPadOS ${match[1].replace(/_/g, ".")}` : "iPadOS";
  } else if (/macintosh|mac os x ([0-9_]+)/i.test(ua)) {
    const match = ua.match(/mac os x ([0-9_]+)/i);
    os = match ? `macOS ${match[1].replace(/_/g, ".")}` : "macOS";
  } else if (/android ([0-9.]+)/i.test(ua)) {
    const match = ua.match(/android ([0-9.]+)/i);
    os = match ? `Android ${match[1]}` : "Android";
  } else if (/cros/i.test(ua)) {
    os = "ChromeOS";
  } else if (/ubuntu/i.test(ua)) {
    os = "Ubuntu Linux";
  } else if (/linux/i.test(ua)) {
    os = "Linux";
  }

  // 3. Browser
  let browser = "Web Browser";
  if (/edg\/([0-9.]+)/i.test(ua)) {
    const match = ua.match(/edg\/([0-9.]+)/i);
    browser = match ? `Edge ${match[1].split(".")[0]}` : "Microsoft Edge";
  } else if (/opr\/([0-9.]+)/i.test(ua) || /opera\/([0-9.]+)/i.test(ua)) {
    browser = "Opera";
  } else if (/chrome\/([0-9.]+)/i.test(ua) && !/edg/i.test(ua)) {
    const match = ua.match(/chrome\/([0-9.]+)/i);
    browser = match ? `Chrome ${match[1].split(".")[0]}` : "Google Chrome";
  } else if (/firefox\/([0-9.]+)/i.test(ua)) {
    const match = ua.match(/firefox\/([0-9.]+)/i);
    browser = match ? `Firefox ${match[1].split(".")[0]}` : "Mozilla Firefox";
  } else if (/version\/([0-9.]+).*safari/i.test(ua)) {
    const match = ua.match(/version\/([0-9.]+).*safari/i);
    browser = match ? `Safari ${match[1].split(".")[0]}` : "Apple Safari";
  } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
    browser = "Safari";
  } else if (/postman/i.test(ua)) {
    browser = "Postman Runtime";
  }

  return {
    browser,
    os,
    deviceType,
    raw: userAgent,
  };
}
