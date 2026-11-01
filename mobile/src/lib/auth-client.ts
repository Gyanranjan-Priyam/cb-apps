import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { API_BASE_URL } from "./api-config";

const TOKEN_KEY = "cb_auth_session_token";
const COOKIE_KEY = "cb_auth_cookies";
const USER_KEY = "cb_auth_user";
const SESSION_KEY = "cb_auth_session";

// Web storage fallback for Expo Web testing
const webStorage = {
  async getItem(key: string): Promise<string | null> {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  },
  async setItem(key: string, value: string): Promise<void> {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  },
  async removeItem(key: string): Promise<void> {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  },
};

async function getStored(key: string): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return await webStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function setStored(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      await webStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch (e) {
    console.warn(`Failed to store auth key ${key}:`, e);
  }
}

async function removeStored(key: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      await webStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (e) {
    console.warn(`Failed to remove auth key ${key}:`, e);
  }
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string | null;
  image?: string | null;
  profileImageKey?: string | null;
  emailVerified?: boolean;
}

export interface AuthSession {
  user: AuthUser;
  token?: string;
  expiresAt?: string;
  id?: string;
}

export interface AuthResponse<T = unknown> {
  data?: T;
  error?: {
    message: string;
    code?: string;
    status?: number;
  };
}

/**
 * Mobile Better Auth API Client with Persistent Session Storage
 */
export const authClient = {
  /**
   * Check if a member is authorized in the database before sending OTP
   */
  async checkMemberPermission(email: string): Promise<{
    allowed: boolean;
    reason?: string;
    message?: string;
    user?: Partial<AuthUser>;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/check-permission`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: API_BASE_URL,
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await response.json();
      return data;
    } catch {
      // Fallback allowing standard better auth flow to proceed
      return { allowed: true };
    }
  },

  /**
   * Send 6-digit OTP to user's registered email via Better Auth
   */
  async sendEmailOtp(email: string): Promise<AuthResponse<{ success: boolean }>> {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Pre-check member registration permission
    const check = await this.checkMemberPermission(normalizedEmail);
    if (!check.allowed) {
      return {
        error: {
          message: check.message || "Unauthorized: Email is not registered as a member.",
        },
      };
    }

    // 2. Call Better Auth email-otp endpoint
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/email-otp/send-verification-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: API_BASE_URL,
        },
        body: JSON.stringify({
          email: normalizedEmail,
          type: "sign-in",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return {
          error: {
            message:
              errorData.message ||
              errorData.error ||
              "Failed to send verification code. Please check your email.",
            status: res.status,
          },
        };
      }

      const data = await res.json().catch(() => ({ success: true }));
      return { data };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Network error. Please check your internet connection.";
      return {
        error: { message: msg },
      };
    }
  },

  /**
   * Verify 6-digit OTP with Better Auth and persistently store session
   */
  async verifyEmailOtp(
    email: string,
    otp: string
  ): Promise<AuthResponse<{ user: AuthUser; session?: AuthSession }>> {
    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/sign-in/email-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: API_BASE_URL,
        },
        body: JSON.stringify({
          email: normalizedEmail,
          otp: cleanOtp,
        }),
      });

      // Extract cookies if sent
      const rawCookies = res.headers.get("set-cookie");
      if (rawCookies) {
        await setStored(COOKIE_KEY, rawCookies);
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return {
          error: {
            message:
              errorData.message ||
              errorData.error ||
              "Invalid verification code. Please check and try again.",
            status: res.status,
          },
        };
      }

      const data = await res.json();

      // Normalize user and session objects
      const resolvedUser: AuthUser =
        data?.user ||
        data?.session?.user || {
          id: data?.id || "cb-user",
          email: normalizedEmail,
          name: data?.name || normalizedEmail.split("@")[0],
          role: data?.role || "member",
        };

      const token = data?.token || data?.session?.token || data?.sessionToken;
      const resolvedSession: AuthSession = {
        user: resolvedUser,
        token: token,
        id: data?.session?.id,
        expiresAt: data?.session?.expiresAt,
      };

      // Persistently store user and session
      await setStored(USER_KEY, JSON.stringify(resolvedUser));
      await setStored(SESSION_KEY, JSON.stringify(resolvedSession));
      if (token) {
        await setStored(TOKEN_KEY, token);
      }

      return {
        data: {
          user: resolvedUser,
          session: resolvedSession,
        },
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Network connection failed. Please try again.";
      return {
        error: { message: msg },
      };
    }
  },

  /**
   * Retrieve current authenticated session from persistent storage & verify with backend
   */
  async getSession(): Promise<AuthSession | null> {
    try {
      // 1. Read locally persisted session and user
      const storedUserJson = await getStored(USER_KEY);
      const storedSessionJson = await getStored(SESSION_KEY);
      const token = await getStored(TOKEN_KEY);
      const cookies = await getStored(COOKIE_KEY);

      let localSession: AuthSession | null = null;
      if (storedUserJson) {
        const parsedUser = JSON.parse(storedUserJson);
        localSession = storedSessionJson
          ? JSON.parse(storedSessionJson)
          : { user: parsedUser, token: token || undefined };
      }

      // If no local session found at all, user is not logged in
      if (!localSession && !token && !cookies) {
        return null;
      }

      // 2. Try validating with backend if available
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Origin: API_BASE_URL,
        };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        if (cookies) headers["Cookie"] = cookies;

        const res = await fetch(`${API_BASE_URL}/api/auth/get-session`, {
          method: "GET",
          headers,
        });

        if (res.ok) {
          const data = await res.json();
          if (data && (data.user || data.session)) {
            const serverUser: AuthUser = data.user || data.session?.user;
            const updatedSession: AuthSession = {
              user: serverUser,
              token: token || undefined,
              ...data.session,
            };
            await setStored(USER_KEY, JSON.stringify(serverUser));
            await setStored(SESSION_KEY, JSON.stringify(updatedSession));
            return updatedSession;
          }
        }
      } catch {
        // Backend temporarily unreachable (e.g. offline) -> keep using persisted local session
      }

      return localSession;
    } catch {
      return null;
    }
  },

  /**
   * Social Sign In (Google, GitHub) via WebBrowser and Better Auth callback
   */
  async signInSocial(
    provider: "google" | "github"
  ): Promise<AuthResponse<{ user: AuthUser; session?: AuthSession }>> {
    try {
      const WebBrowser = await import("expo-web-browser");
      const Linking = await import("expo-linking");
      WebBrowser.maybeCompleteAuthSession();

      const redirectUri = Linking.createURL("auth-callback");

      // Directly open browser to our social-login route which immediately redirects to Google/GitHub
      const authUrl = `${API_BASE_URL}/api/auth/social-login?provider=${provider}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === "success" && result.url) {
        // Parse tokens and user info from callback redirect URL
        const parsedUrl = new URL(result.url);
        const errorParam = parsedUrl.searchParams.get("error");

        if (errorParam === "unauthorized") {
          return {
            error: {
              message:
                "Unauthorized Access: Your email is not registered as a member. Please contact an admin.",
            },
          };
        } else if (errorParam) {
          return {
            error: { message: `Authentication error: ${errorParam}` },
          };
        }

        const token = parsedUrl.searchParams.get("token") || "";
        const email = decodeURIComponent(parsedUrl.searchParams.get("email") || "");
        const name = decodeURIComponent(parsedUrl.searchParams.get("name") || "");
        const role = decodeURIComponent(parsedUrl.searchParams.get("role") || "member");
        const userId = decodeURIComponent(parsedUrl.searchParams.get("userId") || "");

        if (email) {
          const user: AuthUser = {
            id: userId || "cb-user",
            email,
            name: name || email.split("@")[0],
            role,
          };

          const session: AuthSession = {
            user,
            token,
          };

          await setStored(USER_KEY, JSON.stringify(user));
          await setStored(SESSION_KEY, JSON.stringify(session));
          if (token) {
            await setStored(TOKEN_KEY, token);
          }

          return { data: { user, session } };
        }
      }

      if (result.type === "cancel" || result.type === "dismiss") {
        return { error: { message: "Authentication cancelled." } };
      }

      return { error: { message: "Social authentication did not complete." } };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Social authentication failed.";
      return { error: { message: msg } };
    }
  },

  /**
   * Update locally stored user data (e.g. after profile or avatar update)
   */
  async updateLocalUser(updatedFields: Partial<AuthUser>): Promise<AuthUser | null> {
    try {
      const storedUserJson = await getStored(USER_KEY);
      const currentUser: AuthUser = storedUserJson ? JSON.parse(storedUserJson) : { id: "cb-user", email: "" };
      const mergedUser: AuthUser = { ...currentUser, ...updatedFields };

      await setStored(USER_KEY, JSON.stringify(mergedUser));

      const storedSessionJson = await getStored(SESSION_KEY);
      if (storedSessionJson) {
        const parsedSession: AuthSession = JSON.parse(storedSessionJson);
        parsedSession.user = mergedUser;
        await setStored(SESSION_KEY, JSON.stringify(parsedSession));
      }

      return mergedUser;
    } catch {
      return null;
    }
  },

  /**
   * Sign out current user and clear stored credentials completely
   */
  async signOut(): Promise<void> {
    try {
      const token = await getStored(TOKEN_KEY);
      const cookies = await getStored(COOKIE_KEY);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Origin: API_BASE_URL,
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      if (cookies) headers["Cookie"] = cookies;

      await fetch(`${API_BASE_URL}/api/auth/sign-out`, {
        method: "POST",
        headers,
      }).catch(() => {});
    } finally {
      await removeStored(TOKEN_KEY);
      await removeStored(COOKIE_KEY);
      await removeStored(USER_KEY);
      await removeStored(SESSION_KEY);
    }
  },
};
