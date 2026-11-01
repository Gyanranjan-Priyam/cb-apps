"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface CloseWindowButtonProps {
  children: React.ReactNode;
  variant?: "default" | "outline" | "destructive" | "secondary" | "ghost" | "link";
  className?: string;
  redirectTo?: string;
  size?: "default" | "sm" | "lg" | "icon";
}

export function CloseWindowButton({ 
  children, 
  variant = "outline", 
  className = "",
  redirectTo,
  size = "default"
}: CloseWindowButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    // Check if opened in a popup window
    if (window.opener && !window.opener.closed) {
      // If redirectTo is provided, navigate parent window before closing
      if (redirectTo) {
        window.opener.location.href = redirectTo;
      }
      // Close the popup window
      window.close();
    } else {
      // If not in popup, navigate normally
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.back();
      }
    }
  };

  return (
    <Button onClick={handleClick} variant={variant} size={size} className={className}>
      {children}
    </Button>
  );
}
