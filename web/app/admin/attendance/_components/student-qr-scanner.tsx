"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  QrCode,
  Camera,
  CameraOff,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Search,
  UserCheck,
  SwitchCamera,
  Upload,
} from "lucide-react";
import { format } from "date-fns";
import { getUserProfileImageUrl } from "@/lib/image-utils";
import { initSocket, joinRoom, onSocketEvent } from "@/lib/socket-client";

interface ScannedUser {
  id: string;
  name: string;
  email: string;
  cbUserId: string | null;
  registration: string | null;
  rollNumber: string | null;
  branch: string | null;
  profileImageKey: string | null;
  image?: string | null;
  role: string | null;
}

interface ScanHistoryItem {
  id: string;
  user: ScannedUser;
  timestamp: Date;
  status: "success" | "already_marked";
  message: string;
}

interface StudentQRScannerProps {
  sessionId: string;
  sessionTitle: string;
  onScanSuccess?: () => void;
}

export default function StudentQRScanner({
  sessionId,
  sessionTitle,
  onScanSuccess,
}: StudentQRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string>("");
  const [manualInput, setManualInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastScanned, setLastScanned] = useState<{
    user: ScannedUser;
    status: "success" | "already_marked";
    message: string;
    timestamp: Date;
  } | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [historySearch, setHistorySearch] = useState("");

  // Fetch initial scanned students for this session & sync
  const fetchSessionRecords = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/admin/attendance/records?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.attendances)) {
        const items: ScanHistoryItem[] = data.attendances.map((att: any) => ({
          id: att.id,
          user: {
            id: att.user.id || att.id,
            name: att.user.name,
            email: att.user.email,
            cbUserId: att.user.cbUserId || null,
            registration: att.user.registration || null,
            rollNumber: att.user.rollNumber || null,
            branch: att.user.branch || null,
            profileImageKey: att.user.profileImageKey || null,
            image: att.user.image || null,
            role: null,
          },
          timestamp: new Date(att.markedAt),
          status: "success",
          message: `Marked Present: ${att.user.name}`,
        }));

        setScanHistory((prev) => {
          // Merge preserving any instant socket items
          const existingIds = new Set(prev.map((p) => p.user.id));
          const newItems = items.filter((it) => !existingIds.has(it.user.id));
          if (newItems.length === 0 && prev.length > 0) return prev;
          return [...prev, ...newItems].slice(0, 100);
        });

        // Set lastScanned if not set yet
        if (items.length > 0) {
          setLastScanned((current) => {
            if (current) return current;
            return {
              user: items[0].user,
              status: "success",
              message: items[0].message,
              timestamp: items[0].timestamp,
            };
          });
        }
      }
    } catch {
      // Silent background fetch error
    }
  }, [sessionId]);

  // Initial fetch and focus/visibility refresh
  useEffect(() => {
    fetchSessionRecords();
    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        fetchSessionRecords();
      }
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [fetchSessionRecords]);

  // Socket.IO — Listen to live scans for this session in real-time
  useEffect(() => {
    if (!sessionId) return;

    const cleanupFns: (() => void)[] = [];

    initSocket().then((socket) => {
      if (!socket) return;

      const room = `attendance-session-${sessionId}`;
      const cleanupRoom = joinRoom(room);
      cleanupFns.push(cleanupRoom);

      const handleAttendanceUpdated = (data: any) => {
        console.log("⚡ [AdminScanner] Real-time scan received:", data);

        const scannedUser: ScannedUser = {
          id: data.userId,
          name: data.userName,
          email: data.userEmail || "",
          cbUserId: data.cbUserId || null,
          registration: data.registration || null,
          rollNumber: data.rollNumber || null,
          branch: data.branch || null,
          profileImageKey: data.profileImageKey || null,
          image: data.image || null,
          role: null,
        };

        const isAlready = !!data.alreadyMarked;

        const historyItem: ScanHistoryItem = {
          id: `${data.userId}-${data.timestamp || Date.now()}`,
          user: scannedUser,
          timestamp: new Date(data.timestamp || Date.now()),
          status: isAlready ? "already_marked" : "success",
          message: data.message || `Marked Present: ${data.userName}`,
        };

        setScanHistory((prev) => {
          const exists = prev.some((s) => s.user.id === data.userId);
          if (exists) return prev;
          return [historyItem, ...prev].slice(0, 100);
        });

        setLastScanned({
          user: scannedUser,
          status: isAlready ? "already_marked" : "success",
          message: historyItem.message,
          timestamp: historyItem.timestamp,
        });

        if (!isAlready) {
          playSuccessSound("success");
          toast.success(historyItem.message);
        } else {
          playSuccessSound("already");
          toast.info(historyItem.message);
        }

        // Notify parent page to update attendance count
        onScanSuccess?.();
      };

      const cleanupListener = onSocketEvent(
        "attendance-updated",
        handleAttendanceUpdated
      );
      cleanupFns.push(cleanupListener);
    });

    return () => {
      cleanupFns.forEach((fn) => fn());
    };
  }, [sessionId, onScanSuccess]);

  const qrCodeRef = useRef<Html5Qrcode | null>(null);
  const lastScannedTextRef = useRef<string>("");
  const lastScannedTimeRef = useRef<number>(0);

  const playSuccessSound = useCallback((type: "success" | "already" | "error") => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === "success") {
        // High pleasant ding-ding
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        osc.frequency.setValueAtTime(1174.66, audioCtx.currentTime + 0.1); // D6
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.35);
      } else if (type === "already") {
        // Double soft beep
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.2);
      } else {
        // Low error buzz
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.25);
      }
    } catch {
      // Audio context might be restricted before interaction
    }
  }, [soundEnabled]);

  const processScannedCode = useCallback(async (scannedText: string) => {
    if (!sessionId) {
      toast.error("Please select an attendance session first");
      return;
    }

    // Cooldown check (prevent repeated scanning of the exact same code within 3 seconds)
    const now = Date.now();
    if (
      lastScannedTextRef.current === scannedText &&
      now - lastScannedTimeRef.current < 3000
    ) {
      return;
    }

    lastScannedTextRef.current = scannedText;
    lastScannedTimeRef.current = now;
    setIsProcessing(true);

    try {
      const response = await fetch("/api/admin/attendance/scan-student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          qrContent: scannedText,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        playSuccessSound("error");
        toast.error(data.error || "Failed to process QR code");
        return;
      }

      const scannedUser: ScannedUser = data.user;
      const isAlready = !!data.alreadyMarked;

      if (isAlready) {
        playSuccessSound("already");
        toast.info(data.message);
      } else {
        playSuccessSound("success");
        toast.success(data.message);
        onScanSuccess?.();
      }

      const historyItem: ScanHistoryItem = {
        id: `${scannedUser.id}-${Date.now()}`,
        user: scannedUser,
        timestamp: new Date(),
        status: isAlready ? "already_marked" : "success",
        message: data.message,
      };

      setLastScanned({
        user: scannedUser,
        status: isAlready ? "already_marked" : "success",
        message: data.message,
        timestamp: new Date(),
      });

      setScanHistory((prev) => [historyItem, ...prev.filter((i) => i.user.id !== scannedUser.id)]);
    } catch (error) {
      console.error("Error processing QR:", error);
      playSuccessSound("error");
      toast.error("Network or server error while marking attendance");
    } finally {
      setIsProcessing(false);
    }
  }, [sessionId, onScanSuccess, playSuccessSound]);

  const [availableCameras, setAvailableCameras] = useState<
    { id: string; label: string }[]
  >([]);
  const [currentFacingMode, setCurrentFacingMode] = useState<"environment" | "user">(
    "environment"
  );
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");

  const startCamera = async (facingOrId?: string) => {
    setCameraError("");
    setIsScanning(true);

    // Wait for the container element to render in DOM
    setTimeout(async () => {
      try {
        const element = document.getElementById("admin-qr-reader");
        if (!element) {
          throw new Error("Scanner container not found in DOM");
        }

        if (qrCodeRef.current) {
          try {
            await qrCodeRef.current.stop();
            qrCodeRef.current.clear();
          } catch {}
          qrCodeRef.current = null;
        }

        const html5QrCode = new Html5Qrcode("admin-qr-reader");
        qrCodeRef.current = html5QrCode;

        try {
          const cameras = await Html5Qrcode.getCameras();
          if (cameras && cameras.length > 0) {
            setAvailableCameras(cameras);
          }
        } catch {}

        const config = {
          fps: 15,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0,
        };

        const target = facingOrId || selectedCameraId || currentFacingMode;

        try {
          if (target && target.length > 20) {
            await html5QrCode.start(
              target,
              config,
              (decodedText) => processScannedCode(decodedText),
              () => {}
            );
          } else {
            await html5QrCode.start(
              { facingMode: target === "user" ? "user" : "environment" },
              config,
              (decodedText) => processScannedCode(decodedText),
              () => {}
            );
          }
        } catch (firstErr) {
          console.warn("Back camera failed, trying front/default camera...", firstErr);
          const fallbackFacing = target === "user" ? "environment" : "user";
          setCurrentFacingMode(fallbackFacing);
          await html5QrCode.start(
            { facingMode: fallbackFacing },
            config,
            (decodedText) => processScannedCode(decodedText),
            () => {}
          );
        }
      } catch (err: any) {
        console.error("Error starting camera scanner:", err);
        let errorMsg = err?.message || "Could not access camera. Please check browser permissions.";
        if (
          typeof window !== "undefined" &&
          window.location.protocol !== "https:" &&
          window.location.hostname !== "localhost" &&
          window.location.hostname !== "127.0.0.1"
        ) {
          errorMsg = "Camera access requires HTTPS or localhost. If you are accessing via local IP (e.g. http://192.168.x.x:3000), open chrome://flags/#unsafely-treat-insecure-origin-as-secure in Chrome and add your URL.";
        }
        setCameraError(errorMsg);
        setIsScanning(false);
      }
    }, 150);
  };

  const toggleCameraFacing = async () => {
    const nextFacing = currentFacingMode === "environment" ? "user" : "environment";
    setCurrentFacingMode(nextFacing);
    setSelectedCameraId("");
    if (isScanning) {
      await stopCamera();
      await startCamera(nextFacing);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const tempScanner = new Html5Qrcode("admin-qr-file-helper");
      const decoded = await tempScanner.scanFile(file, true);
      tempScanner.clear();
      if (decoded) {
        processScannedCode(decoded);
      }
    } catch (err: any) {
      toast.error("Could not read QR code from image: " + (err?.message || "Invalid QR"));
    } finally {
      setIsProcessing(false);
      e.target.value = "";
    }
  };

  const stopCamera = async () => {
    if (qrCodeRef.current) {
      try {
        await qrCodeRef.current.stop();
        qrCodeRef.current.clear();
        qrCodeRef.current = null;
      } catch (err) {
        console.error("Error stopping camera:", err);
      }
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      if (qrCodeRef.current) {
        qrCodeRef.current.stop().catch(() => {}).finally(() => {
          qrCodeRef.current = null;
        });
      }
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) {
      toast.error("Please enter a User ID, Roll Number, or QR text");
      return;
    }
    processScannedCode(manualInput.trim());
    setManualInput("");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredHistory = scanHistory.filter((item) => {
    if (!historySearch.trim()) return true;
    const query = historySearch.toLowerCase();
    return (
      item.user.name.toLowerCase().includes(query) ||
      item.user.cbUserId?.toLowerCase().includes(query) ||
      item.user.rollNumber?.toLowerCase().includes(query) ||
      item.user.registration?.toLowerCase().includes(query) ||
      item.user.branch?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Left Column: Live Camera & Manual Input */}
      <div className="space-y-6 lg:col-span-7">
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Camera className="h-5 w-5 text-primary" />
                  Live Student QR Scanner
                </CardTitle>
                <CardDescription>
                  Scanning for session: <span className="font-semibold text-foreground">{sessionTitle}</span>
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? "Mute audio beep" : "Unmute audio beep"}
              >
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4 text-primary" />
                ) : (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Viewfinder / Camera Area */}
            <div className="relative overflow-hidden rounded-xl border bg-black/5 dark:bg-black/40 min-h-[300px] flex flex-col items-center justify-center p-2">
              {isScanning ? (
                <div className="w-full flex flex-col items-center">
                  <div
                    id="admin-qr-reader"
                    className="w-full max-w-[360px] rounded-lg overflow-hidden border-2 border-primary/40 shadow-inner"
                  />
                  {isProcessing && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-xs flex items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="font-medium text-sm">Processing student QR...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10 px-4 space-y-3">
                  <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto">
                    <QrCode className="h-10 w-10 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-base">Camera is currently inactive</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      Click below to turn on the camera and point it at the student&apos;s digital or printed QR code.
                    </p>
                  </div>
                </div>
              )}

              {cameraError && (
                <div className="mt-3 p-3 rounded-lg border border-destructive bg-destructive/10 text-destructive text-xs flex items-start gap-2 max-w-md">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}
            </div>

                {/* Hidden container for file scan */}
                <div id="admin-qr-file-helper" className="hidden" />

                {/* Camera Control Buttons */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    {isScanning ? (
                      <Button
                        variant="destructive"
                        onClick={stopCamera}
                        className="flex-1"
                        size="lg"
                      >
                        <CameraOff className="h-4 w-4 mr-2" />
                        Stop Camera Scanner
                      </Button>
                    ) : (
                      <Button
                        onClick={() => startCamera()}
                        disabled={!sessionId}
                        className="flex-1"
                        size="lg"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Start Camera Scanner
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="lg"
                      onClick={toggleCameraFacing}
                      disabled={!sessionId}
                      title={`Switch to ${currentFacingMode === "environment" ? "Front" : "Back"} Camera`}
                      className="px-3"
                    >
                      <SwitchCamera className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Secondary options: Camera switcher dropdown & Upload Image QR */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    {availableCameras.length > 1 ? (
                      <select
                        aria-label="Select Camera"
                        value={selectedCameraId}
                        onChange={(e) => {
                          setSelectedCameraId(e.target.value);
                          if (isScanning) {
                            stopCamera().then(() => startCamera(e.target.value));
                          }
                        }}
                        className="text-xs bg-muted/60 border rounded px-2 py-1.5 max-w-[200px] truncate"
                      >
                        <option value="">Default Camera ({currentFacingMode})</option>
                        {availableCameras.map((cam, idx) => (
                          <option key={cam.id} value={cam.id}>
                            {cam.label || `Camera ${idx + 1}`}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">
                        Camera: <span className="capitalize font-medium text-foreground">{currentFacingMode}</span>
                      </span>
                    )}

                    <label className={!sessionId ? "pointer-events-none opacity-50" : "cursor-pointer"}>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={!sessionId}
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={!sessionId}
                        className="h-7 text-xs text-muted-foreground hover:text-foreground"
                        asChild
                      >
                        <span>
                          <Upload className="h-3 w-3 mr-1" />
                          Scan Image
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>

            {/* Manual ID Input Fallback */}
            <div className="pt-3 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Manual Entry / Barcode Scanner Input
              </p>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <Input
                  placeholder="Enter CB User ID (e.g. GCEK-CB-944870), Roll No., or profile URL..."
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  disabled={isProcessing || !sessionId}
                  className="font-mono text-xs"
                />
                <Button type="submit" disabled={isProcessing || !manualInput.trim() || !sessionId}>
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Mark Present"
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Last Scanned Result & Live Scan Feed */}
      <div className="space-y-6 lg:col-span-5">
        {/* Last Scanned Result Card */}
        <Card className={lastScanned?.status === "success" ? "border-green-500/50 bg-green-50/20 dark:bg-green-950/10" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Latest Scan Result
              </span>
              {lastScanned && (
                <Badge
                  variant={lastScanned.status === "success" ? "default" : "secondary"}
                  className={lastScanned.status === "success" ? "bg-green-600 hover:bg-green-600" : ""}
                >
                  {lastScanned.status === "success" ? "Marked Present (+10 pts)" : "Already Present"}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastScanned ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-background shadow-xs">
                    {getUserProfileImageUrl(lastScanned.user) ? (
                      <AvatarImage
                        src={getUserProfileImageUrl(lastScanned.user)!}
                        alt={lastScanned.user.name}
                      />
                    ) : null}
                    <AvatarFallback className="font-bold bg-primary text-primary-foreground">
                      {getInitials(lastScanned.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base truncate">{lastScanned.user.name}</h3>
                    <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground mt-0.5">
                      {lastScanned.user.cbUserId && (
                        <span className="font-mono font-semibold text-primary">
                          {lastScanned.user.cbUserId}
                        </span>
                      )}
                      {lastScanned.user.branch && <span>• {lastScanned.user.branch}</span>}
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-muted/60 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Roll / Reg:</span>
                    <span className="font-medium">
                      {lastScanned.user.rollNumber || lastScanned.user.registration || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Scanned at:</span>
                    <span className="font-medium">
                      {format(lastScanned.timestamp, "hh:mm:ss a")}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-xs">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-40 text-muted-foreground" />
                No student scanned yet in this session. Start the camera or enter a User ID to mark attendance.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scanner Session History */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Scanned This Session ({scanHistory.length})
              </CardTitle>
              {scanHistory.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setScanHistory([]);
                    setLastScanned(null);
                  }}
                  className="h-7 text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Clear List
                </Button>
              )}
            </div>
            {scanHistory.length > 5 && (
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter scanned students..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            )}
          </CardHeader>
          <CardContent>
            {filteredHistory.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                <Clock className="h-6 w-6 mx-auto mb-1.5 opacity-40" />
                {scanHistory.length === 0
                  ? "Scanned students will appear here in real-time."
                  : "No students match your filter."}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredHistory.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border bg-card hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="h-8 w-8">
                        {getUserProfileImageUrl(item.user) ? (
                          <AvatarImage
                            src={getUserProfileImageUrl(item.user)!}
                            alt={item.user.name}
                          />
                        ) : null}
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {getInitials(item.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-xs truncate">{item.user.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {item.user.cbUserId || item.user.rollNumber || item.user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 shrink-0 ml-2">
                      <Badge
                        variant={item.status === "success" ? "default" : "outline"}
                        className={`text-[10px] px-1.5 py-0 ${item.status === "success" ? "bg-green-600 text-white" : ""}`}
                      >
                        {item.status === "success" ? "Present (+10)" : "Already Present"}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {format(item.timestamp, "hh:mm:ss a")}
                      </span>
                    </div>
                  </div>
                ))}

                {scanHistory.length > 4 && (
                  <p className="text-[11px] text-center text-muted-foreground pt-1">
                    Showing latest 4 of {scanHistory.length} scanned students
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
