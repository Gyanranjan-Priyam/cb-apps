import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { authClient, AuthUser, AuthSession } from "@/lib/auth-client";
import { API_BASE_URL } from "@/lib/api-config";

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  sendOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  signInSocial: (provider: "google" | "github" | "apple" | "discord") => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateUser: (updatedFields: Partial<AuthUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshSession = useCallback(async () => {
    try {
      const sess = await authClient.getSession();
      if (sess && sess.user) {
        setUser(sess.user);
        setSession(sess);
      } else {
        setUser(null);
        setSession(null);
      }
    } catch {
      setUser(null);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const sendOtp = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const res = await authClient.sendEmailOtp(email);
    if (res.error) {
      return { success: false, error: res.error.message };
    }
    return { success: true };
  };

  const verifyOtp = async (
    email: string,
    otp: string
  ): Promise<{ success: boolean; error?: string; user?: AuthUser }> => {
    const res = await authClient.verifyEmailOtp(email, otp);
    if (res.error || !res.data) {
      return { success: false, error: res.error?.message || "Verification failed" };
    }

    setUser(res.data.user);
    if (res.data.session) {
      setSession(res.data.session);
    }
    return { success: true, user: res.data.user };
  };

  const signInSocial = async (
    provider: "google" | "github" | "apple" | "discord"
  ): Promise<{ success: boolean; error?: string }> => {
    if (provider !== "google" && provider !== "github") {
      return { success: false, error: `${provider} is not supported.` };
    }

    const res = await authClient.signInSocial(provider);
    if (res.error || !res.data) {
      return {
        success: false,
        error: res.error?.message || "Social sign-in failed",
      };
    }

    setUser(res.data.user);
    if (res.data.session) {
      setSession(res.data.session);
    }
    return { success: true };
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await authClient.signOut();
      setUser(null);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = useCallback(async (updatedFields: Partial<AuthUser>) => {
    const updated = await authClient.updateLocalUser(updatedFields);
    if (updated) {
      setUser(updated);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        sendOtp,
        verifyOtp,
        signInSocial,
        signOut,
        refreshSession,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
