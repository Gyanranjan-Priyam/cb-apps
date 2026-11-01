"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, HardDrive, Loader2, RefreshCw, Unlink } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

interface GoogleDriveSettingsCardProps {
  initialConnected?: boolean;
  initialEmail?: string | null;
}

export function GoogleDriveSettingsCard({
  initialConnected = false,
  initialEmail = null,
}: GoogleDriveSettingsCardProps) {
  const [isConnected, setIsConnected] = useState(initialConnected);
  const [email, setEmail] = useState<string | null>(initialEmail);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialEmail && !initialConnected);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Check query params for status toasts
  useEffect(() => {
    const gdrive = searchParams?.get("gdrive");
    const error = searchParams?.get("error");
    const details = searchParams?.get("details");

    if (gdrive === "connected") {
      toast.success("Google Drive connected successfully!");
      setIsConnected(true);
      router.replace("/admin/settings");
    } else if (error && error.startsWith("gdrive_")) {
      toast.error(details || "Failed to connect Google Drive");
      router.replace("/admin/settings");
    }
  }, [searchParams, router]);

  // Fetch status on mount
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/api/settings/google-drive/status");
        const json = await res.json();
        if (json.success && json.data) {
          setIsConnected(json.data.isConnected);
          setEmail(json.data.email || null);
        }
      } catch (err) {
        console.error("Failed to load Google Drive status:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStatus();
  }, []);

  const handleConnect = () => {
    setIsConnecting(true);
    window.location.href = "/api/settings/google-drive/connect";
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const res = await fetch("/api/settings/google-drive/disconnect", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setIsConnected(false);
        setEmail(null);
        toast.success("Google Drive disconnected successfully");
        router.refresh();
      } else {
        toast.error(data.message || "Failed to disconnect Google Drive");
      }
    } catch (err) {
      toast.error("An error occurred while disconnecting Google Drive");
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <Card id="google-drive" className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <HardDrive className="w-5 h-5 text-primary" />
            Google Drive
          </CardTitle>
          {isConnected && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Connected
            </span>
          )}
          {!isConnected && !isLoading && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <AlertCircle className="w-3.5 h-3.5" />
              Not Connected
            </span>
          )}
        </div>
        <CardDescription>
          Store form file uploads securely in Google Drive folders organized by Form ID and Response ID.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Checking Google Drive status...
          </div>
        ) : isConnected ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-xl bg-card">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <p className="text-sm font-medium text-foreground">✓ Connected</p>
                </div>
                {email && (
                  <p className="text-xs text-muted-foreground font-mono pl-6">
                    Account: <span className="font-semibold text-foreground">{email}</span>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleConnect}
                  disabled={isConnecting || isDisconnecting}
                  className="gap-1.5 text-xs"
                >
                  {isConnecting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  Reconnect
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={isConnecting || isDisconnecting}
                  className="gap-1.5 text-xs"
                >
                  {isDisconnecting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Unlink className="w-3.5 h-3.5" />
                  )}
                  Disconnect
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Files uploaded to forms will be compressed to a maximum of 300 KB and automatically organized into <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">Forms/CB-FRM-&#123;FORM_ID&#125;</code> folders.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/40">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0" />
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-300">⚠ Not Connected</p>
                </div>
                <p className="text-xs text-amber-800/80 dark:text-amber-400/90 pl-6">
                  Connect your Google Drive to store files uploaded through forms.
                </p>
              </div>
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                size="sm"
                className="gap-2 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs shadow-sm"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <HardDrive className="w-3.5 h-3.5" />
                    Connect Google Drive
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
