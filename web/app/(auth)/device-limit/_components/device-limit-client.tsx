"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Laptop,
  Smartphone,
  Tablet,
  Monitor,
  ShieldAlert,
  LogOut,
  ArrowRight,
  Loader2,
  Globe,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { revokeSessionAndProceed } from "@/app/(public)/dashboard/settings/actions";
import { format } from "date-fns";
import { ParsedDeviceInfo } from "@/lib/device-parser";

interface DeviceSessionInfo {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
  deviceInfo: ParsedDeviceInfo;
}

interface DeviceLimitClientProps {
  userName: string;
  otherSessions: DeviceSessionInfo[];
  currentSession: {
    id: string;
    ipAddress: string | null;
    userAgent: string | null;
    deviceInfo: ParsedDeviceInfo;
  };
}

export function DeviceLimitClient({
  userName,
  otherSessions,
  currentSession,
}: DeviceLimitClientProps) {
  const router = useRouter();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRevokeAndContinue = async (targetSessionId: string) => {
    if (isProcessing) return;
    setSelectedSessionId(targetSessionId);
    setIsProcessing(true);

    try {
      toast.loading("Logging out device and entering dashboard...", { id: "revoke-device-toast" });
      const res = await revokeSessionAndProceed(targetSessionId);
      if (res.status === "success") {
        toast.success("Device logged out successfully! Entering dashboard...", { id: "revoke-device-toast" });
        // Smoothly and immediately navigate to dashboard without page hanging
        window.location.replace("/dashboard");
      } else {
        toast.error(res.message || "Failed to log out device", { id: "revoke-device-toast" });
        setSelectedSessionId(null);
        setIsProcessing(false);
      }
    } catch (err) {
      console.error("Error revoking session:", err);
      toast.error("Failed to revoke device session. Please try again.", { id: "revoke-device-toast" });
      setSelectedSessionId(null);
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    try {
      await authClient.signOut();
      window.location.replace("/login");
    } catch {
      window.location.replace("/login");
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case "mobile":
        return <Smartphone className="w-5 h-5" />;
      case "tablet":
        return <Tablet className="w-5 h-5" />;
      case "desktop":
        return <Laptop className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  return (
    <Card className="w-full border-border/80 bg-card shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      <CardHeader className="space-y-3 text-center pb-4 pt-6 border-b border-border/40 bg-muted/20">
        <div className="mx-auto p-3 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 w-fit">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">
            Device Limit Reached
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            Hello <span className="font-semibold text-foreground">{userName}</span>, your account is already active on <span className="font-semibold text-foreground">{otherSessions.length} devices</span> (maximum 2 allowed).
          </CardDescription>
        </div>
        <div className="flex items-center justify-center gap-2 pt-1">
          <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
            Select 1 Device to Log Out
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-6 pb-6">
        <p className="text-xs text-muted-foreground font-medium">
          Choose which existing device you would like to log out from so this device can become active:
        </p>

        {/* List of other logged-in devices */}
        <div className="space-y-3">
          {otherSessions.map((session, index) => {
            const isSelected = selectedSessionId === session.id;
            return (
              <div
                key={session.id}
                className="p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
                    {getDeviceIcon(session.deviceInfo.deviceType)}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-foreground truncate">
                        {session.deviceInfo.displayName}
                      </p>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                        Device #{index + 1}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground font-mono">
                      {session.ipAddress && (
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-muted-foreground/70" />
                          {session.ipAddress === "::1" || session.ipAddress === "127.0.0.1"
                            ? "Localhost"
                            : session.ipAddress}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-muted-foreground/70" />
                        Active {format(new Date(session.updatedAt), "dd MMM, hh:mm a")}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => handleRevokeAndContinue(session.id)}
                  className="h-8 text-xs font-medium shrink-0 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
                >
                  {isSelected ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Logging Out...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out & Continue</span>
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Current Device Preview */}
        <div className="p-3 rounded-xl border border-primary/20 bg-primary/[0.02] flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="truncate">
              This Device: <strong className="text-foreground">{currentSession.deviceInfo.displayName}</strong>
            </span>
          </div>
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] shrink-0">
            New Session
          </Badge>
        </div>

        {/* Cancel / Log Out Button */}
        <div className="pt-2 flex justify-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isProcessing}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel & Return to Login
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
