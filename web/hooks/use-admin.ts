"use client";

import { useEffect, useState } from "react";
import { isSystemAdminRole } from "@/lib/member-roles";

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface Session {
  user: User;
}

export function useIsAdmin() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Fetch session from API
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        setSession(data.session || null);
        setIsLoading(false);
      })
      .catch(() => {
        setSession(null);
        setIsLoading(false);
      });
  }, []);
  
  const isAdmin = isSystemAdminRole(session?.user?.role);
  
  return {
    isAdmin,
    isLoading,
    user: session?.user || null
  };
}

export function useRequireAdmin() {
  const { isAdmin, isLoading, user } = useIsAdmin();
  
  if (isLoading) {
    return { isLoading: true, isAdmin: false, user: null };
  }
  
  if (!isAdmin) {
    // You could redirect here or throw an error
    throw new Error('Admin access required');
  }
  
  return { isLoading: false, isAdmin: true, user };
}