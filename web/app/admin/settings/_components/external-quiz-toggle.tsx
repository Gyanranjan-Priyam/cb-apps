"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { updateExternalQuizSetting } from "../actions";
import { Monitor, Zap, PowerOff } from "lucide-react";

interface ExternalQuizToggleProps {
  initialValue: boolean;
}

export function ExternalQuizToggle({ initialValue }: ExternalQuizToggleProps) {
  const [isEnabled, setIsEnabled] = useState(initialValue);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (checked: boolean) => {
    setIsEnabled(checked);

    startTransition(async () => {
      try {
        const result = await updateExternalQuizSetting(checked);

        if (result.status === "success") {
          toast.success(
            checked
              ? "External Quiz System & Socket.IO services activated successfully"
              : "External Quiz System deactivated. Kiosks and socket connections are now offline"
          );
        } else {
          toast.error(result.message || "Failed to update external quiz setting");
          setIsEnabled(initialValue);
        }
      } catch {
        toast.error("Failed to update external quiz setting");
        setIsEnabled(initialValue);
      }
    });
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-1 min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Label htmlFor="external-quiz-toggle" className="font-medium flex items-center gap-1.5 text-sm sm:text-base">
            <Monitor className="h-4 w-4 text-primary" />
            External Quiz System &amp; Real-Time Sockets
          </Label>
          <Badge
            variant={isEnabled ? "default" : "outline"}
            className={`text-[11px] font-semibold py-0.5 px-2 ${
              isEnabled
                ? "bg-emerald-600 text-white"
                : "border-muted-foreground/40 text-muted-foreground"
            }`}
          >
            {isEnabled ? (
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3 animate-pulse" />
                Active &amp; Running
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <PowerOff className="h-3 w-3" />
                Deactivated / Offline
              </span>
            )}
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {isEnabled
            ? "External Quiz kiosk registration, exam rooms, and live Socket.IO monitor feeds are active."
            : "External Quiz kiosk portal and Socket.IO listeners are shut down to save resources and prevent unauthorized access."}
        </p>
      </div>
      <Switch
        id="external-quiz-toggle"
        checked={isEnabled}
        onCheckedChange={handleToggle}
        disabled={isPending}
        className="shrink-0"
      />
    </div>
  );
}
