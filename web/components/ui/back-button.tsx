"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface BackButtonProps {
  fallbackUrl?: string;
  label?: string;
  variant?: "default" | "ghost" | "outline" | "secondary" | "destructive" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function BackButton({ 
  fallbackUrl = "/", 
  label = "Back", 
  variant = "ghost",
  size = "sm",
  className 
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    // Try to go back in browser history
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      // Fallback to a specific URL if no history
      router.push(fallbackUrl);
    }
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleBack}
      className={`flex items-center gap-2 ${className || ""}`}
    >
      <ChevronLeft className="w-4 h-4" />
      {label}
    </Button>
  );
}