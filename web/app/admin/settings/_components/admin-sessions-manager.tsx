/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useTransition } from "react";
import {
  AdminSessionItem,
  AdminSessionsData,
  revokeSessionAction,
  revokeAllOtherSessionsAction,
  saveAdminSessionPolicyAction,
  cleanupInactiveAdminSessionsAction,
} from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Laptop,
  Smartphone,
  Tablet,
  Monitor,
  Shield,
  ShieldCheck,
  LogOut,
  Clock,
  Globe,
  RefreshCw,
  Search,
  Trash2,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface AdminSessionsManagerProps {
  initialData: AdminSessionsData;
}

export function AdminSessionsManager({ initialData }: AdminSessionsManagerProps) {
  const router = useRouter();
  const [data, setData] = useState<AdminSessionsData>(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "Admin" | "Co-Admin">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [policyDays, setPolicyDays] = useState<string>(
    initialData.policy.inactiveDays?.toString() || "7"
  );

  const [isPending, startTransition] = useTransition();
  const [isPolicySaving, setIsPolicySaving] = useState(false);
  const [isPruning, setIsPruning] = useState(false);

  // Dialog State
  const [selectedSession, setSelectedSession] = useState<AdminSessionItem | null>(null);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [bulkRevokeUserId, setBulkRevokeUserId] = useState<string | null>(null);
  const [bulkRevokeDialogOpen, setBulkRevokeDialogOpen] = useState(false);

  const handleRevokeSingle = async () => {
    if (!selectedSession) return;
    startTransition(async () => {
      try {
        const res = await revokeSessionAction(selectedSession.id);
        if (res.status === "success") {
          toast.success(res.message);
          setData((prev) => ({
            ...prev,
            sessions: prev.sessions.filter((s) => s.id !== selectedSession.id),
            stats: {
              ...prev.stats,
              totalSessions: Math.max(0, prev.stats.totalSessions - 1),
            },
          }));
          router.refresh();
        } else {
          toast.error(res.message);
        }
      } catch (e) {
        toast.error("Failed to revoke session");
      } finally {
        setRevokeDialogOpen(false);
        setSelectedSession(null);
      }
    });
  };

  const handleBulkRevokeOther = async () => {
    if (!bulkRevokeUserId) return;
    startTransition(async () => {
      try {
        const res = await revokeAllOtherSessionsAction(bulkRevokeUserId);
        if (res.status === "success") {
          toast.success(res.message);
          setData((prev) => ({
            ...prev,
            sessions: prev.sessions.filter(
              (s) => s.userId !== bulkRevokeUserId || s.isCurrentSession
            ),
          }));
          router.refresh();
        } else {
          toast.error(res.message);
        }
      } catch (e) {
        toast.error("Failed to revoke other sessions");
      } finally {
        setBulkRevokeDialogOpen(false);
        setBulkRevokeUserId(null);
      }
    });
  };

  const handleSavePolicy = async () => {
    const days = parseInt(policyDays, 10) || 7;
    setIsPolicySaving(true);
    try {
      const res = await saveAdminSessionPolicyAction(days);
      if (res.status === "success") {
        toast.success(res.message);
        setData((prev) => ({
          ...prev,
          policy: { inactiveDays: days },
          sessions: prev.sessions.map((s) => ({
            ...s,
            isInactive: s.daysInactive >= days,
          })),
        }));
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to update policy");
    } finally {
      setIsPolicySaving(false);
    }
  };

  const handlePruneInactive = async () => {
    setIsPruning(true);
    try {
      const days = parseInt(policyDays, 10) || 7;
      const res = await cleanupInactiveAdminSessionsAction(days);
      if (res.status === "success") {
        toast.success(res.message);
        setData((prev) => ({
          ...prev,
          sessions: prev.sessions.filter((s) => !s.isInactive || s.isCurrentSession),
        }));
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to cleanup inactive sessions");
    } finally {
      setIsPruning(false);
    }
  };

  const filteredSessions = data.sessions.filter((session) => {
    // Role filter
    if (roleFilter !== "ALL" && session.userRole !== roleFilter) {
      return false;
    }
    // Status filter
    if (statusFilter === "ACTIVE" && session.isInactive) {
      return false;
    }
    if (statusFilter === "INACTIVE" && !session.isInactive) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = session.userName.toLowerCase().includes(q);
      const matchEmail = session.userEmail.toLowerCase().includes(q);
      const matchIp = session.ipAddress?.toLowerCase().includes(q);
      const matchBrowser = session.deviceInfo.browser.toLowerCase().includes(q);
      const matchOs = session.deviceInfo.os.toLowerCase().includes(q);
      return matchName || matchEmail || matchIp || matchBrowser || matchOs;
    }
    return true;
  });

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "mobile":
        return <Smartphone className="h-4 w-4" />;
      case "tablet":
        return <Tablet className="h-4 w-4" />;
      default:
        return <Laptop className="h-4 w-4" />;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* ── Summary Stats Cards ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 rounded-xl border border-border/70 bg-card shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Active Sessions
            </span>
            <Monitor className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-foreground">
            {data.stats.totalSessions}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Across {data.stats.totalUniqueUsers} elevated accounts
          </p>
        </Card>

        <Card className="p-4 rounded-xl border border-border/70 bg-card shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Admin Devices
            </span>
            <Shield className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-foreground">
            {data.stats.totalAdminSessions}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Full System Admins</p>
        </Card>

        <Card className="p-4 rounded-xl border border-border/70 bg-card shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Co-Admin Devices
            </span>
            <ShieldCheck className="h-4 w-4 text-sky-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-foreground">
            {data.stats.totalCoAdminSessions}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Operational Co-Admins</p>
        </Card>

        <Card className="p-4 rounded-xl border border-border/70 bg-card shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Inactive Stale
            </span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-foreground">
            {data.stats.inactiveSessionsCount}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Inactive &gt; {data.policy.inactiveDays} days
          </p>
        </Card>
      </div>

      {/* ── Auto-Logout & Inactivity Policy Card ──────────────── */}
      <Card className="border border-border/80 bg-muted/20 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" />
                Inactive Device Auto-Logout Policy
              </CardTitle>
              <CardDescription className="text-xs">
                Admin and Co-Admin sessions that remain inactive without activity for more than the configured duration will be flagged and auto-pruned.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-3">
              <Label htmlFor="policy-select" className="text-xs font-medium shrink-0">
                Inactivity Threshold:
              </Label>
              <Select value={policyDays} onValueChange={setPolicyDays}>
                <SelectTrigger id="policy-select" className="w-36 h-8 text-xs">
                  <SelectValue placeholder="Select days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Days</SelectItem>
                  <SelectItem value="7">7 Days (Default)</SelectItem>
                  <SelectItem value="14">14 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="60">60 Days</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={handleSavePolicy}
                disabled={isPolicySaving}
              >
                {isPolicySaving ? "Saving..." : "Save Policy"}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="destructive"
                className="h-8 text-xs gap-1.5"
                onClick={handlePruneInactive}
                disabled={isPruning}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isPruning ? "Pruning..." : "Prune Inactive Sessions Now"}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Search & Filter Controls ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, IP, browser..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Select
            value={roleFilter}
            onValueChange={(val: any) => setRoleFilter(val)}
          >
            <SelectTrigger className="h-9 w-32 text-xs">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="Admin">Admins</SelectItem>
              <SelectItem value="Co-Admin">Co-Admins</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(val: any) => setStatusFilter(val)}
          >
            <SelectTrigger className="h-9 w-32 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active Only</SelectItem>
              <SelectItem value="INACTIVE">Inactive Only</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => router.refresh()}
            title="Refresh list"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Sessions List ───────────────────────────────────── */}
      <div className="space-y-3">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-xl p-8 bg-muted/10">
            <Monitor className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2" />
            <p className="text-sm font-medium text-foreground">No active sessions found</p>
            <p className="text-xs text-muted-foreground mt-1">
              No logged-in admin or co-admin devices match the current filters.
            </p>
          </div>
        ) : (
          filteredSessions.map((session) => (
            <Card
              key={session.id}
              className={`p-4 rounded-xl border transition-all ${
                session.isCurrentSession
                  ? "border-emerald-500/50 bg-emerald-500/5 shadow-xs"
                  : session.isInactive
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-border/70 hover:border-border"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Left: User & Device Info */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <Avatar className="h-10 w-10 shrink-0 border border-border">
                    <AvatarImage src={session.userImage || ""} alt={session.userName} />
                    <AvatarFallback className="text-xs font-semibold">
                      {getInitials(session.userName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {session.userName}
                      </span>
                      <Badge
                        variant={session.userRole === "Admin" ? "default" : "secondary"}
                        className="text-[10px] px-1.5 py-0 h-4"
                      >
                        {session.userRole}
                      </Badge>
                      {session.isCurrentSession && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-4 border-emerald-500/60 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-medium"
                        >
                          This Device (Current)
                        </Badge>
                      )}
                      {session.isInactive && (
                        <Badge
                          variant="destructive"
                          className="text-[10px] px-1.5 py-0 h-4 bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                        >
                          Inactive ({session.daysInactive}d)
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground truncate">
                      {session.userEmail}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-0.5">
                      <span className="flex items-center gap-1.5 text-foreground font-medium">
                        {getDeviceIcon(session.deviceInfo.deviceType)}
                        {session.deviceInfo.browser} on {session.deviceInfo.os}
                      </span>
                      {session.ipAddress && (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          IP: {session.ipAddress}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last active:{" "}
                        {new Date(session.updatedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {!session.isCurrentSession && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-border/80"
                      onClick={() => {
                        setSelectedSession(session);
                        setRevokeDialogOpen(true);
                      }}
                      disabled={isPending}
                    >
                      <LogOut className="h-3.5 w-3.5 mr-1.5" />
                      Log Out Device
                    </Button>
                  )}
                  {session.isCurrentSession && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs text-muted-foreground"
                      onClick={() => {
                        setBulkRevokeUserId(session.userId);
                        setBulkRevokeDialogOpen(true);
                      }}
                    >
                      Log out all other devices
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* ── Single Session Revoke Dialog ─────────────────────── */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out this device session?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed">
              This will immediately terminate the active session on{" "}
              <strong>
                {selectedSession?.deviceInfo.browser} ({selectedSession?.deviceInfo.os})
              </strong>{" "}
              for <strong>{selectedSession?.userName}</strong> ({selectedSession?.userEmail}). The user on that device will be forced to log in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeSingle}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Logging out..." : "Yes, Log Out Device"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Bulk Other Sessions Revoke Dialog ────────────────── */}
      <AlertDialog open={bulkRevokeDialogOpen} onOpenChange={setBulkRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out all other devices?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed">
              This will log out all other active sessions for your account across all other laptops, phones, and browsers. Your current device will remain logged in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkRevokeOther}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Terminating..." : "Log Out All Other Devices"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
