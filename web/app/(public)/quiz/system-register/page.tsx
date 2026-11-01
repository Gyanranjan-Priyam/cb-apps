/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  registerExternalSystem,
  getSystemState,
  unregisterExternalSystem,
  getIsExternalQuizActiveAction,
} from "@/app/admin/quizzes/actions";
import { Monitor, Key, Loader2, CheckCircle2, Clock, AlertTriangle, Layers, PowerOff, RefreshCw } from "lucide-react";
import { getSocket, initSocket, joinRoom, disconnectSocket } from "@/lib/socket-client";

export default function SystemRegisterPage() {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState("");
  const [systemNumber, setSystemNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // External quiz activation status
  const [isQuizSystemActive, setIsQuizSystemActive] = useState<boolean | null>(null);
  const [isCheckingActive, setIsCheckingActive] = useState(true);

  const [activeSession, setActiveSession] = useState<{
    systemCode: string;
    systemNumber: string;
    quizTitle: string;
    quizId: string;
  } | null>(null);

  const [liveState, setLiveState] = useState<any>(null);

  // Check if external quiz system is active on mount
  const checkQuizSystemActive = useCallback(async () => {
    setIsCheckingActive(true);
    try {
      const res = await getIsExternalQuizActiveAction();
      const active = res.status === "success" ? !!res.data : false;
      setIsQuizSystemActive(active);
      if (!active) {
        // Disconnect any active socket connections
        disconnectSocket();
      }
    } catch {
      setIsQuizSystemActive(false);
      disconnectSocket();
    } finally {
      setIsCheckingActive(false);
    }
  }, []);

  useEffect(() => {
    checkQuizSystemActive();
  }, [checkQuizSystemActive]);

  // Always force light mode on external kiosk screens irrespective of system/browser theme
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.setAttribute("data-theme", "light");
    document.documentElement.style.colorScheme = "light";
  }, []);

  // Restore session from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("cb_external_system_session");
    if (saved) {
      try {
        setActiveSession(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Real-time Socket.IO subscription + fast polling fallback for quiz start & assign (ONLY WHEN ACTIVE)
  useEffect(() => {
    if (!isQuizSystemActive || !activeSession?.systemCode) return;


    const checkState = async () => {
      const res = await getSystemState(activeSession.systemCode);
      if (res.status === "success" && res.data) {
        setLiveState(res.data);
        
        // Reset any leftover local answer cache if system is REGISTERED or clean waiting
        if (res.data.status === "REGISTERED") {
          try {
            localStorage.removeItem(`cb_answers_${activeSession.systemCode}`);
            localStorage.removeItem(`cb_qidx_${activeSession.systemCode}`);
          } catch (e) {}
        }

        // Always maintain fullscreen for external kiosk screens during the entire session
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        }

        if (res.data.status === "IN_PROGRESS" || res.data.status === "ATTEMPTING") {
          toast.success("Quiz started! Launching exam environment...");
          router.push(`/quiz-external/${activeSession.systemCode}`);
        }
      } else {
        // System was deleted or cleared on server
        localStorage.removeItem("cb_external_system_session");
        try {
          localStorage.removeItem(`cb_answers_${activeSession.systemCode}`);
          localStorage.removeItem(`cb_qidx_${activeSession.systemCode}`);
        } catch (e) {}
        setActiveSession(null);
        setLiveState(null);
        toast.info("System registration was reset");
      }
    };

    checkState();

    // Auto-enter fullscreen on any interaction while on waiting screen
    const handleAutoFullscreenInteraction = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    };
    window.addEventListener("click", handleAutoFullscreenInteraction, { capture: true });
    window.addEventListener("pointerdown", handleAutoFullscreenInteraction, { capture: true });
    window.addEventListener("keydown", handleAutoFullscreenInteraction, { capture: true });

    // Subscribe to Socket.IO for instant updates
    let leaveSystemRoom: (() => void) | null = null;
    let leaveQuizRoom: (() => void) | null = null;
    let handleStatusChanged: ((data: any) => void) | null = null;
    let handleQuizStarted: (() => void) | null = null;
    let handleShiftCompleted: ((data: any) => void) | null = null;
    let handleShiftChanged: ((data: any) => void) | null = null;
    let handleSystemUpdated: ((data: any) => void) | null = null;
    let handleConnect: (() => void) | null = null;

    initSocket().then((socket) => {
      if (!socket) return;

      leaveSystemRoom = joinRoom(`system-${activeSession.systemCode}`);
      if (activeSession.quizId) {
        leaveQuizRoom = joinRoom(`quiz-${activeSession.quizId}`);
      }
      const leaveGlobalRoom = joinRoom("quiz-external-global");

      handleConnect = () => {
        // Immediate server sync on socket reconnection
        checkState();
      };

      const handleGlobalStatus = (data: { enabled: boolean }) => {
        if (!data?.enabled) {
          setIsQuizSystemActive(false);
          disconnectSocket();
          toast.info("External Quiz System has been deactivated by administrator");
        }
      };

      handleStatusChanged = (data: any) => {
        if (data?.status === "DISCONNECTED") {
          localStorage.removeItem("cb_external_system_session");
          try {
            localStorage.removeItem(`cb_answers_${activeSession.systemCode}`);
            localStorage.removeItem(`cb_qidx_${activeSession.systemCode}`);
          } catch (e) {}
          setActiveSession(null);
          setLiveState(null);
          toast.info("System registration cleared");
          return;
        }

        if (data?.status === "REGISTERED") {
          try {
            localStorage.removeItem(`cb_answers_${activeSession.systemCode}`);
            localStorage.removeItem(`cb_qidx_${activeSession.systemCode}`);
          } catch (e) {}
        }

        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
        checkState();
      };

      handleShiftCompleted = (data: any) => {
        try {
          localStorage.removeItem(`cb_answers_${activeSession.systemCode}`);
          localStorage.removeItem(`cb_qidx_${activeSession.systemCode}`);
        } catch (e) {}
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
        if (data?.shiftCompleted) {
          toast.info(`Shift ${data.shiftCompleted} completed. System ready for Shift ${data.nextActiveShift || ""}`);
        }
        checkState();
      };

      handleShiftChanged = (data: any) => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
        if (data?.activeShift) {
          toast.info(`Shift ${data.activeShift} is now active!`);
        }
        checkState();
      };

      handleSystemUpdated = () => {
        checkState();
      };

      handleQuizStarted = async () => {
        toast.success("Quiz started! Launching exam environment...");
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
        router.push(`/quiz-external/${activeSession.systemCode}`);
      };

      socket.on("connect", handleConnect);
      socket.on("status-changed", handleStatusChanged);
      socket.on("shift-completed", handleShiftCompleted);
      socket.on("shift-changed", handleShiftChanged);
      socket.on("system-updated", handleSystemUpdated);
      socket.on("quiz-started", handleQuizStarted);
      socket.on("external-quiz-status", handleGlobalStatus);
    });

    // Re-check state when tab visibility changes or gains focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkState();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    return () => {
      if (leaveSystemRoom) leaveSystemRoom();
      if (leaveQuizRoom) leaveQuizRoom();
      const socket = getSocket();
      if (socket) {
        if (handleConnect) socket.off("connect", handleConnect);
        if (handleStatusChanged) socket.off("status-changed", handleStatusChanged);
        if (handleShiftCompleted) socket.off("shift-completed", handleShiftCompleted);
        if (handleShiftChanged) socket.off("shift-changed", handleShiftChanged);
        if (handleSystemUpdated) socket.off("system-updated", handleSystemUpdated);
        if (handleQuizStarted) socket.off("quiz-started", handleQuizStarted);
        socket.off("external-quiz-status");
      }
      window.removeEventListener("click", handleAutoFullscreenInteraction, { capture: true });
      window.removeEventListener("pointerdown", handleAutoFullscreenInteraction, { capture: true });
      window.removeEventListener("keydown", handleAutoFullscreenInteraction, { capture: true });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, [activeSession, router, isQuizSystemActive]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode || accessCode.length !== 6) {
      toast.error("Please enter a valid 6-digit access code");
      return;
    }
    if (!systemNumber.trim()) {
      toast.error("Please enter your System / Desk Number");
      return;
    }

    // Auto-enter fullscreen immediately when user clicks register button (direct user gesture)
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.warn("Auto fullscreen on registration:", err);
    }

    setIsSubmitting(true);
    const res = await registerExternalSystem(accessCode, systemNumber);

    if (res.status === "success" && res.data) {
      toast.success("System registered successfully!");
      const sessionData = {
        systemCode: res.data.systemCode,
        systemNumber: res.data.systemNumber,
        quizTitle: res.data.quizTitle,
        quizId: res.data.quizId,
      };
      setActiveSession(sessionData);
      localStorage.setItem("cb_external_system_session", JSON.stringify(sessionData));
    } else {
      toast.error(res.message || "Failed to register system");
    }
    setIsSubmitting(false);
  };

  const handleDisconnect = async () => {
    if (activeSession?.systemCode) {
      await unregisterExternalSystem(activeSession.systemCode);
      try {
        localStorage.removeItem(`cb_answers_${activeSession.systemCode}`);
        localStorage.removeItem(`cb_qidx_${activeSession.systemCode}`);
      } catch (e) {}
    }
    localStorage.removeItem("cb_external_system_session");
    setActiveSession(null);
    setLiveState(null);
    toast.info("System registration cleared and removed from admin dashboard");
  };

  // ── Deactivated Screen when External Quiz System is Disabled ──
  if (isQuizSystemActive === false) {
    return (
      <div className="light min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-slate-50 to-slate-200 text-slate-900">
        <Card className="max-w-md w-full bg-white text-slate-900 border-slate-200 shadow-lg overflow-hidden text-center p-6 space-y-5">
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2">
              <Image
                src="/assets/logo.png"
                alt="CodeBreakers Logo"
                width={54}
                height={54}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">CodeBreakers</span>
          </div>

          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
            <PowerOff className="h-8 w-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-slate-900">External Quiz System Offline</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The external quiz kiosk portal and real-time exam services are currently deactivated by the administrator.
            </p>
          </div>

          <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-800 text-xs text-left">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <AlertDescription>
              Please contact your quiz proctor or exam coordinator to activate the external quiz system in Admin Settings.
            </AlertDescription>
          </Alert>

          <Button
            variant="outline"
            onClick={checkQuizSystemActive}
            disabled={isCheckingActive}
            className="w-full gap-2 font-semibold"
          >
            {isCheckingActive ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Check Status Again
          </Button>
        </Card>
      </div>
    );
  }

  // ── Initial Status Check Loading ──
  if (isCheckingActive && isQuizSystemActive === null) {
    return (
      <div className="light min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-slate-50 to-slate-200 text-slate-900">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Checking external quiz system status...</p>
        </div>
      </div>
    );
  }


  // ── Registered & Waiting Screen ──
  if (activeSession) {
    const activeShiftNum = liveState?.quiz?.activeShift || 1;
    let shiftConfigs: any[] = [];
    if (liveState?.quiz?.shiftsJson) {
      try {
        shiftConfigs = JSON.parse(liveState.quiz.shiftsJson);
      } catch (e) {}
    }

    return (
      <div className="light min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-slate-50 to-slate-200 text-slate-900">
        <Card className="max-w-lg w-full bg-white text-slate-900 border-slate-200 shadow-md overflow-hidden">
          <div className="px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                <Image
                  src="/assets/logo.png"
                  alt="CodeBreakers Logo"
                  width={28}
                  height={28}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              <div>
                <span className="text-3xl font-bold tracking-tight text-slate-900 block leading-tight">CodeBreakers</span>
              </div>
            </div>
            <Badge variant="default" className="bg-green-600 text-white text-xs">
              ✓ Connected
            </Badge>
          </div>

          <CardHeader>
            <div>
              <CardTitle className="text-2xl font-bold text-slate-900">System No: {activeSession.systemNumber}</CardTitle>
              <CardDescription className="mt-1">
                Registered for: <strong>{activeSession.quizTitle}</strong>
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Session token */}
            <div className="flex items-center justify-between text-sm p-3 bg-muted rounded-lg">
              <span className="text-muted-foreground">Session Token</span>
              <span className="font-mono text-xs">{activeSession.systemCode}</span>
            </div>

            {/* Current Ongoing Shift Status Details */}
            <div className="p-3.5 bg-primary/10 border border-primary/20 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">Current Shift Ongoing:</span>
                </div>
                <Badge variant="default" className="text-xs bg-primary font-bold">
                  Shift {activeShiftNum} Active Now
                </Badge>
              </div>
            </div>

            {/* Live Status */}
            <div className="p-4 bg-muted rounded-lg space-y-3">
              {liveState?.status === "ASSIGNED" ? (
                <>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Candidate Assigned</span>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">{liveState.assignedStudentName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{liveState.assignedStudentEmail}</p>
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <Badge variant="outline" className="text-xs font-mono bg-primary/5">
                        {liveState.assignedShiftName || `Shift ${liveState.assignedShift || activeShiftNum}`}
                      </Badge>
                      {liveState.assignedSet && (
                        <Badge variant="outline" className="text-xs font-bold">
                          Question Set {liveState.assignedSet}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Waiting for admin to start Shift {liveState.assignedShift || activeShiftNum}... Fullscreen will launch automatically.
                    </AlertDescription>
                  </Alert>
                </>
              ) : liveState?.status === "IN_PROGRESS" ? (
                <Alert className="bg-green-600/10 border-green-600/30 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-sm font-semibold">
                    Exam is starting — redirecting to full screen exam environment...
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    System ready for <strong>Shift {activeShiftNum}</strong>. Waiting for admin to assign candidate details. Keep this tab open.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Standard proctoring rules, tab-switch monitoring, and fullscreen enforcement apply once the quiz starts.
              </AlertDescription>
            </Alert>

            <div className="pt-2 text-center">
              <Button variant="ghost" size="sm" onClick={handleDisconnect} className="text-muted-foreground text-xs cursor-pointer">
                Clear Registration
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Registration Form ──
  return (
    <div className="light min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-slate-50 to-slate-200 text-slate-900">
      <Card className="max-w-md w-full bg-white text-slate-900 border-slate-200 shadow-md overflow-hidden">
        <div className="p-1 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2.5">
            <Image
              src="/assets/logo.png"
              alt="CodeBreakers Logo"
              width={54}
              height={54}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-slate-900">CodeBreakers</span>
          </div>
        </div>

        <CardHeader className="pt-1 pb-2">
          <CardTitle className="text-xl flex items-center justify-center gap-2">
            <Monitor className="h-5 w-5 text-primary" />
            System Registration
          </CardTitle>
          <CardDescription className="text-center text-xs">
            Enter the 6-digit quiz access code and your system/desk number to connect this computer to the exam.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-2">
                <Key className="h-4 w-4" />
                6-Digit Access Code
              </label>
              <Input
                type="text"
                maxLength={6}
                placeholder="e.g. 849201"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, ""))}
                className="text-center font-mono text-2xl tracking-widest h-12"
              />
              <p className="text-xs text-muted-foreground">
                Displayed on the Admin panel — enter exactly as shown.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                System / Desk Number
              </label>
              <Input
                type="text"
                placeholder="e.g. SYS-01 or Desk 12"
                value={systemNumber}
                onChange={(e) => setSystemNumber(e.target.value)}
                className="h-12"
              />
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Once registered, keep this tab open. The exam will launch automatically when the admin starts it.
              </AlertDescription>
            </Alert>

            <Button type="submit" disabled={isSubmitting} className="w-full h-11" size="lg">
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Register System"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
