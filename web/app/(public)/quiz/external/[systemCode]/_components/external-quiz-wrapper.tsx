/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import QuizProctorInterface from "@/app/(public)/quiz/[quizId]/[identifier]/_components/quiz-proctor-interface";
import { submitExternalQuizAttemptFromInterface } from "../actions";
import {
  getSystemState,
  setSystemAttemptingAction,
} from "@/app/admin/quizzes/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldAlert, FileText } from "lucide-react";
import { getSocket, initSocket, joinRoom } from "@/lib/socket-client";
import { toast } from "sonner";

interface ExternalQuizWrapperProps {
  quiz: any;
  user: {
    id: string;
    name: string;
    email: string;
    registration?: string | null;
    username?: string | null;
    mobile?: string | null;
    branch?: string | null;
  };
  assignedSet: string;
  systemCode: string;
  isCompleted?: boolean;
  isBlocked?: boolean;
  isAttempting?: boolean;
  blockReason?: string;
}

export default function ExternalQuizWrapper({
  quiz,
  user,
  assignedSet,
  systemCode,
  isCompleted = false,
  isBlocked = false,
  isAttempting = false,
  blockReason,
}: ExternalQuizWrapperProps) {
  const [liveIsBlocked, setLiveIsBlocked] = useState(isBlocked);

  // Always force light mode on external kiosk exam environment irrespective of device/system theme
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.setAttribute("data-theme", "light");
    document.documentElement.style.colorScheme = "light";
  }, []);

  // Sync state if props change
  useEffect(() => {
    setLiveIsBlocked(isBlocked);
  }, [isBlocked]);

  // Set system to ATTEMPTING status on mount
  useEffect(() => {
    if (systemCode && (isAttempting || !liveIsBlocked) && !isCompleted) {
      setSystemAttemptingAction(systemCode).catch((err) => {
        console.error("Failed to set system status to ATTEMPTING:", err);
      });
    }
  }, [systemCode, isAttempting, liveIsBlocked, isCompleted]);

  // Auto-enter fullscreen when quiz is started by admin
  useEffect(() => {
    if ((isAttempting || !liveIsBlocked) && !isCompleted) {
      const tryFullscreen = async () => {
        try {
          if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
          }
        } catch (e) {
          // Fullscreen may be blocked by browser until user interaction
          console.warn("Auto-fullscreen blocked by browser:", e);
        }
      };
      // Small delay to ensure DOM is ready
      const timer = setTimeout(tryFullscreen, 500);
      return () => clearTimeout(timer);
    }
  }, [isAttempting, liveIsBlocked, isCompleted]);

  // Socket.IO real-time unblock listener + fast polling when blocked / shift completed
  useEffect(() => {
    if (!systemCode) return;

    const leaveRoomFns: Array<() => void> = [];
    let handleUnblocked: (() => void) | null = null;
    let handleStatusChanged:
      | ((data: {
          status?: string;
          shiftCompleted?: number;
          nextActiveShift?: number;
        }) => void)
      | null = null;
    let handleShiftCompleted:
      | ((data?: { shiftCompleted?: number; nextActiveShift?: number }) => void)
      | null = null;
    let handleShiftChanged: ((data?: any) => void) | null = null;
    let handleConnect: (() => void) | null = null;

    const cleanupAndRedirect = () => {
      try {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        localStorage.removeItem(`cb_answers_${systemCode}`);
        localStorage.removeItem(`cb_qidx_${systemCode}`);
      } catch (e) {}
      window.location.replace("/quiz/system-register");
    };

    initSocket().then((socket) => {
      if (!socket) return;

      leaveRoomFns.push(joinRoom(`system-${systemCode}`));
      if (quiz.id) leaveRoomFns.push(joinRoom(`quiz-${quiz.id}`));
      if (quiz.quizId) leaveRoomFns.push(joinRoom(`quiz-${quiz.quizId}`));
      leaveRoomFns.push(joinRoom("quiz-external-global"));

      handleConnect = async () => {
        const res = await getSystemState(systemCode);
        if (res.status === "success" && res.data) {
          if (
            res.data.status === "REGISTERED" ||
            res.data.status === "ASSIGNED"
          ) {
            cleanupAndRedirect();
          } else if (res.data.status === "BLOCKED") {
            setLiveIsBlocked(true);
          } else if (
            res.data.status === "ATTEMPTING" ||
            res.data.status === "IN_PROGRESS"
          ) {
            setLiveIsBlocked(false);
          }
        } else if (res.status === "error") {
          cleanupAndRedirect();
        }
      };

      handleUnblocked = () => {
        setLiveIsBlocked(false);
        toast.success(
          "You have been unblocked by the administrator! Resuming exam...",
        );
      };

      handleStatusChanged = (data) => {
        if (
          data?.status === "REGISTERED" ||
          data?.status === "ASSIGNED" ||
          data?.shiftCompleted
        ) {
          cleanupAndRedirect();
        } else if (
          data?.status === "ATTEMPTING" ||
          data?.status === "IN_PROGRESS"
        ) {
          setLiveIsBlocked(false);
        } else if (data?.status === "BLOCKED") {
          setLiveIsBlocked(true);
        }
      };

      handleShiftCompleted = (data) => {
        toast.info(
          `Shift ${data?.shiftCompleted || ""} completed. Resetting for next shift...`,
        );
        cleanupAndRedirect();
      };

      handleShiftChanged = () => {
        cleanupAndRedirect();
      };

      const handleGlobalStatus = (data: { enabled: boolean }) => {
        if (!data?.enabled) {
          cleanupAndRedirect();
        }
      };

      socket.on("connect", handleConnect);
      socket.on("unblocked", handleUnblocked);
      socket.on("status-changed", handleStatusChanged);
      socket.on("shift-completed", handleShiftCompleted);
      socket.on("shift-changed", handleShiftChanged);
      socket.on("external-quiz-status", handleGlobalStatus);
    });


    // Visibility / focus listener to recheck state if tab becomes active
    const checkStateOnFocus = async () => {
      if (document.visibilityState === "visible") {
        const res = await getSystemState(systemCode);
        if (res.status === "success" && res.data) {
          if (
            res.data.status === "REGISTERED" ||
            res.data.status === "ASSIGNED"
          ) {
            cleanupAndRedirect();
          } else if (
            res.data.status === "ATTEMPTING" ||
            res.data.status === "IN_PROGRESS"
          ) {
            setLiveIsBlocked(false);
          } else if (res.data.status === "BLOCKED") {
            setLiveIsBlocked(true);
          }
        }
      }
    };

    window.addEventListener("focus", checkStateOnFocus);
    document.addEventListener("visibilitychange", checkStateOnFocus);

    return () => {
      window.removeEventListener("focus", checkStateOnFocus);
      document.removeEventListener("visibilitychange", checkStateOnFocus);
      leaveRoomFns.forEach((fn) => fn());
      const socket = getSocket();
      if (socket) {
        if (handleConnect) socket.off("connect", handleConnect);
        if (handleUnblocked) socket.off("unblocked", handleUnblocked);
        if (handleStatusChanged)
          socket.off("status-changed", handleStatusChanged);
        if (handleShiftCompleted)
          socket.off("shift-completed", handleShiftCompleted);
        if (handleShiftChanged) socket.off("shift-changed", handleShiftChanged);
      }
    };
  }, [systemCode, quiz.id, quiz.quizId, liveIsBlocked]);

  // If candidate is blocked — show blocked error screen
  if (liveIsBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="max-w-md w-full space-y-4 text-center p-6 border rounded-xl bg-card shadow-lg">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-destructive">
            Quiz Access Blocked
          </h1>
          <p className="text-muted-foreground text-sm">
            Access to this quiz has been blocked for system{" "}
            <strong>{user.registration || systemCode}</strong>.
          </p>
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive text-left font-mono">
            Reason: {blockReason || "Multiple proctoring violations detected"}
          </div>
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive flex items-center justify-center gap-2 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
            </span>
            Waiting for administrator unblock... Screen will update
            automatically once unblocked.
          </div>
        </div>
      </div>
    );
  }

  // Already submitted — show submitted screen immediately!
  if (isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="max-w-md w-full space-y-4 text-center p-6 border rounded-xl bg-card shadow-lg">
          {/* CodeBreakers Branding */}
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 p-2 flex items-center justify-center mb-2">
              <Image
                src="/assets/logo.png"
                alt="CodeBreakers Logo"
                width={48}
                height={48}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              CodeBreakers
            </span>
          </div>

          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold">Quiz Already Submitted</h1>
          <p className="text-muted-foreground text-sm">
            Your responses have already been submitted and recorded for system{" "}
            <strong>{user.registration || systemCode}</strong>.
          </p>
          <p className="text-xs text-muted-foreground">
            Official scorecard will be emailed to <strong>{user.email}</strong>{" "}
            once published by administrator.
          </p>
          {quiz.feedbackFormId && (
            <Button
              asChild
              className="w-full mt-4 font-bold bg-primary text-primary-foreground hover:opacity-90 rounded-xl"
            >
              <a
                href={`/forms/${quiz.feedbackFormId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileText className="h-4 w-4 mr-2" />
                Fill Feedback Form
              </a>
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Bind the systemCode into the server action call
  const handleExternalSubmit = async (data: {
    quizId: string;
    quizDbId: string;
    assignedSet: string;
    answers: Record<number, number>;
    tabSwitches: number;
    questionsJson: string;
    shiftNumber?: number;
  }) => {
    return submitExternalQuizAttemptFromInterface({
      ...data,
      systemCode,
      participantName: user.name,
      participantEmail: user.email,
      shiftNumber: data.shiftNumber || quiz.shift || 1,
    });
  };

  const afterSubmitContent = (
    <div className="space-y-4 w-full">
      <Alert className="flex w-full items-start gap-2 text-left">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
        <AlertDescription className="text-xs leading-5 text-left">
          Your results will be reviewed and published by the administrator. An
          official scorecard will be emailed to{" "}
          <strong className="font-bold wrap-break-words">{user.email}</strong>{" "}
          once released.
        </AlertDescription>
      </Alert>
      {quiz.feedbackFormId && (
        <Button
          asChild
          className="w-full font-bold bg-primary text-primary-foreground hover:opacity-90 rounded-xl"
        >
          <a
            href={`/forms/${quiz.feedbackFormId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FileText className="h-4 w-4 mr-2" />
            Fill Feedback Form
          </a>
        </Button>
      )}
      <div className="flex items-center justify-center gap-1.5 pt-2 text-[11px] text-muted-foreground font-medium">
        <Image
          src="/assets/logo.png"
          alt="CodeBreakers Logo"
          width={24}
          height={24}
          className="h-6 w-6 object-contain"
        />
        <span className="text-sm font-semibold text-black">Powered by CodeBreakers</span>
      </div>
    </div>
  );

  return (
    <QuizProctorInterface
      quiz={quiz}
      user={user}
      hasExistingAttempt={isCompleted || liveIsBlocked}
      assignedSet={assignedSet}
      onSubmit={handleExternalSubmit}
      afterSubmitContent={afterSubmitContent}
      systemCode={systemCode}
      initialStep={
        isAttempting || !liveIsBlocked ? "quiz-started" : "user-info"
      }
    />
  );
}
