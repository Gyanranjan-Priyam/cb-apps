"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface PageBackButtonProps {
  fallbackUrl?: string;
  label?: string;
  showIcon?: boolean;
  iconType?: "chevron" | "arrow";
  variant?: "default" | "ghost" | "outline" | "secondary" | "destructive" | "link";
  size?: "default" | "sm" | "lg";
  className?: string;
  onClick?: () => void;
}

export function PageBackButton({ 
  fallbackUrl = "/dashboard", 
  label = "Go Back", 
  showIcon = true,
  iconType = "chevron",
  variant = "outline",
  size = "default",
  className,
  onClick 
}: PageBackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onClick) {
      onClick();
      return;
    }

    // Try to go back in browser history
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      // Fallback to a specific URL if no history
      router.push(fallbackUrl);
    }
  };

  const Icon = iconType === "arrow" ? ArrowLeft : ChevronLeft;

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleBack}
      className={`inline-flex items-center gap-2 ${className || ""}`}
    >
      {showIcon && <Icon className="w-4 h-4" />}
      {label}
    </Button>
  );
}