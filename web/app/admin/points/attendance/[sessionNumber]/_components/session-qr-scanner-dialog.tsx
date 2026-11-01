"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Camera,
  CameraOff,
  AlertCircle,
  Loader2,
  Volume2,
  VolumeX,
  QrCode,
  RotateCw,
} from "lucide-react";
import { format } from "date-fns";
import { getUserProfileImageUrl } from "@/lib/image-utils";

interface SessionQRScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  sessionTitle: string;
  onScanSuccess?: (user: {
    id: string;
    name: string;
    cbUserId: string | null;
    registration?: string | null;
    rollNumber?: string | null;
  }) => void;
}

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

export default function SessionQRScannerDialog({
  open,
  onOpenChange,
  sessionId,
  sessionTitle,
  onScanSuccess,
}: SessionQRScannerDialogProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastScanned, setLastScanned] = useState<{
    user: ScannedUser;
    alreadyMarked: boolean;
    timestamp: Date;
  } | null>(null);

  const qrCodeRef = useRef<Html5Qrcode | null>(null);
  const lastScannedTextRef = useRef<string>("");
  const lastScannedTimeRef = useRef<number>(0);

  const playChime = useCallback(
    (type: "success" | "already" | "error") => {
      if (!soundEnabled) return;
      try {
        const audioCtx = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === "success") {
          osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
          osc.frequency.setValueAtTime(1174.66, audioCtx.currentTime + 0.1); // D6
          gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioCtx.currentTime + 0.35,
          );
          osc.start(audioCtx.currentTime);
          osc.stop(audioCtx.currentTime + 0.35);
        } else if (type === "already") {
          osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
          gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioCtx.currentTime + 0.2,
          );
          osc.start(audioCtx.currentTime);
          osc.stop(audioCtx.currentTime + 0.2);
        } else {
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(220, audioCtx.currentTime);
          gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioCtx.currentTime + 0.25,
          );
          osc.start(audioCtx.currentTime);
          osc.stop(audioCtx.currentTime + 0.25);
        }
      } catch {
        // Audio context might be restricted
      }
    },
    [soundEnabled],
  );

  const processScan = useCallback(
    async (scannedText: string) => {
      if (!sessionId) {
        toast.error("Session ID is missing");
        return;
      }

      // 2.5 second cooldown for the exact same QR
      const now = Date.now();
      if (
        lastScannedTextRef.current === scannedText &&
        now - lastScannedTimeRef.current < 2500
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
          playChime("error");
          toast.error(data.error || "Failed to process student QR");
          return;
        }

        const user: ScannedUser = data.user;
        const isAlready = !!data.alreadyMarked;

        if (isAlready) {
          playChime("already");
          toast.info(`${user.name} is already marked Present`);
        } else {
          playChime("success");
          toast.success(`Attendance marked for ${user.name} (+10 pts)`);
          onScanSuccess?.(user);
        }

        setLastScanned({
          user,
          alreadyMarked: isAlready,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("Scan error:", error);
        playChime("error");
        toast.error("Error processing QR code");
      } finally {
        setIsProcessing(false);
      }
    },
    [sessionId, playChime, onScanSuccess],
  );

  const startCamera = useCallback(async () => {
    setCameraError("");
    setIsScanning(true);

    setTimeout(async () => {
      try {
        const element = document.getElementById("session-dialog-qr-reader");
        if (!element) return;

        // Cleanup any old instance
        if (qrCodeRef.current) {
          try {
            await qrCodeRef.current.stop();
            qrCodeRef.current.clear();
          } catch {}
          qrCodeRef.current = null;
        }

        const html5QrCode = new Html5Qrcode("session-dialog-qr-reader");
        qrCodeRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0,
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            processScan(decodedText);
          },
          () => {},
        );
      } catch (err: any) {
        console.error("Camera start error:", err);
        setCameraError(
          err?.message ||
            "Could not access camera. Please check device permissions.",
        );
        setIsScanning(false);
      }
    }, 150);
  }, [processScan]);

  const stopCamera = useCallback(async () => {
    if (qrCodeRef.current) {
      try {
        await qrCodeRef.current.stop();
        qrCodeRef.current.clear();
      } catch (e) {
        console.error("Error stopping camera:", e);
      } finally {
        qrCodeRef.current = null;
      }
    }
    setIsScanning(false);
  }, []);

  // Auto-start camera when dialog opens, stop when closed
  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
      setLastScanned(null);
      setCameraError("");
      setManualInput("");
    }
    return () => {
      stopCamera();
    };
  }, [open, startCamera, stopCamera]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) {
      toast.error("Please enter a User ID or Roll Number");
      return;
    }
    processScan(manualInput.trim());
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-4 sm:p-6 overflow-hidden">
        <DialogHeader className="pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Camera className="h-5 w-5 text-primary" />
              Scan Student QR
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="h-8 w-8 p-0"
              title={soundEnabled ? "Mute audio" : "Unmute audio"}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-primary" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          <DialogDescription className="text-xs">
            {sessionTitle} — Point camera at student QR code
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* Camera Viewfinder */}
          <div className="relative overflow-hidden rounded-xl border bg-black/10 dark:bg-black/50 min-h-[260px] flex flex-col items-center justify-center p-2">
            {isScanning ? (
              <div className="w-full flex flex-col items-center">
                <div
                  id="session-dialog-qr-reader"
                  className="w-full max-w-[280px] rounded-lg overflow-hidden border-2 border-primary/40 shadow-inner"
                />
                {isProcessing && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-xs flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="font-medium text-xs">
                      Marking attendance...
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 px-4 space-y-2">
                <QrCode className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
                <p className="text-xs text-muted-foreground">
                  Camera is turned off
                </p>
                <Button size="sm" onClick={startCamera} className="text-xs h-8">
                  <RotateCw className="h-3.5 w-3.5 mr-1" />
                  Restart Camera
                </Button>
              </div>
            )}

            {cameraError && (
              <div className="mt-2 p-2.5 rounded-lg border border-destructive bg-destructive/10 text-destructive text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{cameraError}</span>
              </div>
            )}
          </div>

          {/* Camera Controls */}
          <div className="flex gap-2">
            {isScanning ? (
              <Button
                variant="outline"
                size="sm"
                onClick={stopCamera}
                className="w-full text-xs h-8"
              >
                <CameraOff className="h-3.5 w-3.5 mr-1" />
                Pause Camera
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={startCamera}
                className="w-full text-xs h-8"
              >
                <Camera className="h-3.5 w-3.5 mr-1" />
                Resume Camera
              </Button>
            )}
          </div>

          {/* Last Scanned Result Banner */}
          {lastScanned && (
            <div
              className={`p-3 rounded-lg border flex items-center gap-3 transition-all ${
                lastScanned.alreadyMarked
                  ? "bg-amber-500/10 border-amber-500/30"
                  : "bg-green-500/10 border-green-500/30"
              }`}
            >
              <Avatar className="h-10 w-10 border border-background">
                {getUserProfileImageUrl(lastScanned.user) ? (
                  <AvatarImage
                    src={getUserProfileImageUrl(lastScanned.user)!}
                    alt={lastScanned.user.name}
                  />
                ) : null}
                <AvatarFallback className="text-xs font-bold bg-primary text-primary-foreground">
                  {getInitials(lastScanned.user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-xs truncate">
                    {lastScanned.user.name}
                  </p>
                  <Badge
                    variant={lastScanned.alreadyMarked ? "outline" : "default"}
                    className={`text-[9px] px-1 py-0 ${
                      lastScanned.alreadyMarked
                        ? "text-amber-600 border-amber-500/40"
                        : "bg-green-600 text-white"
                    }`}
                  >
                    {lastScanned.alreadyMarked
                      ? "Already Present"
                      : "Present (+10)"}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground font-mono">
                  {lastScanned.user.cbUserId ||
                    lastScanned.user.rollNumber ||
                    lastScanned.user.email}
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {format(lastScanned.timestamp, "hh:mm:ss a")}
              </span>
            </div>
          )}

          {/* Manual Entry Fallback */}
          <div className="pt-2 border-t">
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <Input
                placeholder="Type User ID, Roll No, or link..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                disabled={isProcessing}
                className="font-mono text-xs h-8"
              />
              <Button
                type="submit"
                size="sm"
                disabled={isProcessing || !manualInput.trim()}
                className="text-xs h-8 shrink-0"
              >
                {isProcessing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Submit"
                )}
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
