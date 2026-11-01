"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Wifi,
  Users,
  Clock,
  Smartphone,
} from "lucide-react";
import { format } from "date-fns";
import { initSocket, joinRoom, onSocketEvent, onSocketConnectionChange } from "@/lib/socket-client";
import { getUserProfileImageUrl } from "@/lib/image-utils";

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

interface DelegatedLiveFeedProps {
  activeCodes: string[];
}

export default function DelegatedLiveFeed({ activeCodes }: DelegatedLiveFeedProps) {
  const [scanFeed, setScanFeed] = useState<DelegateScanEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const handleScan = useCallback((data: any) => {
    console.log("⚡ [DelegatedLiveFeed] Event received:", data);
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
  }, []);

  // Fetch initial scans for all active delegate codes & sync
  const fetchDelegatedScans = useCallback(async () => {
    if (activeCodes.length === 0) return;
    try {
      const allScans: DelegateScanEvent[] = [];
      await Promise.all(
        activeCodes.map(async (code) => {
          try {
            const res = await fetch(`/api/attendance/session-scans?code=${code}`);
            const data = await res.json();
            if (data.success && Array.isArray(data.scans)) {
              data.scans.forEach((s: any) => {
                if (s.method === "delegate-qr-scan" || s.markedBy?.startsWith("delegate-")) {
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
                    delegateCode: code,
                    timestamp: s.timestamp,
                    message: s.message,
                  });
                }
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
  }, [fetchDelegatedScans]);

  useEffect(() => {
    const cleanupFns: (() => void)[] = [];

    const cleanupConn = onSocketConnectionChange((connected) => {
      setIsConnected(connected);
    });
    cleanupFns.push(cleanupConn);

    initSocket().then((socket) => {
      if (!socket) return;
      setIsConnected(socket.connected);

      activeCodes.forEach((code) => {
        const room = `attendance-delegate-${code}`;
        const cleanupRoom = joinRoom(room);
        cleanupFns.push(cleanupRoom);
      });

      const cleanupDelegate = onSocketEvent("delegate-scan", handleScan);
      cleanupFns.push(cleanupDelegate);
    });

    return () => {
      cleanupFns.forEach((fn) => fn());
    };
  }, [activeCodes, handleScan]);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  if (activeCodes.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Wifi className="h-4 w-4 text-primary" />
              Delegated Scanner Feed
              {scanFeed.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {scanFeed.filter((s) => !s.alreadyMarked).length} scanned
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Live scans from {activeCodes.length} active scanner code
              {activeCodes.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div
              className={`h-2 w-2 rounded-full ${
                isConnected ? "bg-green-500 animate-pulse" : "bg-muted-foreground/50"
              }`}
            />
            {isConnected ? "Live" : "Connecting..."}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {scanFeed.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs">
            <Smartphone className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p>Waiting for delegated scanners to scan students...</p>
            <p className="mt-1 text-[10px]">
              Active codes:{" "}
              {activeCodes.map((c) => (
                <span
                  key={c}
                  className="font-mono font-bold tracking-wider mx-0.5"
                >
                  {c}
                </span>
              ))}
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[320px] pr-1">
            <div className="space-y-2">
              {scanFeed.map((scan, index) => (
                <div
                  key={`${scan.userId}-${scan.timestamp}`}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                    index === 0
                      ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800 animate-in fade-in slide-in-from-top-2"
                      : "bg-card"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="h-8 w-8">
                      {getUserProfileImageUrl(scan) ? (
                        <AvatarImage
                          src={getUserProfileImageUrl(scan)!}
                          alt={scan.userName}
                        />
                      ) : null}
                      <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                        {getInitials(scan.userName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-xs truncate">
                        {scan.userName}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        {scan.cbUserId && (
                          <span className="font-mono">{scan.cbUserId}</span>
                        )}
                        {scan.branch && <span>• {scan.branch}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0 ml-2">
                    <Badge
                      variant={scan.alreadyMarked ? "outline" : "default"}
                      className={`text-[10px] px-1.5 py-0 ${
                        !scan.alreadyMarked ? "bg-green-600 text-white" : ""
                      }`}
                    >
                      {scan.alreadyMarked ? "Already" : "+10 pts"}
                    </Badge>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Smartphone className="h-2.5 w-2.5" />
                      <span>{scan.scannerName}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {format(new Date(scan.timestamp), "hh:mm:ss a")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
