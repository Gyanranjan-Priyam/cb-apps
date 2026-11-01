"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SilentRefreshButtonProps {
  onRefresh?: () => Promise<void> | void;
  className?: string;
  variant?: "outline" | "ghost" | "default" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
  label?: string;
  toastMessage?: string;
}

export function SilentRefreshButton({
  onRefresh,
  className,
  variant = "outline",
  size = "icon",
  showLabel = false,
  label = "Refresh",
  toastMessage = "Refreshed data silently",
}: SilentRefreshButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        if (onRefresh) {
          await onRefresh();
        } else {
          router.refresh();
        }
        toast.success(toastMessage, {
          duration: 1500,
        });
      } catch {
        toast.error("Failed to refresh data");
      }
    });
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleRefresh}
      disabled={isPending}
      className={cn(
        "cursor-pointer text-muted-foreground hover:text-foreground transition-all",
        size === "icon" ? "h-9 w-9 shrink-0" : "h-9 text-xs gap-1.5",
        className
      )}
      title="Silent Refresh (Refresh without reloading the page)"
    >
      <RotateCw
        className={cn(
          "size-4 shrink-0 transition-transform",
          isPending && "animate-spin text-primary"
        )}
      />
      {showLabel && <span>{isPending ? "Refreshing..." : label}</span>}
    </Button>
  );
}
