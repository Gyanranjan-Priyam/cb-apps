/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useTransition, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { initSocket, joinRoom, onSocketEvent } from "@/lib/socket-client";
import { useSession } from "@/lib/auth-client";
import {
  registerServiceWorker,
  showBrowserNotification,
  playAttendanceChime,
} from "@/lib/browser-notifications";
import { toast } from "sonner";
import { CheckCircle2, Sparkles } from "lucide-react";
import { NotificationPermissionDialog } from "@/components/notifications/notification-permission-dialog";

export interface AttendanceMarkedPayload {
  type: string;
  sessionId: string;
  sessionTitle: string;
  sessionNumber?: number;
  userId: string;
  userName: string;
  cbUserId?: string | null;
  points: number;
  status: string;
  timestamp: string;
  message?: string;
}

interface RealtimeAttendanceListenerProps {
  userId?: string | null;
  cbUserId?: string | null;
  userName?: string | null;
}

export function RealtimeAttendanceListener({
  userId: propUserId,
  cbUserId: propCbUserId,
  userName: propUserName,
}: RealtimeAttendanceListenerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const { data: session } = useSession();

  const isPublicFormPage =
    !pathname ||
    pathname.startsWith("/forms") ||
    pathname.startsWith("/quiz-external") ||
    pathname.startsWith("/system-register") ||
    pathname.startsWith("/thank-you") ||
    pathname.startsWith("/receipt") ||
    pathname.startsWith("/member") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/verify-request") ||
    pathname.startsWith("/device-limit") ||
    pathname.startsWith("/not-admin") ||
    pathname.startsWith("/unauthorized") ||
    pathname.startsWith("/file-viewer") ||
    pathname.startsWith("/attachment-list");

  const userId = propUserId || session?.user?.id || null;
  const userName = propUserName || session?.user?.name || null;
  const cbUserId = propCbUserId || (session?.user as any)?.cbUserId || null;

  // Track recently processed events to prevent duplicate audio, toasts, or OS push alerts
  const processedEventsRef = useRef<Map<string, number>>(new Map());

  // Register service worker on client mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      registerServiceWorker().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    // Initialize Socket.IO connection and join personal user rooms
    const cleanupFns: Array<() => void> = [];

    initSocket().then((socket) => {
      if (!socket) return;

      // Join primary user room aliases
      cleanupFns.push(joinRoom(`user-${userId}`));
      cleanupFns.push(joinRoom(`user:${userId}`));
      if (cbUserId) {
        cleanupFns.push(joinRoom(`user-${cbUserId}`));
        cleanupFns.push(joinRoom(`user:${cbUserId}`));
      }

      // Handle Attendance Marked
      const attCleanup = onSocketEvent("attendance-marked", async (data: AttendanceMarkedPayload) => {
        if (!data) return;

        // Verify target user destination if specified
        if (data.userId && data.userId !== userId && cbUserId && data.cbUserId !== cbUserId) {
          return;
        }

        // Deduplicate events arriving within 5 seconds across multiple room broadcasts
        const eventKey = `att-${data.sessionId || "sess"}-${data.userId || userId}-${data.timestamp || ""}`;
        const now = Date.now();
        const lastProcessed = processedEventsRef.current.get(eventKey);
        if (lastProcessed && now - lastProcessed < 5000) {
          return;
        }
        processedEventsRef.current.set(eventKey, now);

        // 1. Play audio chime on device
        playAttendanceChime();

        // 2. Display native OS/browser/device push notification (stable tag prevents duplicate OS banners)
        const sessionDisplay = data.sessionTitle || "Attendance Session";
        const pointsEarned = data.points || 10;
        await showBrowserNotification("Attendance Marked Present! ✅", {
          body: `Hi ${data.userName || userName || "Member"}! Your attendance for "${sessionDisplay}" has been marked Present (+${pointsEarned} Points added).`,
          icon: "/assets/logo.png",
          badge: "/assets/logo.png",
          tag: `attendance-${data.sessionId || "session"}`,
          requireInteraction: false,
          data: { url: "/dashboard" },
        });

        // 3. Show rich Sonner toast (only if not on public form/page) with deterministic ID
        if (!isPublicFormPage) {
          toast.success(
            <div className="flex items-start gap-3 w-full">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-500 shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <p className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <span>Attendance Marked Present!</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                    +{pointsEarned} PTS
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {sessionDisplay} • Live update applied.
                </p>
              </div>
            </div>,
            {
              duration: 8000,
              id: `att-toast-${data.sessionId || "session"}`,
            }
          );
        }

        // 4. Silently refresh Server Components on the page
        startTransition(() => {
          router.refresh();
        });
      });
      cleanupFns.push(attCleanup);

      // Handle Task Evaluated
      const taskCleanup = onSocketEvent("task-evaluated", async (data: any) => {
        if (!data) return;
        if (data.userId && data.userId !== userId && cbUserId && data.cbUserId !== cbUserId) return;

        const taskKey = `task-${data.taskId || data.taskNumber || "task"}-${data.status || ""}`;
        const now = Date.now();
        const lastProcessed = processedEventsRef.current.get(taskKey);
        if (lastProcessed && now - lastProcessed < 5000) {
          return;
        }
        processedEventsRef.current.set(taskKey, now);

        playAttendanceChime();
        await showBrowserNotification("Task Submission Evaluated! 📝", {
          body: `Task #${data.taskNumber || ""}: "${data.taskTitle || "Task"}" has been ${data.status} (+${data.points || 0} pts).`,
          icon: "/assets/logo.png",
          badge: "/assets/logo.png",
          tag: `task-${data.taskId || data.taskNumber || "eval"}`,
          data: { url: "/dashboard" },
        });

        if (!isPublicFormPage) {
          toast.info(
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs">Task Evaluated: {data.taskTitle}</p>
                <p className="text-[11px] text-muted-foreground">Status: {data.status} • +{data.points} pts</p>
              </div>
            </div>,
            {
              id: `task-toast-${data.taskId || data.taskNumber || "eval"}`,
            }
          );
        }

        startTransition(() => {
          router.refresh();
        });
      });
      cleanupFns.push(taskCleanup);
    });

    return () => {
      cleanupFns.forEach((fn) => fn());
    };
  }, [userId, cbUserId, userName, router, isPublicFormPage]);

  // Only render the notification permission dialog if the user is authenticated and not on a public form/page
  if (isPublicFormPage || !userId) {
    return null;
  }

  return <NotificationPermissionDialog userId={userId} userName={userName} />;
}


