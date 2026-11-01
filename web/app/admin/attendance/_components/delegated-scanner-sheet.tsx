"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Share2,
  Loader2,
  Copy,
  CheckCircle2,
  Trash2,
  Clock,
  QrCode,
  ExternalLink,
  Smartphone,
  Wifi,
  Users,
  Search,
  CheckCircle,
  RefreshCw,
  Radio,
  Sparkles,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { initSocket, joinRoom, onSocketEvent, onSocketConnectionChange } from "@/lib/socket-client";
import { getUserProfileImageUrl } from "@/lib/image-utils";

interface AttendanceSession {
  id: string;
  sessionNumber: number;
  title: string;
}

interface ActiveCode {
  code: string;
  sessionId: string;
  sessionTitle: string;
  sessionNumber: number;
  createdByName: string;
  createdAt: string;
  expiresAt: string;
  active: boolean;
}

interface DelegateScanEvent {
  userId: string;
  userName: string;
  cbUserId?: string | null;
  branch?: string | null;
  rollNumber?: string | null;
  registration?: string | null;
  profileImageKey?: string | null;
  image?: string | null;
  points: number;
  alreadyMarked: boolean;
  scannerName: string;
  delegateCode: string;
  timestamp: string;
  message: string;
}

interface MarkedStudent {
  id: string;
  status: string;
  points: number;
  markedAt: string;
  method: string;
  markedBy?: string;
  user: {
    id: string;
    name: string;
    email: string;
    cbUserId?: string | null;
    registration: string | null;
    rollNumber: string | null;
    branch: string | null;
    profileImageKey?: string | null;
    image?: string | null;
  };
}

interface ConnectedDevice {
  name: string;
  code: string;
  lastActive: string;
  scanCount: number;
  isOnline: boolean;
}

interface DelegatedScannerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: AttendanceSession[];
  selectedSessionId?: string;
  onSessionSelect?: (sessionId: string) => void;
}

export default function DelegatedScannerSheet({
  open,
  onOpenChange,
  sessions,
  selectedSessionId,
}: DelegatedScannerSheetProps) {
  const [activeTab, setActiveTab] = useState<"devices" | "feed" | "students">("devices");
  const [selectedSession, setSelectedSession] = useState<string>(selectedSessionId || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [activeCodes, setActiveCodes] = useState<ActiveCode[]>([]);
  const [isLoadingCodes, setIsLoadingCodes] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Live Scans & Devices state
  const [scanFeed, setScanFeed] = useState<DelegateScanEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Marked Students state
  const [markedStudents, setMarkedStudents] = useState<MarkedStudent[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");

  // Sync selectedSession when prop changes
  useEffect(() => {
    if (selectedSessionId && !selectedSession) {
      setSelectedSession(selectedSessionId);
    }
  }, [selectedSessionId, selectedSession]);

  // Fetch active delegation codes
  const fetchActiveCodes = useCallback(async () => {
    setIsLoadingCodes(true);
    try {
      const res = await fetch("/api/admin/attendance/delegate-code");
      const data = await res.json();
      if (data.success) {
        setActiveCodes(data.codes);
      }
    } catch {
      console.error("Failed to fetch active codes");
    } finally {
      setIsLoadingCodes(false);
    }
  }, []);

  // Fetch marked students for the session
  const fetchMarkedStudents = useCallback(async () => {
    const targetSessionId = selectedSession || selectedSessionId || (activeCodes[0]?.sessionId);
    if (!targetSessionId) return;

    setIsLoadingStudents(true);
    try {
      const res = await fetch(`/api/admin/attendance/records?sessionId=${targetSessionId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.attendances)) {
        setMarkedStudents(data.attendances);
      }
    } catch {
      console.error("Failed to fetch marked students");
    } finally {
      setIsLoadingStudents(false);
    }
  }, [selectedSession, selectedSessionId, activeCodes]);

  // Initial load when sheet opens
  useEffect(() => {
    if (open) {
      fetchActiveCodes();
      fetchMarkedStudents();
    }
  }, [open, fetchActiveCodes, fetchMarkedStudents]);

  // Generate code handler
  const handleGenerate = async () => {
    const sessionToUse = selectedSession || selectedSessionId || sessions[0]?.id;
    if (!sessionToUse) {
      toast.error("Please select an attendance session first");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/admin/attendance/delegate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionToUse }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedCode(data.code);
        toast.success(`Scanner code "${data.code}" generated (Valid for 2 hours)!`);
        fetchActiveCodes();
      } else {
        toast.error(data.error || "Failed to generate code");
      }
    } catch {
      toast.error("Network error while generating code");
    } finally {
      setIsGenerating(false);
    }
  };

  // Revoke code handler
  const handleRevoke = async (code: string) => {
    try {
      const res = await fetch(`/api/admin/attendance/delegate-code?code=${code}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Code ${code} revoked`);
        fetchActiveCodes();
      } else {
        toast.error(data.error || "Failed to revoke code");
      }
    } catch {
      toast.error("Network error while revoking code");
    }
  };

  const copyToClipboard = (text: string, codeStr: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(codeStr);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Handle incoming live scan event
  const handleScanEvent = useCallback((data: any) => {
    const scanEvent: DelegateScanEvent = {
      userId: data.userId,
      userName: data.userName,
      cbUserId: data.cbUserId || null,
      branch: data.branch || null,
      rollNumber: data.rollNumber || null,
      registration: data.registration || null,
      profileImageKey: data.profileImageKey || null,
      image: data.image || null,
      points: data.points || 10,
      alreadyMarked: !!data.alreadyMarked,
      scannerName: data.scannerName || "Delegated Scanner",
      delegateCode: data.delegateCode || "",
      timestamp: data.timestamp || new Date().toISOString(),
      message: data.message || `Scanned: ${data.userName}`,
    };

    setScanFeed((prev) => {
      const exists = prev.some(
        (s) => s.userId === scanEvent.userId && s.timestamp === scanEvent.timestamp
      );
      if (exists) return prev;
      return [scanEvent, ...prev].slice(0, 100);
    });

    // Also update marked students list if it's a new mark
    if (!data.alreadyMarked) {
      setMarkedStudents((prev) => {
        const exists = prev.some((s) => s.user.id === data.userId || s.id === data.userId);
        if (exists) return prev;
        const newRecord: MarkedStudent = {
          id: `${data.userId}-${Date.now()}`,
          status: "present",
          points: 10,
          markedAt: scanEvent.timestamp,
          method: "delegate-qr-scan",
          markedBy: `delegate-${data.delegateCode || ""}`,
          user: {
            id: data.userId,
            name: data.userName,
            email: data.userEmail || "",
            cbUserId: data.cbUserId || null,
            registration: data.registration || null,
            rollNumber: data.rollNumber || null,
            branch: data.branch || null,
            profileImageKey: data.profileImageKey || null,
            image: data.image || null,
          },
        };
        return [newRecord, ...prev];
      });
    }
  }, []);

  // Fetch initial scans & 3s polling fallback
  const fetchDelegatedScans = useCallback(async () => {
    if (activeCodes.length === 0) return;
    try {
      const allScans: DelegateScanEvent[] = [];
      await Promise.all(
        activeCodes.map(async (codeObj) => {
          try {
            const res = await fetch(`/api/attendance/session-scans?code=${codeObj.code}`);
            const data = await res.json();
            if (data.success && Array.isArray(data.scans)) {
              data.scans.forEach((s: any) => {
                allScans.push({
                  userId: s.userId,
                  userName: s.userName,
                  cbUserId: s.cbUserId || null,
                  branch: s.branch || null,
                  rollNumber: s.rollNumber || null,
                  registration: s.registration || null,
                  profileImageKey: s.profileImageKey || null,
                  image: s.image || null,
                  points: s.points || 10,
                  alreadyMarked: false,
                  scannerName: s.scannerName || "Delegated Scanner",
                  delegateCode: codeObj.code,
                  timestamp: s.timestamp,
                  message: s.message,
                });
              });
            }
          } catch {}
        })
      );

      if (allScans.length > 0) {
        setScanFeed((prev) => {
          const existingUserIds = new Set(prev.map((p) => p.userId));
          const newItems = allScans.filter((s) => !existingUserIds.has(s.userId));
          if (newItems.length === 0 && prev.length > 0) return prev;
          return [...prev, ...newItems].slice(0, 100);
        });
      }
    } catch {}
  }, [activeCodes]);

  useEffect(() => {
    if (open) {
      fetchDelegatedScans();
      const handleFocus = () => {
        if (document.visibilityState === "visible") {
          fetchDelegatedScans();
        }
      };
      window.addEventListener("focus", handleFocus);
      document.addEventListener("visibilitychange", handleFocus);
      return () => {
        window.removeEventListener("focus", handleFocus);
        document.removeEventListener("visibilitychange", handleFocus);
      };
    }
  }, [open, fetchDelegatedScans]);

  // Socket.IO room subscriptions
  useEffect(() => {
    if (!open) return;

    const cleanupFns: (() => void)[] = [];

    const cleanupConn = onSocketConnectionChange((connected) => {
      setIsConnected(connected);
    });
    cleanupFns.push(cleanupConn);

    initSocket().then((socket) => {
      if (!socket) return;
      setIsConnected(socket.connected);

      activeCodes.forEach((c) => {
        const room = `attendance-delegate-${c.code}`;
        cleanupFns.push(joinRoom(room));
      });

      const currentSessionId = selectedSession || selectedSessionId;
      if (currentSessionId) {
        cleanupFns.push(joinRoom(`attendance-session-${currentSessionId}`));
      }

      cleanupFns.push(onSocketEvent("delegate-scan", handleScanEvent));
      cleanupFns.push(onSocketEvent("attendance-updated", handleScanEvent));
    });

    return () => {
      cleanupFns.forEach((fn) => fn());
    };
  }, [open, activeCodes, selectedSession, selectedSessionId, handleScanEvent]);

  // Compute connected devices list from scan feed & active codes
  const connectedDevices = useMemo(() => {
    const deviceMap = new Map<string, ConnectedDevice>();

    // Register active codes first
    activeCodes.forEach((ac) => {
      deviceMap.set(`code-${ac.code}`, {
        name: `Code: ${ac.code}`,
        code: ac.code,
        lastActive: ac.createdAt,
        scanCount: 0,
        isOnline: true,
      });
    });

    // Populate actual named devices from scan feed
    scanFeed.forEach((scan) => {
      const devKey = `${scan.delegateCode}-${scan.scannerName}`;
      const existing = deviceMap.get(devKey);
      if (existing) {
        existing.scanCount += 1;
        if (new Date(scan.timestamp) > new Date(existing.lastActive)) {
          existing.lastActive = scan.timestamp;
        }
      } else {
        deviceMap.set(devKey, {
          name: scan.scannerName || `Device ${scan.delegateCode}`,
          code: scan.delegateCode,
          lastActive: scan.timestamp,
          scanCount: 1,
          isOnline: true,
        });
      }
    });

    return Array.from(deviceMap.values());
  }, [activeCodes, scanFeed]);

  // Filtered marked students
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return markedStudents;
    const q = studentSearch.toLowerCase();
    return markedStudents.filter(
      (s) =>
        s.user.name?.toLowerCase().includes(q) ||
        s.user.rollNumber?.toLowerCase().includes(q) ||
        s.user.cbUserId?.toLowerCase().includes(q) ||
        s.user.branch?.toLowerCase().includes(q)
    );
  }, [markedStudents, studentSearch]);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col h-full bg-background/95 backdrop-blur-md border-l border-border"
      >
        {/* Header */}
        <SheetHeader className="p-4 sm:p-6 pb-3 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <QrCode className="h-5 w-5" />
              </div>
              <div>
                <SheetTitle className="text-base sm:text-lg flex items-center gap-2">
                  Delegated Scanning Console
                  <Badge
                    variant={isConnected ? "default" : "outline"}
                    className={`text-[10px] px-1.5 py-0 h-4 ${
                      isConnected ? "bg-green-600 text-white" : "text-muted-foreground"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full mr-1 ${
                        isConnected ? "bg-white animate-pulse" : "bg-muted-foreground"
                      }`}
                    />
                    {isConnected ? "Live" : "Connecting"}
                  </Badge>
                </SheetTitle>
                <SheetDescription className="text-xs">
                  Generate scanner codes, monitor active helper devices, and track live attendance
                </SheetDescription>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as any)}
            className="w-full mt-3"
          >
            <TabsList className="grid w-full grid-cols-3 h-9">
              <TabsTrigger value="devices" className="text-xs gap-1.5">
                <Smartphone className="h-3.5 w-3.5" />
                <span>Devices & Codes</span>
                {activeCodes.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-1">
                    {activeCodes.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="feed" className="text-xs gap-1.5">
                <Radio className="h-3.5 w-3.5" />
                <span>Live Feed</span>
                {scanFeed.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-1">
                    {scanFeed.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="students" className="text-xs gap-1.5">
                <Users className="h-3.5 w-3.5" />
                <span>Marked Students</span>
                {markedStudents.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-1 bg-green-600/10 text-green-600 dark:text-green-400">
                    {markedStudents.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </SheetHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: DEVICES & CODES */}
          {activeTab === "devices" && (
            <div className="space-y-5">
              {/* Code Generation Section */}
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Generate Delegation Code
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Creates a 6-character code valid for 2 hours
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="shadow-sm"
                  >
                    {isGenerating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <QrCode className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Generate Code
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Target Attendance Session
                  </label>
                  <Select
                    value={selectedSession}
                    onValueChange={(val) => {
                      setSelectedSession(val);
                      fetchMarkedStudents();
                    }}
                  >
                    <SelectTrigger className="w-full text-xs h-9 bg-background">
                      <SelectValue placeholder="Select session..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sessions.map((s) => (
                        <SelectItem key={s.id} value={s.id} className="text-xs">
                          Session #{s.sessionNumber}: {s.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {generatedCode && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-300 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">New Active Code:</span>
                      <span className="text-lg font-mono font-bold tracking-widest bg-green-500/20 px-2 py-0.5 rounded">
                        {generatedCode}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs h-7"
                        onClick={() =>
                          copyToClipboard(
                            `${typeof window !== "undefined" ? window.location.origin : ""}/attendance/scan/${generatedCode}`,
                            generatedCode
                          )
                        }
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy Scanner Link
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Active Scanner Devices & Codes List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-primary" />
                    Active Scanner Devices ({connectedDevices.length})
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      fetchActiveCodes();
                      fetchDelegatedScans();
                    }}
                    className="h-7 text-xs text-muted-foreground"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Refresh
                  </Button>
                </div>

                {connectedDevices.length === 0 ? (
                  <div className="p-8 rounded-xl border border-dashed text-center text-xs text-muted-foreground space-y-2">
                    <Smartphone className="h-8 w-8 mx-auto opacity-40" />
                    <p>No active scanner devices or codes yet.</p>
                    <p className="text-[11px]">Generate a code above to share with helpers.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {connectedDevices.map((dev, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border bg-card/60 hover:bg-card transition-colors flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Smartphone className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold truncate">{dev.name}</p>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                                {dev.code}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
                              <span>{dev.scanCount} scans recorded</span>
                              <span>•</span>
                              <span>
                                Active {formatDistanceToNow(new Date(dev.lastActive), { addSuffix: true })}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Copy link"
                            onClick={() =>
                              copyToClipboard(
                                `${typeof window !== "undefined" ? window.location.origin : ""}/attendance/scan/${dev.code}`,
                                dev.code
                              )
                            }
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            title="Revoke code"
                            onClick={() => handleRevoke(dev.code)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: LIVE FEED */}
          {activeTab === "feed" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Radio className="h-4 w-4 text-primary" />
                    Real-time Delegated Scans
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Live stream of all scans performed across all delegated phones
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {scanFeed.length} recorded
                </Badge>
              </div>

              {scanFeed.length === 0 ? (
                <div className="p-12 rounded-xl border border-dashed text-center text-xs text-muted-foreground space-y-2">
                  <Radio className="h-8 w-8 mx-auto opacity-40 animate-pulse text-primary" />
                  <p>Waiting for delegated scanners to scan students...</p>
                  <p className="text-[11px]">Any scans performed on helper devices will show here instantly.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {scanFeed.map((scan, idx) => (
                    <div
                      key={`${scan.userId}-${scan.timestamp}-${idx}`}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        idx === 0
                          ? "bg-green-500/10 border-green-500/30 animate-in fade-in slide-in-from-top-2"
                          : "bg-card/70"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-9 w-9 border shrink-0">
                          {getUserProfileImageUrl(scan) ? (
                            <AvatarImage src={getUserProfileImageUrl(scan)!} alt={scan.userName} />
                          ) : null}
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                            {getInitials(scan.userName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{scan.userName}</p>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            {scan.cbUserId && <span className="font-mono">{scan.cbUserId}</span>}
                            {scan.rollNumber && <span>• {scan.rollNumber}</span>}
                            {scan.branch && <span>• {scan.branch}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge
                          variant={scan.alreadyMarked ? "outline" : "default"}
                          className={`text-[10px] px-1.5 py-0 ${
                            !scan.alreadyMarked ? "bg-green-600 text-white" : ""
                          }`}
                        >
                          {scan.alreadyMarked ? "Already Marked" : "+10 pts"}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Smartphone className="h-2.5 w-2.5" />
                          {scan.scannerName}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {format(new Date(scan.timestamp), "hh:mm:ss a")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MARKED STUDENTS */}
          {activeTab === "students" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Marked Students ({filteredStudents.length})
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Students recorded present in this session
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchMarkedStudents}
                  disabled={isLoadingStudents}
                  className="h-7 text-xs text-muted-foreground"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingStudents ? "animate-spin" : ""}`} />
                  Sync
                </Button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, roll no, or CB ID..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pl-8 text-xs h-8"
                />
              </div>

              {filteredStudents.length === 0 ? (
                <div className="p-10 rounded-xl border border-dashed text-center text-xs text-muted-foreground space-y-2">
                  <Users className="h-8 w-8 mx-auto opacity-40" />
                  <p>No marked students found for this session.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredStudents.map((record) => (
                    <div
                      key={record.id}
                      className="p-3 rounded-xl border bg-card/70 flex items-center justify-between gap-3 hover:bg-card transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-9 w-9 border shrink-0">
                          {getUserProfileImageUrl(record.user) ? (
                            <AvatarImage src={getUserProfileImageUrl(record.user)!} alt={record.user.name} />
                          ) : null}
                          <AvatarFallback className="text-xs bg-green-500/10 text-green-600 font-bold">
                            {getInitials(record.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{record.user.name}</p>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            {record.user.cbUserId && <span className="font-mono">{record.user.cbUserId}</span>}
                            {record.user.rollNumber && <span>• {record.user.rollNumber}</span>}
                            {record.user.branch && <span>• {record.user.branch}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-green-500/40 text-green-600 dark:text-green-400 bg-green-500/10">
                          Present (+{record.points || 10} pts)
                        </Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {format(new Date(record.markedAt), "hh:mm a")}
                        </span>
                        {record.markedBy && (
                          <span className="text-[9px] text-muted-foreground font-mono">
                            via {record.markedBy.replace("delegate-", "Code: ")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
