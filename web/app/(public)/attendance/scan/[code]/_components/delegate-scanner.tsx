"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Html5Qrcode } from "html5-qrcode";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Wifi,
  WifiOff,
  ShieldAlert,
  Smartphone,
  SwitchCamera,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { format } from "date-fns";
import { initSocket, joinRoom, onSocketEvent, onSocketConnectionChange } from "@/lib/socket-client";
import { getUserProfileImageUrl } from "@/lib/image-utils";

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
  scannerName: string;
  isRemote: boolean; // true if scanned by another device
}

interface SessionInfo {
  sessionTitle: string;
  sessionNumber: number;
  sessionDate: string;
  sessionDay: string;
  totalMarked: number;
  expiresAt: string;
}

interface DelegateScannerProps {
  code: string;
}

export default function DelegateScanner({ code }: DelegateScannerProps) {
  const router = useRouter();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [isValidCode, setIsValidCode] = useState<boolean | null>(null); // null = loading
  const [errorMessage, setErrorMessage] = useState("");
  const [scannerName, setScannerName] = useState("");
  const [hasSetName, setHasSetName] = useState(false);

  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  const [lastScanned, setLastScanned] = useState<{
    user: ScannedUser;
    status: "success" | "already_marked";
    message: string;
    timestamp: Date;
  } | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [historySearch, setHistorySearch] = useState("");

  const qrCodeRef = useRef<Html5Qrcode | null>(null);
  const lastScannedTextRef = useRef("");
  const lastScannedTimeRef = useRef(0);

  // Validate code on mount
  useEffect(() => {
    const validateCode = async () => {
      try {
        const res = await fetch("/api/attendance/validate-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = await res.json();

        if (data.valid) {
          setIsValidCode(true);
          setSessionInfo(data);
        } else {
          setIsValidCode(false);
          setErrorMessage(data.error || "Invalid code");
        }
      } catch {
        setIsValidCode(false);
        setErrorMessage("Network error. Please check your connection.");
      }
    };
    validateCode();
  }, [code]);

  const playSound = useCallback(
    (type: "success" | "already" | "error") => {
      // Haptic vibration feedback for mobile / browser
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          if (type === "success") {
            navigator.vibrate([100, 50, 100]);
          } else if (type === "already") {
            navigator.vibrate(80);
          } else {
            navigator.vibrate([150, 80, 150]);
          }
        } catch {}
      }

      if (!soundEnabled) return;
      try {
        const audioCtx = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === "success") {
          osc.frequency.setValueAtTime(880, audioCtx.currentTime);
          osc.frequency.setValueAtTime(1174.66, audioCtx.currentTime + 0.1);
          gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioCtx.currentTime + 0.35
          );
          osc.start(audioCtx.currentTime);
          osc.stop(audioCtx.currentTime + 0.35);
        } else if (type === "already") {
          osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
          gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioCtx.currentTime + 0.2
          );
          osc.start(audioCtx.currentTime);
          osc.stop(audioCtx.currentTime + 0.2);
        } else {
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(220, audioCtx.currentTime);
          gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioCtx.currentTime + 0.25
          );
          osc.start(audioCtx.currentTime);
          osc.stop(audioCtx.currentTime + 0.25);
        }
      } catch {
        // Audio context restricted
      }
    },
    [soundEnabled]
  );

  // Fetch initial scan history for this session & background sync
  const fetchSessionScans = useCallback(async () => {
    if (!isValidCode || !hasSetName) return;
    try {
      const res = await fetch(`/api/attendance/session-scans?code=${code}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.scans)) {
        const items: ScanHistoryItem[] = data.scans.map((s: any) => ({
          id: `${s.userId}-${new Date(s.timestamp).getTime()}`,
          user: {
            id: s.userId,
            name: s.userName,
            email: s.userEmail || "",
            cbUserId: s.cbUserId || null,
            registration: s.registration || null,
            rollNumber: s.rollNumber || null,
            branch: s.branch || null,
            profileImageKey: s.profileImageKey || null,
            image: s.image || null,
            role: null,
          },
          timestamp: new Date(s.timestamp),
          status: "success",
          message: s.message || `Marked Present: ${s.userName}`,
          scannerName: s.scannerName || "Scanner",
          isRemote: s.scannerName !== (scannerName || "Me"),
        }));

        setScanHistory((prev) => {
          const existingUserIds = new Set(prev.map((p) => p.user.id));
          const newItems = items.filter((it) => !existingUserIds.has(it.user.id));
          if (newItems.length === 0 && prev.length > 0) return prev;
          return [...prev, ...newItems].slice(0, 100);
        });

        if (items.length > 0) {
          setLastScanned((curr) => {
            if (curr) return curr;
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
      // Silent error
    }
  }, [isValidCode, hasSetName, code, scannerName]);

  // Initial fetch and focus/visibility refresh
  useEffect(() => {
    fetchSessionScans();
    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        fetchSessionScans();
      }
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [fetchSessionScans]);

  // Socket.IO — join delegate room for real-time sync
  useEffect(() => {
    if (!isValidCode || !hasSetName) return;

    const cleanupFns: (() => void)[] = [];

    // Track real connection status
    const cleanupConn = onSocketConnectionChange((connected) => {
      setIsSocketConnected(connected);
    });
    cleanupFns.push(cleanupConn);

    initSocket().then((socket) => {
      if (!socket) return;

      setIsSocketConnected(socket.connected);

      const room = `attendance-delegate-${code}`;
      const cleanupRoom = joinRoom(room);
      cleanupFns.push(cleanupRoom);

      const cleanupListener = onSocketEvent(
        "delegate-scan",
        (data: any) => {
          console.log("⚡ [DelegateScanner] Remote scan received:", data);
          // Add to history if it's from another scanner
          const isRemote = data.scannerName !== scannerName;

          const historyItem: ScanHistoryItem = {
            id: `${data.userId}-${data.timestamp || Date.now()}`,
            user: {
              id: data.userId,
              name: data.userName,
              email: "",
              cbUserId: data.cbUserId || null,
              registration: data.registration || null,
              rollNumber: data.rollNumber || null,
              branch: data.branch || null,
              profileImageKey: data.profileImageKey || null,
              image: data.image || null,
              role: null,
            },
            timestamp: new Date(data.timestamp || Date.now()),
            status: data.alreadyMarked ? "already_marked" : "success",
            message: data.message,
            scannerName: data.scannerName || "Scanner",
            isRemote,
          };

          setScanHistory((prev) => {
            const exists = prev.some((s) => s.user.id === data.userId);
            if (exists) return prev;
            return [historyItem, ...prev].slice(0, 100);
          });

          // If it's from another device, update the lastScanned only for new marks
          if (isRemote && !data.alreadyMarked) {
            playSound("success");
            setLastScanned({
              user: historyItem.user,
              status: "success",
              message: historyItem.message,
              timestamp: historyItem.timestamp,
            });
          }
        }
      );
      cleanupFns.push(cleanupListener);
    });

    return () => {
      cleanupFns.forEach((fn) => fn());
    };
  }, [isValidCode, hasSetName, code, scannerName, playSound]);

  const processScannedCode = useCallback(
    async (scannedText: string) => {
      // Cooldown
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
        const response = await fetch("/api/attendance/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            qrContent: scannedText,
            scannerName,
          }),
        });

        const data = await response.json();

        if (!response.ok || data.error) {
          playSound("error");
          toast.error(data.error || "Failed to process QR code");
          return;
        }

        const scannedUser: ScannedUser = data.user;
        const isAlready = !!data.alreadyMarked;

        if (isAlready) {
          playSound("already");
          toast.info(data.message);
        } else {
          playSound("success");
          toast.success(data.message);
        }

        const scanDate = new Date();
        setLastScanned({
          user: scannedUser,
          status: isAlready ? "already_marked" : "success",
          message: data.message,
          timestamp: scanDate,
        });

        // Add to local history list immediately
        const historyItem: ScanHistoryItem = {
          id: `${scannedUser.id}-${scanDate.getTime()}`,
          user: scannedUser,
          timestamp: scanDate,
          status: isAlready ? "already_marked" : "success",
          message: data.message,
          scannerName: scannerName || "Me",
          isRemote: false,
        };

        setScanHistory((prev) => {
          const exists = prev.some(
            (s) => s.user.id === scannedUser.id && s.id === historyItem.id
          );
          if (exists) return prev;
          return [historyItem, ...prev].slice(0, 100);
        });
      } catch {
        playSound("error");
        toast.error("Network error while marking attendance");
      } finally {
        setIsProcessing(false);
      }
    },
    [code, scannerName, playSound]
  );

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

    setTimeout(async () => {
      try {
        const element = document.getElementById("delegate-qr-reader");
        if (!element) throw new Error("Scanner container not found in DOM");

        if (qrCodeRef.current) {
          try {
            await qrCodeRef.current.stop();
            qrCodeRef.current.clear();
          } catch {}
          qrCodeRef.current = null;
        }

        const html5QrCode = new Html5Qrcode("delegate-qr-reader");
        qrCodeRef.current = html5QrCode;

        // Try getting cameras list for switcher
        try {
          const cameras = await Html5Qrcode.getCameras();
          if (cameras && cameras.length > 0) {
            setAvailableCameras(cameras);
          }
        } catch {}

        const qrConfig = {
          fps: 15,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0,
        };

        const target = facingOrId || selectedCameraId || currentFacingMode;

        // Try preferred camera first
        try {
          if (target && target.length > 20) {
            // It's a specific camera ID
            await html5QrCode.start(
              target,
              qrConfig,
              (decodedText) => processScannedCode(decodedText),
              () => {}
            );
          } else {
            await html5QrCode.start(
              { facingMode: target === "user" ? "user" : "environment" },
              qrConfig,
              (decodedText) => processScannedCode(decodedText),
              () => {}
            );
          }
        } catch (firstErr) {
          console.warn("Primary camera start failed, trying fallback camera...", firstErr);
          // Fallback to opposite facing mode or default camera
          const fallbackFacing = target === "user" ? "environment" : "user";
          setCurrentFacingMode(fallbackFacing);
          await html5QrCode.start(
            { facingMode: fallbackFacing },
            qrConfig,
            (decodedText) => processScannedCode(decodedText),
            () => {}
          );
        }
      } catch (err: any) {
        console.error("Error starting camera scanner:", err);
        let errorMsg = err?.message || "Could not access camera.";
        
        if (
          typeof window !== "undefined" &&
          window.location.protocol !== "https:" &&
          window.location.hostname !== "localhost" &&
          window.location.hostname !== "127.0.0.1"
        ) {
          errorMsg = "Camera access requires HTTPS or localhost. If you are accessing via local IP (e.g. http://192.168.x.x:3000) on your phone, open chrome://flags/#unsafely-treat-insecure-origin-as-secure in Chrome and add your URL, or test on localhost / HTTPS.";
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
      // Create temporary scanner instance for file
      const tempScanner = new Html5Qrcode("delegate-qr-file-helper");
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
        qrCodeRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
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

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const filteredHistory = scanHistory.filter((item) => {
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    return (
      item.user.name.toLowerCase().includes(q) ||
      item.user.cbUserId?.toLowerCase().includes(q) ||
      item.user.rollNumber?.toLowerCase().includes(q) ||
      item.user.registration?.toLowerCase().includes(q) ||
      item.user.branch?.toLowerCase().includes(q)
    );
  });

  // Loading state
  if (isValidCode === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">
            Validating attendance code...
          </p>
        </div>
      </div>
    );
  }

  // Invalid code
  if (!isValidCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full border-destructive/30">
          <CardContent className="py-10 text-center space-y-4">
            <ShieldAlert className="h-12 w-12 mx-auto text-destructive" />
            <h2 className="text-lg font-bold">Invalid Attendance Code</h2>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <Button onClick={() => router.push("/attendance/scan")}>
              Try Another Code
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Scanner name entry
  if (!hasSetName) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
        <header className="w-full border-b bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto flex items-center gap-3 px-4 py-3">
            <Image
              src="/assets/logo.png"
              alt="CodeBreakers Logo"
              width={36}
              height={36}
              className="rounded-lg"
            />
            <div>
              <h1 className="text-base font-bold tracking-tight">
                CodeBreakers
              </h1>
              <p className="text-[10px] text-muted-foreground -mt-0.5">
                Attendance Scanner
              </p>
            </div>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-sm w-full shadow-lg border-primary/20">
            <CardHeader className="text-center pb-4">
              <div className="p-3 rounded-full bg-green-500/10 w-fit mx-auto mb-2">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-lg">Code Verified!</CardTitle>
              <CardDescription>
                Session #{sessionInfo?.sessionNumber}: {sessionInfo?.sessionTitle}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Your Scanner Name
                </label>
                <Input
                  placeholder="e.g. Scanner 1, Rahul's Phone"
                  value={scannerName}
                  onChange={(e) => setScannerName(e.target.value)}
                  className="mt-1.5"
                  autoFocus
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  This name will appear next to your scans on all devices.
                </p>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  if (!scannerName.trim()) {
                    setScannerName(`Scanner-${code.slice(0, 3)}`);
                  }
                  setHasSetName(true);
                }}
              >
                <Camera className="h-4 w-4 mr-2" />
                Start Scanning
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Main scanner interface
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="w-full border-b bg-background/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="container mx-auto flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <Image
              src="/assets/logo.png"
              alt="CodeBreakers Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold">
                  #{sessionInfo?.sessionNumber}: {sessionInfo?.sessionTitle}
                </h1>
                <Badge
                  variant="outline"
                  className="text-[9px] px-1.5 py-0 font-mono"
                >
                  {code}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Smartphone className="h-2.5 w-2.5" />
                  {scannerName}
                </span>
                <span className="flex items-center gap-1">
                  {isSocketConnected ? (
                    <>
                      <Wifi className="h-2.5 w-2.5 text-green-500" />
                      <span className="text-green-600">Live</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-2.5 w-2.5 text-destructive" />
                      <span className="text-destructive">Offline</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4 text-primary" />
            ) : (
              <VolumeX className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 container mx-auto p-4 space-y-4">
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Camera + Manual Input */}
          <div className="space-y-4 lg:col-span-7">
            <Card className="border-primary/20">
              <CardContent className="p-4 space-y-4">
                {/* Camera Area */}
                <div className="relative overflow-hidden rounded-xl border bg-black/5 dark:bg-black/40 min-h-[280px] flex flex-col items-center justify-center p-2">
                  {isScanning ? (
                    <div className="w-full flex flex-col items-center">
                      <div
                        id="delegate-qr-reader"
                        className="w-full max-w-[340px] rounded-lg overflow-hidden border-2 border-primary/40 shadow-inner"
                      />
                      {isProcessing && (
                        <div className="absolute inset-0 bg-background/60 backdrop-blur-xs flex items-center justify-center gap-2">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          <span className="font-medium text-sm">
                            Processing...
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 px-4 space-y-3">
                      <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto">
                        <QrCode className="h-10 w-10 text-primary" />
                      </div>
                      <p className="font-medium text-sm">
                        Camera is currently inactive
                      </p>
                      <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                        Tap below to start the camera and point it at student QR
                        codes.
                      </p>
                    </div>
                  )}

                  {cameraError && (
                    <div className="mt-3 p-3 rounded-lg border border-destructive bg-destructive/10 text-destructive text-xs flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{cameraError}</span>
                    </div>
                  )}
                </div>

                {/* Hidden container for file scan */}
                <div id="delegate-qr-file-helper" className="hidden" />

                {/* Camera Controls */}
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
                        Stop Camera
                      </Button>
                    ) : (
                      <Button
                        onClick={() => startCamera()}
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

                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
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

                {/* Manual Entry */}
                <div className="pt-3 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Manual Entry
                  </p>
                  <form
                    onSubmit={handleManualSubmit}
                    className="flex gap-2"
                  >
                    <Input
                      placeholder="Enter CB User ID, Roll No., or URL..."
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      disabled={isProcessing}
                      className="font-mono text-xs"
                    />
                    <Button
                      type="submit"
                      disabled={isProcessing || !manualInput.trim()}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Mark"
                      )}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Last Scanned + Live Feed */}
          <div className="space-y-4 lg:col-span-5">
            {/* Last Scanned */}
            <Card
              className={
                lastScanned?.status === "success"
                  ? "border-green-500/50 bg-green-50/20 dark:bg-green-950/10"
                  : ""
              }
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Latest Scan
                  </span>
                  {lastScanned && (
                    <Badge
                      variant={
                        lastScanned.status === "success"
                          ? "default"
                          : "secondary"
                      }
                      className={
                        lastScanned.status === "success"
                          ? "bg-green-600 hover:bg-green-600"
                          : ""
                      }
                    >
                      {lastScanned.status === "success"
                        ? "+10 pts"
                        : "Already Present"}
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
                        <h3 className="font-bold text-base truncate">
                          {lastScanned.user.name}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground mt-0.5">
                          {lastScanned.user.cbUserId && (
                            <span className="font-mono font-semibold text-primary">
                              {lastScanned.user.cbUserId}
                            </span>
                          )}
                          {lastScanned.user.branch && (
                            <span>• {lastScanned.user.branch}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-muted/60 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Roll / Reg:
                        </span>
                        <span className="font-medium">
                          {lastScanned.user.rollNumber ||
                            lastScanned.user.registration ||
                            "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Scanned at:
                        </span>
                        <span className="font-medium">
                          {format(lastScanned.timestamp, "hh:mm:ss a")}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground text-xs">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No student scanned yet. Start the camera to begin.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Live Scan Feed from ALL Devices */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Live Feed ({scanHistory.filter((s) => !s.status?.includes("already")).length})
                  </CardTitle>
                  <div className="flex items-center gap-2">
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
                        Clear
                      </Button>
                    )}
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      {isSocketConnected ? (
                        <Wifi className="h-3 w-3 text-green-500" />
                      ) : (
                        <WifiOff className="h-3 w-3 text-destructive" />
                      )}
                    </div>
                  </div>
                </div>
                {scanHistory.length > 5 && (
                  <div className="relative mt-2">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Filter students..."
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
                      ? "Scans from all devices will appear here in real-time."
                      : "No students match your filter."}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {filteredHistory.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                          item.isRemote
                            ? "bg-blue-50/30 dark:bg-blue-950/10 border-blue-200/50 dark:border-blue-800/30"
                            : "bg-card hover:bg-muted/40"
                        }`}
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
                            <p className="font-medium text-xs truncate">
                              {item.user.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              {item.user.cbUserId ||
                                item.user.rollNumber ||
                                item.user.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 shrink-0 ml-2">
                          <Badge
                            variant={
                              item.status === "success" ? "default" : "outline"
                            }
                            className={`text-[10px] px-1.5 py-0 ${
                              item.status === "success"
                                ? "bg-green-600 text-white"
                                : ""
                            }`}
                          >
                            {item.status === "success"
                              ? "+10"
                              : "Already"}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Smartphone className="h-2.5 w-2.5" />
                            {item.scannerName}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {format(item.timestamp, "hh:mm:ss a")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-2 text-center">
        <p className="text-[10px] text-muted-foreground">
          © {new Date().getFullYear()} CodeBreakers GCEK • Delegated Scanner
        </p>
      </footer>
    </div>
  );
}
