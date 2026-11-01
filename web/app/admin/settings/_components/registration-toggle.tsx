"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateRegistrationSetting } from "../actions";

interface RegistrationToggleProps {
  initialValue: boolean;
}

export function RegistrationToggle({ initialValue }: RegistrationToggleProps) {
  const [isEnabled, setIsEnabled] = useState(initialValue);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (checked: boolean) => {
    setIsEnabled(checked);
    
    startTransition(async () => {
      try {
        const result = await updateRegistrationSetting(checked);
        
        if (result.status === "success") {
          toast.success(
            checked 
              ? "Registration enabled successfully" 
              : "Registration disabled successfully"
          );
        } else {
          toast.error(result.message || "Failed to update registration setting");
          // Revert the toggle if update failed
          setIsEnabled(initialValue);
        }
      } catch (error) {
        toast.error("Failed to update registration setting");
        // Revert the toggle if update failed
        setIsEnabled(initialValue);
      }
    });
  };

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label htmlFor="registration-toggle" className="font-medium">
          Enable User Registration
        </Label>
        <p className="text-sm text-muted-foreground">
          {isEnabled 
            ? "Users can access the registration page to sign up for events" 
            : "Registration is disabled - users will see a thank you message instead"
          }
        </p>
      </div>
      <Switch
        id="registration-toggle"
        checked={isEnabled}
        onCheckedChange={handleToggle}
        disabled={isPending}
      />
    </div>
  );
}