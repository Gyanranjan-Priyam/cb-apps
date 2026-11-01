"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Laptop,
  Smartphone,
  Tablet,
  Monitor,
  Shield,
  LogOut,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Globe,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import {
  getUserActiveSessions,
  revokeUserSession,
  revokeAllOtherUserSessions,
  UserSessionItem,
} from "../actions";
import { format } from "date-fns";

export function UserActiveSessionsSection() {
  const router = useRouter();
  const [sessions, setSessions] = useState<UserSessionItem[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [maxAllowed, setMaxAllowed] = useState(2);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadSessions = async () => {
    try {
      const res = await getUserActiveSessions();
      if (res.status === "success" && res.sessions) {
        setSessions(res.sessions);
        setCurrentSessionId(res.currentSessionId || null);
        setMaxAllowed(res.maxAllowed);
        setIsAdmin(res.isAdmin);
      }
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleRevokeSession = (sessionId: string, isCurrent: boolean) => {
    setRevokingId(sessionId);
    startTransition(async () => {
      try {
        const result = await revokeUserSession(sessionId);
        if (result.status === "success") {
          toast.success(result.message);
          if (isCurrent || result.isCurrentRevoked) {
            // Sign out on current device
            await authClient.signOut();
            router.push("/login");
            return;
          }
          await loadSessions();
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to log out device.");
      } finally {
        setRevokingId(null);
      }
    });
  };

  const handleRevokeAllOther = () => {
    startTransition(async () => {
      try {
        const result = await revokeAllOtherUserSessions();
        if (result.status === "success") {
          toast.success(result.message);
          await loadSessions();
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to log out other devices.");
      }
    });
  };

  const handleCurrentLogout = async () => {
    try {
      toast.info("Logging out...");
      await authClient.signOut();
      router.push("/login");
    } catch (err) {
      console.error(err);
      toast.error("Failed to log out.");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span className="text-xs">Loading active devices...</span>
      </div>
    );
  }

  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Logged-in Devices & Active Sessions</h3>
            {isAdmin ? (
              <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                Unlimited Devices (Admin)
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className={`text-[10px] ${
                  sessions.length >= maxAllowed
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                }`}
              >
                {sessions.length} / {maxAllowed} Devices Used
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isAdmin
              ? "As an administrator, you can log in on unlimited devices simultaneously."
              : "Students can be logged in on a maximum of 2 devices simultaneously. Log out from older devices if needed."}
          </p>
        </div>

        {otherSessionsCount > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRevokeAllOther}
            disabled={isPending}
            className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 shrink-0 gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Log Out All Other Devices</span>
          </Button>
        )}
      </div>

      {/* Device List Cards */}
      <div className="grid gap-3">
        {sessions.map((item) => {
          const isItemRevoking = revokingId === item.id;
          return (
            <Card
              key={item.id}
              className={`p-3.5 rounded-xl border transition-all ${
                item.isCurrent
                  ? "bg-primary/[0.03] border-primary/30 shadow-sm"
                  : "bg-card hover:bg-muted/30 border-border/70"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      item.isCurrent
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {getDeviceIcon(item.deviceInfo.deviceType)}
                  </div>

                  <div className="min-w-0 space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-foreground">
                        {item.deviceInfo.displayName}
                      </span>
                      {item.isCurrent && (
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30 text-[10px] px-2 py-0 h-4 font-semibold">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          This Device (Current)
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground font-mono">
                      {item.ipAddress && (
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-muted-foreground/70" />
                          {item.ipAddress === "::1" || item.ipAddress === "127.0.0.1"
                            ? "Localhost"
                            : item.ipAddress}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-muted-foreground/70" />
                        Active {format(new Date(item.updatedAt), "dd MMM yyyy, hh:mm a")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {item.isCurrent ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCurrentLogout}
                      className="h-7 text-xs px-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="w-3.5 h-3.5 mr-1" />
                      Log Out
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending || isItemRevoking}
                      onClick={() => handleRevokeSession(item.id, item.isCurrent)}
                      className="h-7 text-xs px-2.5 text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    >
                      {isItemRevoking ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      ) : (
                        <LogOut className="w-3 h-3 mr-1" />
                      )}
                      Log Out Device
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
