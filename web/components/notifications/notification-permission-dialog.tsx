"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  BellRing,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import {
  getNotificationPermission,
  requestNotificationPermission,
  isNotificationSupported,
  playAttendanceChime,
  showBrowserNotification,
  NotificationPermissionStatus,
} from "@/lib/browser-notifications";
import { toast } from "sonner";

/* ─── Authentic Original SVG Platform & Browser Icons ─── */

function WindowsLogoSvg({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 88 88" className={className} fill="currentColor">
      <path d="M0 12.402l35.687-4.86.016 34.423-35.67.203zm35.67 33.529l.028 34.453L.028 75.48.001 45.728zm4.326-39.043L87.914 0v41.526l-47.918.375zm47.918 39.959l-.015 41.555-47.887-6.735v-34.444z" />
    </svg>
  );
}

function AndroidLogoSvg({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17.523 15.341a.987.987 0 0 1-.986.987.987.987 0 0 1-.987-.987.987.987 0 0 1 .987-.987.987.987 0 0 1 .986.987zm-11.046 0a.987.987 0 0 1-.987.987.987.987 0 0 1-.987-.987.987.987 0 0 1 .987-.987.987.987 0 0 1 .987.987zM18.064 9.17l1.79-3.1a.49.49 0 0 0-.18-.67.493.493 0 0 0-.672.18l-1.82 3.153A11.77 11.77 0 0 0 12 7.89c-1.84 0-3.56.326-5.182.843L4.998 5.58a.493.493 0 0 0-.672-.18.49.49 0 0 0-.18.67l1.79 3.1C2.518 10.978.22 13.905 0 17.438h24c-.22-3.533-2.518-6.46-5.936-8.268z" />
    </svg>
  );
}

function AppleLogoSvg({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 170 170" className={className} fill="currentColor">
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.7-7.85-12.01-14.44-5.32-8.13-9.54-17.5-12.67-28.12-3.12-10.63-4.68-20.9-4.68-30.82 0-14.07 3.65-25.75 10.95-35.03 7.3-9.28 16.32-13.98 27.06-14.1 4.79 0 10.23 1.25 16.32 3.75 6.1 2.5 10.02 3.82 11.77 3.96 1.48-.14 5.66-1.57 12.54-4.29 6.88-2.72 12.82-3.9 17.82-3.54 13.59.87 24.08 5.76 31.47 14.67-12.18 7.39-18.15 17.38-17.9 29.98.24 9.87 4.07 18.23 11.48 25.07 7.42 6.85 16.14 10.74 26.17 11.69-2.22 6.81-4.8 13.78-7.75 20.91zM119.22 33.45c0-7.39 2.65-14.28 7.96-20.67 5.3-6.39 11.96-10.65 19.98-12.78 1.07 7.72-.94 14.93-6.03 21.63-5.08 6.7-11.83 10.87-20.25 12.5-.23-.23-.97-.45-.97-.68-.23-.23-.69-.45-.69-.68z" />
    </svg>
  );
}

function ChromeLogoSvg({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <circle cx="12" cy="12" r="10" fill="#ffffff" />
      <path d="M12 2C6.48 2 2 6.48 2 12c0 .48.04.95.1 1.41l7.85-7.85C10.61 5.21 11.29 5 12 5h9.54C19.78 3.19 16.08 2 12 2z" fill="#EA4335" />
      <path d="M21.54 5H12c-.71 0-1.39.21-1.95.56l-3.3 5.72 4.3 7.44c.31.05.63.08.95.08 4.08 0 7.78-2.45 9.4-6.04.4-1.07.6-2.2.6-3.36 0-1.58-.38-3.08-1.06-4.4z" fill="#4285F4" />
      <path d="M12 19c-.32 0-.64-.03-.95-.08L6.75 11.48 2.1 13.41C3.47 18.25 7.84 21.8 13 21.98l4.4-7.62c-.93 1.34-2.46 2.22-4.2 2.22L12 19z" fill="#34A853" />
      <path d="M6.75 11.48l3.3-5.72C9.49 5.21 8.81 5 8.1 5H2.46C2.16 6.07 2 7.2 2 8.38c0 1.25.18 2.45.51 3.59l4.24-.49z" fill="#FBBC05" />
      <circle cx="12" cy="12" r="4.5" fill="#ffffff" />
      <circle cx="12" cy="12" r="3.5" fill="#1A73E8" />
    </svg>
  );
}

function IosShareIconSvg({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function AddToHomeIconSvg({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function LockKeyholeIconSvg({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ToggleOnIconSvg({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="5" width="22" height="14" rx="7" fill="currentColor" fillOpacity="0.2" />
      <circle cx="16" cy="12" r="5" fill="currentColor" />
    </svg>
  );
}

interface NotificationPermissionDialogProps {
  userId?: string | null;
  userName?: string | null;
  forceOpen?: boolean;
  onClose?: () => void;
}

type DevicePlatform = "windows" | "android" | "ios" | "mac";

export function NotificationPermissionDialog({
  userId,
  userName,
  forceOpen = false,
  onClose,
}: NotificationPermissionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermissionStatus>("default");
  const [activePlatform, setActivePlatform] = useState<DevicePlatform>("windows");
  const [isChecking, setIsChecking] = useState(false);
  const [justGranted, setJustGranted] = useState(false);
  
  // Guard against duplicate toast / sound executions
  const hasNotifiedRef = useRef(false);

  // Detect user operating system on client mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("android")) {
      setActivePlatform("android");
    } else if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) {
      setActivePlatform("ios");
    } else if (ua.includes("macintosh") || ua.includes("mac os")) {
      setActivePlatform("mac");
    } else {
      setActivePlatform("windows");
    }
  }, []);

  const triggerSingleSuccess = useCallback(async () => {
    if (hasNotifiedRef.current) return;
    hasNotifiedRef.current = true;

    setJustGranted(true);
    playAttendanceChime();
    
    await showBrowserNotification("Attendance Alerts Active! 🔔", {
      body: `Hi ${userName || "Member"}! You are all set to receive live attendance and reward notifications.`,
      tag: "cb-notif-granted-alert",
    });

    toast.success("Notifications Enabled Successfully! 🔔", {
      id: "cb-notif-perm-toast",
      description: "You will now receive real-time attendance and point updates on this device.",
    });

    setTimeout(() => {
      setIsOpen(false);
      setJustGranted(false);
      onClose?.();
    }, 1500);
  }, [userName, onClose]);

  const checkPermissionState = useCallback(() => {
    if (!isNotificationSupported()) {
      setPermission("unsupported");
      return;
    }
    const current = getNotificationPermission();
    setPermission(current);

    if (current === "granted") {
      setIsOpen(false);
    } else if (current === "default" || current === "denied") {
      const dismissed = sessionStorage.getItem("cb_notif_modal_dismissed");
      if (forceOpen || !dismissed) {
        setIsOpen(true);
      }
    }
  }, [forceOpen]);

  // Initial permission check & active permission listener
  useEffect(() => {
    if (!userId) return;

    checkPermissionState();

    let permissionStatusObj: PermissionStatus | null = null;
    let changeHandler: (() => void) | null = null;

    if (typeof navigator !== "undefined" && "permissions" in navigator) {
      navigator.permissions
        .query({ name: "notifications" as PermissionName })
        .then((status) => {
          permissionStatusObj = status;
          changeHandler = () => {
            const newPerm = status.state as NotificationPermissionStatus;
            setPermission(newPerm);
            if (newPerm === "granted") {
              triggerSingleSuccess();
            }
          };
          status.addEventListener("change", changeHandler);
        })
        .catch(() => {});
    }

    return () => {
      if (permissionStatusObj && changeHandler) {
        permissionStatusObj.removeEventListener("change", changeHandler);
      }
    };
  }, [userId, checkPermissionState, triggerSingleSuccess]);

  // Handle Requesting Permission (Default State)
  const handleAllowNotifications = async () => {
    if (isChecking) return;
    setIsChecking(true);
    try {
      const newPerm = await requestNotificationPermission();
      setPermission(newPerm);

      if (newPerm === "granted") {
        await triggerSingleSuccess();
      } else if (newPerm === "denied") {
        toast.error("Notifications were blocked", {
          id: "cb-notif-perm-toast",
          description: "Follow the device steps below to unblock notifications.",
        });
      }
    } catch (err) {
      console.warn("Failed to request permission:", err);
    } finally {
      setIsChecking(false);
    }
  };

  // Handle Manual "Check Again" when Denied
  const handleRecheckPermission = async () => {
    if (isChecking) return;
    setIsChecking(true);
    const current = getNotificationPermission();
    setPermission(current);

    if (current === "granted") {
      await triggerSingleSuccess();
    } else {
      toast.error("Notifications are still blocked", {
        id: "cb-notif-perm-toast",
        description: "Please change the setting to 'Allow' in your browser address bar.",
      });
    }
    setIsChecking(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem("cb_notif_modal_dismissed", "true");
    setIsOpen(false);
    onClose?.();
  };

  if (!userId || !isOpen || permission === "granted" || permission === "unsupported") {
    return null;
  }

  const isBlocked = permission === "denied";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="max-w-md sm:max-w-lg p-0 max-h-[88dvh] flex flex-col overflow-hidden border-border/80 bg-card shadow-2xl rounded-2xl">
        {/* ── Top Visual Header ── */}
        <div
          className={`p-4 sm:p-6 text-center border-b border-border/40 shrink-0 relative ${
            justGranted
              ? "bg-emerald-500/15"
              : isBlocked
              ? "bg-amber-500/10 dark:bg-amber-500/15"
              : "bg-primary/10"
          }`}
        >
          <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center relative mb-2.5 sm:mb-3 shadow-md transition-all">
            {justGranted ? (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center animate-in zoom-in-50">
                <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
            ) : isBlocked ? (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center relative">
                <BellRing className="w-6 h-6 sm:w-7 sm:h-7" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-card" />
              </div>
            )}
          </div>

          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-mono">
              {justGranted
                ? "Notifications Active! 🎉"
                : isBlocked
                ? "Notifications Are Blocked"
                : "Enable Attendance Alerts"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
              {justGranted
                ? "You will now receive real-time push alerts and chime sounds on this device."
                : isBlocked
                ? "Your browser is currently blocking notifications. Follow the steps below to allow attendance & point alerts."
                : "Get instant sound chimes and push notifications whenever an admin scans your QR or marks attendance."}
            </DialogDescription>
          </DialogHeader>

          {isBlocked && (
            <div className="mt-2.5 sm:mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] sm:text-xs font-mono font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Action Required: Unblock in Browser</span>
            </div>
          )}
        </div>

        {/* ── Body Content ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
          {/* CASE 1: PERMISSION IS DEFAULT (Prompt with 1-Click Allow) */}
          {!isBlocked && !justGranted && (
            <div className="space-y-4">
              <div className="grid gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Instant Attendance Verification</p>
                    <p className="text-muted-foreground text-[11px] mt-0.5">
                      Receive an instant sound chime & push banner with your +10 PTS whenever scanned.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Task & Quiz Evaluations</p>
                    <p className="text-muted-foreground text-[11px] mt-0.5">
                      Get alerted as soon as your task submissions and quizzes are approved.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                    <ChromeLogoSvg className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Multi-Device Support</p>
                    <p className="text-muted-foreground text-[11px] mt-0.5">
                      Delivered seamlessly to Android, iPhone, Windows & macOS devices.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handleAllowNotifications}
                  disabled={isChecking}
                  className="flex-1 h-10 font-mono font-bold text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl cursor-pointer gap-2"
                >
                  {isChecking ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Requesting...</span>
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4" />
                      <span>Allow Notifications</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleDismiss}
                  disabled={isChecking}
                  className="h-10 text-xs text-muted-foreground hover:text-foreground font-mono rounded-xl"
                >
                  Maybe Later
                </Button>
              </div>
            </div>
          )}

          {/* CASE 2: PERMISSION IS BLOCKED / DENIED (Step-by-Step Device Guide) */}
          {isBlocked && !justGranted && (
            <div className="space-y-4">
              {/* Platform Switcher Tabs */}
              <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-muted/60 border border-border/60 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setActivePlatform("windows")}
                  className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activePlatform === "windows"
                      ? "bg-background text-foreground shadow-xs font-bold border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <WindowsLogoSvg className="w-3.5 h-3.5 text-[#0078D4]" />
                  <span className="hidden sm:inline">Windows</span>
                  <span className="sm:hidden">PC</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePlatform("android")}
                  className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activePlatform === "android"
                      ? "bg-background text-foreground shadow-xs font-bold border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <AndroidLogoSvg className="w-3.5 h-3.5 text-[#3DDC84]" />
                  <span>Android</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePlatform("ios")}
                  className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activePlatform === "ios"
                      ? "bg-background text-foreground shadow-xs font-bold border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <AppleLogoSvg className="w-3.5 h-3.5" />
                  <span>iOS</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePlatform("mac")}
                  className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activePlatform === "mac"
                      ? "bg-background text-foreground shadow-xs font-bold border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <AppleLogoSvg className="w-3.5 h-3.5" />
                  <span>macOS</span>
                </button>
              </div>

              {/* Instructions Panel per Device */}
              <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3">
                {activePlatform === "windows" && (
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center gap-2 pb-1 border-b border-border/40 font-bold text-foreground">
                      <WindowsLogoSvg className="w-4 h-4 text-[#0078D4]" />
                      <span>Unblock in Windows Browser:</span>
                    </div>
                    <ol className="space-y-2.5 text-muted-foreground pl-1 text-[11px] leading-relaxed">
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                          1
                        </span>
                        <span>
                          Click the <strong className="text-foreground inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/80 border border-border/60"><LockKeyholeIconSvg className="w-3 h-3 text-muted-foreground" /> Lock / Tune icon</strong> on the left side of the address bar.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                          2
                        </span>
                        <span>
                          Find <strong className="text-foreground">Notifications</strong> in the permissions dropdown list.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                          3
                        </span>
                        <span>
                          Switch the toggle from <strong className="text-rose-500 font-semibold">Block</strong> to <strong className="text-emerald-500 font-semibold">Allow</strong>.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                          4
                        </span>
                        <span>
                          Click <strong className="text-foreground font-semibold">&quot;Check Again&quot;</strong> below.
                        </span>
                      </li>
                    </ol>
                  </div>
                )}

                {activePlatform === "android" && (
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center gap-2 pb-1 border-b border-border/40 font-bold text-foreground">
                      <AndroidLogoSvg className="w-4 h-4 text-[#3DDC84]" />
                      <span>Unblock in Android (Chrome / Samsung):</span>
                    </div>
                    <ol className="space-y-2.5 text-muted-foreground pl-1 text-[11px] leading-relaxed">
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                          1
                        </span>
                        <span>
                          Tap the <strong className="text-foreground inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/80 border border-border/60"><LockKeyholeIconSvg className="w-3 h-3 text-muted-foreground" /> Lock icon</strong> or <strong>⋮ Menu &gt; Settings</strong> in your browser.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                          2
                        </span>
                        <span>
                          Tap <strong className="text-foreground">Permissions</strong> &rarr; <strong className="text-foreground">Notifications</strong>.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                          3
                        </span>
                        <span>
                          Toggle the switch to <strong className="text-emerald-500 font-semibold inline-flex items-center gap-1"><ToggleOnIconSvg className="w-3.5 h-3.5 text-emerald-500" /> Allow</strong>.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                          4
                        </span>
                        <span>
                          Click <strong className="text-foreground font-semibold">&quot;Check Again&quot;</strong> below.
                        </span>
                      </li>
                    </ol>
                  </div>
                )}

                {activePlatform === "ios" && (
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center gap-2 pb-1 border-b border-border/40 font-bold text-foreground">
                      <AppleLogoSvg className="w-4 h-4" />
                      <span>Enable on iPhone / iPad (iOS Safari):</span>
                    </div>
                    <ol className="space-y-2.5 text-muted-foreground pl-1 text-[11px] leading-relaxed">
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                          1
                        </span>
                        <span>
                          In Safari, tap the <strong className="text-foreground inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/80 border border-border/60"><IosShareIconSvg className="w-3 h-3 text-primary" /> Share icon</strong> at the bottom bar.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                          2
                        </span>
                        <span>
                          Scroll down and tap <strong className="text-foreground inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/80 border border-border/60"><AddToHomeIconSvg className="w-3 h-3 text-foreground" /> Add to Home Screen</strong>.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                          3
                        </span>
                        <span>
                          Open <strong className="text-foreground">CodeBreakers</strong> from your Home Screen & allow notifications.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                          4
                        </span>
                        <span>
                          In <strong className="text-foreground">iOS Settings &gt; Notifications &gt; CodeBreakers</strong>, ensure <strong className="text-emerald-500 font-semibold">Allow Notifications</strong> is ON.
                        </span>
                      </li>
                    </ol>
                  </div>
                )}

                {activePlatform === "mac" && (
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center gap-2 pb-1 border-b border-border/40 font-bold text-foreground">
                      <AppleLogoSvg className="w-4 h-4" />
                      <span>Unblock on macOS (Safari / Chrome):</span>
                    </div>
                    <ol className="space-y-2.5 text-muted-foreground pl-1 text-[11px] leading-relaxed">
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                          1
                        </span>
                        <span>
                          Click the <strong className="text-foreground inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/80 border border-border/60"><LockKeyholeIconSvg className="w-3 h-3 text-muted-foreground" /> Lock icon</strong> in the URL bar &rarr; change <strong className="text-foreground">Notifications</strong> to <strong className="text-emerald-500 font-semibold">Allow</strong>.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                          2
                        </span>
                        <span>
                          Open <strong className="text-foreground inline-flex items-center gap-1"><AppleLogoSvg className="w-3 h-3" /> Menu &gt; System Settings &gt; Notifications</strong>.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                          3
                        </span>
                        <span>
                          Select your browser (Google Chrome / Safari) and enable <strong className="text-emerald-500 font-semibold">Allow Notifications</strong>.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                          4
                        </span>
                        <span>
                          Click <strong className="text-foreground font-semibold">&quot;Check Again&quot;</strong> below.
                        </span>
                      </li>
                    </ol>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handleRecheckPermission}
                  disabled={isChecking}
                  className="flex-1 h-10 font-mono font-bold text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl cursor-pointer gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`} />
                  <span>I&apos;ve Enabled It (Check Again)</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleDismiss}
                  disabled={isChecking}
                  className="h-10 text-xs text-muted-foreground hover:text-foreground font-mono rounded-xl"
                >
                  I&apos;ll Do This Later
                </Button>
              </div>
            </div>
          )}

          {/* CASE 3: JUST GRANTED (Celebration) */}
          {justGranted && (
            <div className="py-4 text-center space-y-2 animate-in fade-in">
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                🎉 Real-time alerts are now fully configured!
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                You will be notified live whenever an attendance session or task is recorded.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

