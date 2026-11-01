"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Monitor, RefreshCw, Clock, CheckCircle2, User, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { getExternalSystems } from "@/app/admin/quizzes/actions";

import { initSocket, joinRoom } from "@/lib/socket-client";

interface System {
  id: string;
  systemCode: string;
  systemNumber: string;
  status: string;
  assignedStudentName: string | null;
  assignedStudentEmail: string | null;
  assignedSet: string | null;
  createdAt?: string | Date | null;
  completedAt?: string | Date | null;
}

interface SystemsListPanelProps {
  quizId: string;
  quizSlug: string;
  initialSystems: System[];
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  REGISTERED: { label: "Registered", variant: "outline" },
  ASSIGNED: { label: "Assigned", variant: "secondary" },
  IN_PROGRESS: { label: "In Progress", variant: "default" },
  COMPLETED: { label: "Completed", variant: "secondary" },
};

export default function SystemsListPanel({ quizId, quizSlug, initialSystems }: SystemsListPanelProps) {
  const [systems, setSystems] = useState<System[]>(initialSystems);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isPending, startTransition] = useTransition();

  const refresh = () => {
    startTransition(async () => {
      const res = await getExternalSystems(quizId);
      if (res.status === "success" && res.data) {
        setSystems(res.data as System[]);
        setLastUpdated(new Date());
      }
    });
  };

  // Realtime updates via Supabase WebSocket
  useEffect(() => {
    let leaveRoom: (() => void) | undefined;
    initSocket().then((socket) => {
      if (!socket) return;
      leaveRoom = joinRoom(`quiz-${quizId}`);
      socket.on("system-updated", refresh);
      socket.on("shift-changed", refresh);
      socket.on("shift-completed", refresh);
    });

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };
    window.addEventListener("focus", handleVisibility);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (leaveRoom) leaveRoom();
      window.removeEventListener("focus", handleVisibility);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [quizId]);

  if (systems.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Monitor className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No systems registered yet</h3>
          <p className="text-sm text-muted-foreground">
            Share the access code with kiosk operators. Systems will appear here once they register.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Registered Systems</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Auto-refreshes every 3 seconds · Last updated: {lastUpdated.toLocaleTimeString()}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={refresh} disabled={isPending}>
            <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {systems.map((system) => {
          const cfg = statusConfig[system.status] || { label: system.status, variant: "outline" as const };
          return (
            <div
              key={system.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card gap-3 flex-wrap"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-md bg-muted shrink-0">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{system.systemNumber}</span>
                    <span className="font-mono text-xs text-muted-foreground">{system.systemCode}</span>
                    <Badge variant={cfg.variant} className="text-xs">{cfg.label}</Badge>
                  </div>
                  {system.assignedStudentName ? (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {system.assignedStudentName}
                        {system.assignedSet && <> · Set {system.assignedSet}</>}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-0.5">No student assigned yet</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {system.status === "COMPLETED" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : system.status === "REGISTERED" ? (
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/admin/quizzes/${quizSlug}/systems/assign?systemCode=${system.systemCode}`}>
                      Assign Student
                    </Link>
                  </Button>
                ) : system.status === "IN_PROGRESS" ? (
                  <div className="flex items-center gap-1 text-xs text-primary">
                    <Clock className="h-3.5 w-3.5 animate-pulse" />
                    In progress
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
