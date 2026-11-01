"use client";

import { useIsAdmin } from "@/hooks/use-admin";
import { Loader2, ShieldXIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface AdminProtectedProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showAccessDenied?: boolean;
}

export function AdminProtected({ 
  children, 
  fallback, 
  showAccessDenied = true 
}: AdminProtectedProps) {
  const { isAdmin, isLoading } = useIsAdmin();

  if (isLoading) {
    return fallback || (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    if (!showAccessDenied) {
      return fallback || null;
    }

    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <ShieldXIcon className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="mt-4 text-xl font-semibold text-gray-900">
            Access Denied
          </CardTitle>
          <CardDescription className="mt-2 text-sm text-gray-600">
            You need administrator privileges to view this content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/login">
              Login as Administrator
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}