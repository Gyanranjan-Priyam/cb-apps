import { API_BASE_URL } from "./api-config";

/**
 * Resolves the display avatar URL for a user across the entire mobile application.
 * Priority:
 * 1. Custom uploaded profileImageKey (from S3/T3 storage or full URL)
 * 2. OAuth/Google avatar URL (user.image or user.avatar)
 * 3. Base64 data URI (data:image/...)
 * 4. null / fallback
 */
export function getUserProfileImageUrl(user?: {
  profileImageKey?: string | null;
  image?: string | null;
  avatar?: string | null;
} | null): string | null {
  if (!user) return null;

  // 1. Profile image key
  if (user.profileImageKey && typeof user.profileImageKey === "string" && user.profileImageKey.trim()) {
    const key = user.profileImageKey.trim();
    if (key.startsWith("http://") || key.startsWith("https://") || key.startsWith("data:image/")) {
      return key;
    }
    // Cloud storage / T3 endpoint
    return `https://codebreakers.t3.storage.dev/${key}`;
  }

  // 2. Direct image or avatar URL
  const rawImage = user.image || user.avatar;
  if (
    rawImage &&
    typeof rawImage === "string" &&
    rawImage !== "undefined" &&
    rawImage !== "null" &&
    rawImage !== "/default-avatar.png" &&
    rawImage.trim() !== ""
  ) {
    const trimmed = rawImage.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:image/")) {
      return trimmed;
    }
    // Relative path hosted on web backend
    return `${API_BASE_URL}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
  }

  return null;
}
