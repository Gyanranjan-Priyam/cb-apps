"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import Link from "next/link";
import {
  getExternalSystems,
  assignStudentToSystem,
  unassignStudentFromSystem,
  startSystemQuiz,
  startAllSystems,
  getStudentDetailsByResponseId,
  completeQuizShift,
  setActiveQuizShift,
  getQuizMonitorData,
  getIsExternalQuizActiveAction,
} from "@/app/admin/quizzes/actions";
import { getSocket, initSocket, joinRoom } from "@/lib/socket-client";
import {
  Monitor,
  RefreshCw,
  Clock,
  CheckCircle2,
  User,
  AlertTriangle,
  Search,
  Loader2,
  Mail,
  Play,
  UserX,
  UserCheck,
  UserPlus,
  Layers,
} from "lucide-react";
import CopyCodeButton from "../../_components/copy-code-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface ShiftItem {
  shiftNumber: number;
  name: string;
  set?: string;
  sets?: string[];
  status?: string;
}

interface System {
  id: string;
  systemCode: string;
  systemNumber: string;
  status: string;
  assignedResponseId?: string | null;
  assignedStudentName: string | null;
  assignedStudentEmail: string | null;
  assignedSet: string | null;
  assignedShift?: number | null;
  assignedShiftName?: string | null;
  createdAt?: string | Date | null;
  completedAt?: string | Date | null;
}

interface FormResponse {
  id: string;
  submittedByName?: string;
  submittedByEmail?: string;
}

interface SystemsManagementViewProps {
  quizId: string;
  quizSlug: string;
  quizTitle: string;
  accessCode: string | null;
  sets: number;
  shifts?: number;
  shiftsJson?: string | null;
  activeShift?: number;
  formId: string | null;
  initialSystems: System[];
  formResponses: FormResponse[];
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  REGISTERED: { label: "Registered", variant: "outline" },
  ASSIGNED: { label: "Assigned", variant: "secondary" },
  IN_PROGRESS: { label: "In Progress", variant: "default" },
  COMPLETED: { label: "Completed", variant: "secondary" },
};

export default function SystemsManagementView({
  quizId,
  quizSlug,
  quizTitle,
  accessCode,
  sets,
  shifts = 1,
  shiftsJson = null,
  activeShift = 1,
  formId,
  initialSystems,
  formResponses = [],
}: SystemsManagementViewProps) {
  const [systems, setSystems] = useState<System[]>(initialSystems);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isPending, startTransition] = useTransition();

  // Multi-Shift States
  const [activeShiftState, setActiveShiftState] = useState<number>(activeShift || 1);
  const [shiftsConfig, setShiftsConfig] = useState<ShiftItem[]>([]);
  const [selectedShiftForAssign, setSelectedShiftForAssign] = useState<number>(activeShift || 1);
  const [completeShiftDialogOpen, setCompleteShiftDialogOpen] = useState(false);
  const [isCompletingShift, setIsCompletingShift] = useState(false);

  useEffect(() => {
    let parsed: ShiftItem[] = [];
    try {
      if (shiftsJson) {
        parsed = JSON.parse(shiftsJson);
      }
    } catch (e) {
      console.error("Error parsing shiftsJson in systems view:", e);
    }

    if (parsed.length > 0) {
      const normalized = parsed.map((s: any) => ({
        ...s,
        sets: s.sets && Array.isArray(s.sets) && s.sets.length > 0 ? s.sets : [s.set || "A"],
        set: s.set || (s.sets && s.sets[0]) || "A",
      }));
      setShiftsConfig(normalized);
    } else {
      const list: ShiftItem[] = [];
      const numShifts = shifts || 1;
      const numSets = sets || 1;
      for (let i = 1; i <= numShifts; i++) {
        const defaultSet = String.fromCharCode(65 + ((i - 1) % numSets));
        list.push({
          shiftNumber: i,
          name: `Shift ${i}`,
          set: defaultSet,
          sets: [defaultSet],
          status: i < (activeShift || 1) ? "COMPLETED" : i === (activeShift || 1) ? "ACTIVE" : "PENDING",
        });
      }
      setShiftsConfig(list);
    }
  }, [shifts, shiftsJson, sets, activeShift]);

  // Sidebar Assign Form State
  const [selectedSystemCode, setSelectedSystemCode] = useState<string>("");
  const [assignSidebarOpen, setAssignSidebarOpen] = useState(false);
  const [responseId, setResponseId] = useState<string>("");
  const [studentName, setStudentName] = useState<string>("");
  const [studentEmail, setStudentEmail] = useState<string>("");
  const [selectedSet, setSelectedSet] = useState<string>("A");
  const [isFetchingResponse, setIsFetchingResponse] = useState(false);
  const [isSubmittingAssign, setIsSubmittingAssign] = useState(false);

  // Filter & Search State
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ASSIGNED" | "UNASSIGNED" | "IN_PROGRESS" | "COMPLETED">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const sortSystemsNaturally = (list: System[]) => {
    return [...list].sort((a, b) =>
      a.systemNumber.localeCompare(b.systemNumber, undefined, { numeric: true, sensitivity: "base" })
    );
  };

  const sortedSystems = sortSystemsNaturally(systems);

  // Fetch systems list and monitor data
  const refreshSystems = () => {
    startTransition(async () => {
      const res = await getQuizMonitorData(quizId);
      if (res.status === "success" && res.data) {
        const sortedData = (res.data.systems as System[]).sort((a, b) =>
          a.systemNumber.localeCompare(b.systemNumber, undefined, { numeric: true, sensitivity: "base" })
        );
        setSystems(sortedData);
        if (res.data.quiz) {
          if (res.data.quiz.activeShift) {
            setActiveShiftState(res.data.quiz.activeShift);
          }
          if (res.data.quiz.shiftsJson) {
            try {
              setShiftsConfig(JSON.parse(res.data.quiz.shiftsJson));
            } catch (e) {}
          }
        }
        setLastUpdated(new Date());
      }
    });
  };

  // External quiz system enabled/disabled status
  const [isExternalQuizActive, setIsExternalQuizActive] = useState<boolean>(true);

  useEffect(() => {
    refreshSystems();

    getIsExternalQuizActiveAction().then((res) => {
      setIsExternalQuizActive(res.status === "success" ? !!res.data : false);
    });

    let leaveRoom: (() => void) | null = null;

    initSocket().then((socket) => {
      if (!socket) return;

      leaveRoom = joinRoom(`quiz-${quizId}`);

      socket.on("connect", () => {
        refreshSystems();
      });
      socket.on("external-quiz-status", (data: any) => {
        setIsExternalQuizActive(Boolean(data?.enabled));
      });
      socket.on("system-updated", refreshSystems);
      socket.on("shift-changed", (data: any) => {
        if (data?.activeShift) {
          setActiveShiftState(data.activeShift);
        }
        refreshSystems();
      });
      socket.on("shift-completed", (data: any) => {
        if (data?.nextActiveShift) {
          setActiveShiftState(data.nextActiveShift);
        }
        refreshSystems();
      });
      socket.on("quiz-started-all", refreshSystems);
    });

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshSystems();
      }
    };
    window.addEventListener("focus", handleVisibility);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleVisibility);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (leaveRoom) leaveRoom();
      const socket = getSocket();
      if (socket) {
        socket.off("external-quiz-status");
        socket.off("system-updated", refreshSystems);
        socket.off("shift-changed");
        socket.off("shift-completed");
        socket.off("quiz-started-all", refreshSystems);
      }
    };
  }, [quizId]);

  const handleActivateShift = async (shiftNum: number) => {
    const res = await setActiveQuizShift(quizId, shiftNum);
    if (res.status === "success") {
      toast.success(res.message);
      setActiveShiftState(shiftNum);
      refreshSystems();
    } else {
      toast.error(res.message || "Failed to activate shift");
    }
  };

  // Auto-calculate question set ensuring consecutive systems get alternating sets
  const getAutoSetForSystem = (sysCode: string, shiftNum: number) => {
    const sorted = sortSystemsNaturally(systems);
    const sysIdx = sorted.findIndex((s) => s.systemCode === sysCode);
    const matched = shiftsConfig.find((s) => s.shiftNumber === shiftNum);
    const allowed = matched?.sets && matched.sets.length > 0 ? matched.sets : [matched?.set || "A"];
    if (allowed.length <= 1) return allowed[0] || "A";
    const safeIdx = sysIdx >= 0 ? sysIdx : 0;
    return allowed[safeIdx % allowed.length];
  };

  // Select system for assignment (from sidebar dropdown or clicking row "Assign")
  const handleSelectSystem = (systemCode: string) => {
    setSelectedSystemCode(systemCode);
    const sorted = sortSystemsNaturally(systems);
    const idx = sorted.findIndex((s) => s.systemCode === systemCode);
    const found = sorted[idx];
    if (found) {
      if (found.assignedStudentName) setStudentName(found.assignedStudentName);
      else setStudentName("");
      if (found.assignedStudentEmail) setStudentEmail(found.assignedStudentEmail);
      else setStudentEmail("");
      
      const shiftNum = found.assignedShift || activeShiftState || 1;
      setSelectedShiftForAssign(shiftNum);
      const auto = getAutoSetForSystem(systemCode, shiftNum);
      setSelectedSet(found.assignedSet || auto);
    }
    setAssignSidebarOpen(true);
  };

  // Auto-fetch student by Response ID
  const handleFetchStudent = async () => {
    if (!responseId.trim()) {
      toast.error("Enter a Response ID first");
      return;
    }
    setIsFetchingResponse(true);
    const res = await getStudentDetailsByResponseId(responseId.trim());
    if (res.status === "success" && res.data) {
      setStudentName(res.data.studentName || (res.data as any).name || "");
      setStudentEmail(res.data.studentEmail || (res.data as any).email || "");
      toast.success("Student details auto-fetched!");
    } else {
      toast.error(res.message || "Response not found");
    }
    setIsFetchingResponse(false);
  };

  // Assign Student
  const handleAssignStudent = async () => {
    if (!selectedSystemCode) {
      toast.error("Please select a registered system");
      return;
    }
    if (!studentName.trim()) {
      toast.error("Student name is required");
      return;
    }
    if (!studentEmail.trim()) {
      toast.error("Student email is required");
      return;
    }

    setIsSubmittingAssign(true);
    const res = await assignStudentToSystem({
      systemCode: selectedSystemCode,
      formResponseId: responseId.trim() || undefined,
      studentName: studentName.trim(),
      studentEmail: studentEmail.trim(),
      assignedSet: selectedSet,
      assignedShift: selectedShiftForAssign,
      assignedShiftName: `Shift ${selectedShiftForAssign}`,
    });

    if (res.status === "success") {
      toast.success("Student assigned to system successfully!");
      refreshSystems();
    } else {
      toast.error(res.message || "Failed to assign student");
    }
    setIsSubmittingAssign(false);
  };

  const handleCompleteShift = async () => {
    setIsCompletingShift(true);
    const res = await completeQuizShift(quizId, activeShiftState);
    if (res.status === "success") {
      toast.success(res.message);
      setCompleteShiftDialogOpen(false);
      refreshSystems();
    } else {
      toast.error(res.message || "Failed to complete shift");
    }
    setIsCompletingShift(false);
  };

  // Unassign Student
  const handleUnassign = async (systemId: string) => {
    const res = await unassignStudentFromSystem(systemId);
    if (res.status === "success") {
      toast.info("Student unassigned");
      refreshSystems();
      if (selectedSystemCode && systems.find((s) => s.id === systemId)?.systemCode === selectedSystemCode) {
        setStudentName("");
        setStudentEmail("");
      }
    } else {
      toast.error(res.message || "Failed to unassign");
    }
  };

  const [isStartingAll, setIsStartingAll] = useState(false);

  // Start Quiz for single system
  const handleStartQuiz = async (systemId: string) => {
    const res = await startSystemQuiz(systemId);
    if (res.status === "success") {
      toast.success("Quiz started for system!");
      refreshSystems();
    } else {
      toast.error(res.message || "Failed to start quiz");
    }
  };

  // Start Quiz for all assigned systems at the same time
  const handleStartAllSystems = async () => {
    if (assignedCount === 0) {
      toast.error("No assigned systems ready to start");
      return;
    }

    setIsStartingAll(true);
    const res = await startAllSystems(quizId);
    if (res.status === "success") {
      toast.success(`Successfully started quiz for all ${assignedCount} assigned systems simultaneously!`);
      refreshSystems();
    } else {
      toast.error(res.message || "Failed to start all systems");
    }
    setIsStartingAll(false);
  };

  const selectedSystem = systems.find((s) => s.systemCode === selectedSystemCode);
  const registeredCount = systems.length;
  const assignedCount = systems.filter((s) => s.status === "ASSIGNED" || (s.assignedStudentName && s.status !== "COMPLETED")).length;
  const unassignedCount = systems.filter((s) => s.status === "REGISTERED" && !s.assignedStudentName).length;
  const inProgressCount = systems.filter((s) => s.status === "IN_PROGRESS").length;
  const completedCount = systems.filter((s) => s.status === "COMPLETED").length;

  const filteredSystems = sortedSystems.filter((sys) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNumber = sys.systemNumber.toLowerCase().includes(q);
      const matchCode = sys.systemCode.toLowerCase().includes(q);
      const matchName = sys.assignedStudentName?.toLowerCase().includes(q);
      const matchEmail = sys.assignedStudentEmail?.toLowerCase().includes(q);
      if (!matchNumber && !matchCode && !matchName && !matchEmail) return false;
    }

    if (filterStatus === "ASSIGNED") {
      return sys.status === "ASSIGNED" || (sys.assignedStudentName && sys.status !== "COMPLETED");
    }
    if (filterStatus === "UNASSIGNED") {
      return sys.status === "REGISTERED" && !sys.assignedStudentName;
    }
    if (filterStatus === "IN_PROGRESS") {
      return sys.status === "IN_PROGRESS";
    }
    if (filterStatus === "COMPLETED") {
      return sys.status === "COMPLETED";
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {!isExternalQuizActive && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <p className="font-semibold text-amber-400 text-sm">External Quiz System is Currently Deactivated</p>
              <p className="text-xs text-muted-foreground">
                Candidates cannot register systems or take external exams until enabled by an administrator.
              </p>
            </div>
          </div>
          <Link href="/admin/system-settings" className="shrink-0">
            <Button variant="outline" size="sm" className="border-amber-500/40 hover:bg-amber-500/20 text-amber-300 text-xs">
              Open System Settings
            </Button>
          </Link>
        </div>
      )}

      {/* Multi-Shift Operations & Quick Shift Completer Banner */}
      {shiftsConfig.length > 0 && (
        <Card className="border-border/80 bg-muted/20">
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">Shift Operations & Control</span>
                    <Badge variant="default" className="text-xs bg-primary">
                      Active: Shift {activeShiftState}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Managing {shiftsConfig.length} shifts under this quiz. All shifts share a unified leaderboard.
                  </p>
                </div>
              </div>

              {/* Complete Current Shift Action Button */}
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setCompleteShiftDialogOpen(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Shift {activeShiftState} Completed
                </Button>
              </div>
            </div>

            {/* Shift List Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2 pt-1">
              {shiftsConfig.map((s) => {
                const isActive = s.shiftNumber === activeShiftState;
                const isDone = s.status === "COMPLETED" || s.shiftNumber < activeShiftState;
                const shiftSets = s.sets && s.sets.length > 0 ? s.sets : [s.set || "A"];
                return (
                  <button
                    type="button"
                    key={s.shiftNumber}
                    onClick={() => {
                      if (!isActive && !isDone) {
                        if (confirm(`Activate Shift ${s.shiftNumber} now? This will set Shift ${s.shiftNumber} as the active shift for all connected kiosks.`)) {
                          handleActivateShift(s.shiftNumber);
                        }
                      }
                    }}
                    className={`p-2 rounded-lg border text-center text-xs transition-all ${
                      isActive
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-xs cursor-default"
                        : isDone
                        ? "border-green-600/30 bg-green-500/5 text-green-700 dark:text-green-400 font-medium cursor-default"
                        : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:bg-muted/30 cursor-pointer"
                    }`}
                  >
                    <div className="font-semibold">{s.name || `Shift ${s.shiftNumber}`}</div>
                    <div className="text-[11px] font-mono mt-0.5">
                      {shiftSets.length > 1 ? `Sets: ${shiftSets.join(", ")}` : `Set ${shiftSets[0]}`}
                    </div>
                    <div className="text-[10px] mt-1 opacity-80">
                      {isDone ? "✓ Completed" : isActive ? "● Active Now" : "Upcoming (Click to Activate)"}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Summary Bar */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <p className="text-xs text-muted-foreground">Access Code</p>
              <p className="text-2xl font-mono font-bold tracking-widest">{accessCode || "N/A"}</p>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div>
              <p className="text-xs text-muted-foreground">Registered Kiosks</p>
              <p className="text-2xl font-bold">{registeredCount}</p>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div>
              <p className="text-xs text-muted-foreground">Assigned Candidates</p>
              <p className="text-2xl font-bold text-primary">{assignedCount}</p>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div>
              <p className="text-xs text-muted-foreground">Not Assigned</p>
              <p className="text-2xl font-bold text-amber-500">{unassignedCount}</p>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div>
              <p className="text-xs text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold">{inProgressCount}</p>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-green-600">{completedCount}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {accessCode && <CopyCodeButton code={accessCode} />}
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold cursor-pointer gap-1.5"
              onClick={() => {
                const available = sortedSystems.filter((s) => s.status === "REGISTERED" && !s.assignedStudentName);
                if (available.length > 0) {
                  handleSelectSystem(available[0].systemCode);
                } else if (sortedSystems.length > 0) {
                  handleSelectSystem(sortedSystems[0].systemCode);
                } else {
                  setAssignSidebarOpen(true);
                }
              }}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Assign Student
            </Button>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold cursor-pointer"
              onClick={handleStartAllSystems}
              disabled={isStartingAll || assignedCount === 0}
            >
              {isStartingAll ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5 mr-1.5" />
              )}
              Start Quiz for All Systems ({assignedCount})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── REGISTERED SYSTEMS LIST VIEW (FULL WIDTH) ── */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Monitor className="h-5 w-5 text-primary" />
                Registered Systems List ({filteredSystems.length}/{registeredCount})
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Real-time kiosk status · Auto-refreshes every 3s · Click any system number to manage in sidebar
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs font-semibold cursor-pointer gap-1.5"
                onClick={() => {
                  const available = sortedSystems.filter((s) => s.status === "REGISTERED" && !s.assignedStudentName);
                  if (available.length > 0) {
                    handleSelectSystem(available[0].systemCode);
                  } else if (sortedSystems.length > 0) {
                    handleSelectSystem(sortedSystems[0].systemCode);
                  } else {
                    setAssignSidebarOpen(true);
                  }
                }}
              >
                <UserPlus className="h-3.5 w-3.5" />
                Assign Student
              </Button>
              <Button variant="ghost" size="sm" onClick={refreshSystems} disabled={isPending}>
                <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3">
            {/* Search input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search system #, code, student name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-muted/30"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <Button
                variant={filterStatus === "ALL" ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs font-semibold px-2.5 cursor-pointer"
                onClick={() => setFilterStatus("ALL")}
              >
                All ({registeredCount})
              </Button>
              <Button
                variant={filterStatus === "ASSIGNED" ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs font-semibold px-2.5 cursor-pointer text-primary"
                onClick={() => setFilterStatus("ASSIGNED")}
              >
                Assigned ({assignedCount})
              </Button>
              <Button
                variant={filterStatus === "UNASSIGNED" ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs font-semibold px-2.5 cursor-pointer text-amber-500"
                onClick={() => setFilterStatus("UNASSIGNED")}
              >
                Not Assigned ({unassignedCount})
              </Button>
              <Button
                variant={filterStatus === "IN_PROGRESS" ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs font-semibold px-2.5 cursor-pointer"
                onClick={() => setFilterStatus("IN_PROGRESS")}
              >
                In Progress ({inProgressCount})
              </Button>
              <Button
                variant={filterStatus === "COMPLETED" ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs font-semibold px-2.5 cursor-pointer text-green-600"
                onClick={() => setFilterStatus("COMPLETED")}
              >
                Completed ({completedCount})
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {systems.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed rounded-lg space-y-2">
              <Monitor className="h-10 w-10 text-muted-foreground mx-auto" />
              <h3 className="font-semibold text-base">No systems registered yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Tell candidates or kiosk operators to navigate to <strong>/quiz/system-register</strong> and enter access code <strong>{accessCode}</strong>.
              </p>
            </div>
          ) : filteredSystems.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed rounded-lg space-y-2">
              <Search className="h-8 w-8 text-muted-foreground mx-auto" />
              <h4 className="font-semibold text-sm">No systems match your filter/search</h4>
              <p className="text-xs text-muted-foreground">Try clearing the search query or selecting &quot;All&quot; filter.</p>
              <Button size="sm" variant="outline" onClick={() => { setFilterStatus("ALL"); setSearchQuery(""); }} className="text-xs mt-2">
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredSystems.map((system) => {
                const cfg = statusConfig[system.status] || { label: system.status, variant: "outline" as const };
                const isSelected = system.systemCode === selectedSystemCode;

                return (
                  <div
                    key={system.id}
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-xs"
                        : "border-border hover:border-border/80 bg-card/60 hover:bg-card"
                    }`}
                  >
                    {/* Left: Clickable System Number Box + Student details */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Clickable System Number Box */}
                      <button
                        type="button"
                        onClick={() => handleSelectSystem(system.systemCode)}
                        className="p-2 px-3 rounded-lg border border-border/80 bg-muted/60 hover:bg-primary/10 hover:border-primary/50 transition-all flex items-center gap-2 text-left cursor-pointer group shrink-0"
                        title="Click to open assign sidebar"
                      >
                        <Monitor className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        <div>
                          <div className="font-bold text-sm leading-none group-hover:text-primary transition-colors flex items-center gap-1.5">
                            {system.systemNumber}
                            <span className="text-[10px] font-mono text-muted-foreground">({system.systemCode})</span>
                          </div>
                          <div className="text-[9px] text-muted-foreground mt-0.5 font-medium">Click to open</div>
                        </div>
                      </button>

                      {/* Student & Shift info */}
                      <div className="min-w-0 flex-1">
                        {system.assignedStudentName ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-foreground truncate max-w-[200px] sm:max-w-xs">
                                {system.assignedStudentName}
                              </span>
                              <span className="text-[11px] font-mono text-muted-foreground truncate hidden sm:inline">
                                ({system.assignedStudentEmail})
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge variant="outline" className="text-[10px] font-mono py-0 h-4">
                                {system.assignedShiftName || `Shift ${system.assignedShift || activeShiftState || 1}`}
                              </Badge>
                              {system.assignedSet && (
                                <Badge variant="outline" className="text-[10px] font-bold py-0 h-4 bg-primary/5">
                                  Set {system.assignedSet}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="text-xs italic">No student assigned</span>
                            <Badge variant="outline" className="text-[10px] border-dashed text-muted-foreground">
                              Not Assigned
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Status badge + Quick Actions */}
                    <div className="flex items-center justify-between md:justify-end gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0">
                      <Badge variant={cfg.variant} className="text-xs font-semibold shrink-0">
                        {cfg.label}
                      </Badge>

                      <div className="flex items-center gap-1.5">
                        {(system.status === "REGISTERED" || system.status === "ASSIGNED") && (
                          <Button
                            size="sm"
                            variant={isSelected ? "default" : "outline"}
                            onClick={() => handleSelectSystem(system.systemCode)}
                            className="text-xs h-8 cursor-pointer"
                          >
                            <UserCheck className="h-3.5 w-3.5 mr-1" />
                            {system.assignedStudentName ? "Edit" : "Assign"}
                          </Button>
                        )}

                        {system.status === "ASSIGNED" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white text-xs h-8 cursor-pointer"
                              onClick={() => handleStartQuiz(system.id)}
                            >
                              <Play className="h-3.5 w-3.5 mr-1" />
                              Start
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10 text-xs h-8 cursor-pointer"
                              onClick={() => handleUnassign(system.id)}
                            >
                              <UserX className="h-3.5 w-3.5 mr-1" />
                              Unassign
                            </Button>
                          </>
                        )}

                        {system.status === "IN_PROGRESS" && (
                          <div className="flex items-center gap-1 text-xs text-primary font-semibold">
                            <Clock className="h-3.5 w-3.5 animate-pulse" />
                            In Progress
                          </div>
                        )}

                        {system.status === "COMPLETED" && (
                          <div className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Completed
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── ASSIGN STUDENT RIGHT SIDEBAR SHEET ── */}
      <Sheet open={assignSidebarOpen} onOpenChange={setAssignSidebarOpen}>
        <SheetContent side="right" className="sm:max-w-md w-full p-0 flex h-dvh max-h-screen flex-col overflow-hidden bg-card">
          <div className="shrink-0 border-b bg-muted/20 p-4">
            <SheetHeader>
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                <SheetTitle className="text-base font-bold">Assign Student Sidebar</SheetTitle>
              </div>
              <SheetDescription className="text-xs mt-1">
                Select a kiosk system from the dropdown and assign or unassign candidate details in real-time.
              </SheetDescription>
            </SheetHeader>
          </div>

          {/* Scrollable Form Body with Lenis Prevent (Scrollbar Hidden) */}
          <div 
            data-lenis-prevent 
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-4 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            onWheel={(e) => e.stopPropagation()}
            onTouchMoveCapture={(e) => e.stopPropagation()}
          >
            {/* Step 1: Select Kiosk System Dropdown (Available systems only) */}
            <div className="space-y-1.5 p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Select Kiosk System *</Label>
                <span className="text-[10px] text-muted-foreground">Showing available systems only</span>
              </div>
              <Select
                value={selectedSystemCode}
                onValueChange={(val) => {
                  const sorted = sortSystemsNaturally(systems);
                  const found = sorted.find((s) => s.systemCode === val);
                  setSelectedSystemCode(val);
                  if (found) {
                    setStudentName(found.assignedStudentName || "");
                    setStudentEmail(found.assignedStudentEmail || "");
                    const shiftNum = found.assignedShift || activeShiftState || 1;
                    setSelectedShiftForAssign(shiftNum);
                    const auto = getAutoSetForSystem(val, shiftNum);
                    setSelectedSet(found.assignedSet || auto);
                  }
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="-- Select Available Kiosk System --" />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    const availableSystemsForAssign = sortedSystems.filter(
                      (s) => (s.status === "REGISTERED" && !s.assignedStudentName) || s.systemCode === selectedSystemCode
                    );

                    if (availableSystemsForAssign.length === 0) {
                      return (
                        <div className="p-3 text-center text-xs text-muted-foreground">
                          No unassigned systems available. All registered kiosks are currently assigned or in progress.
                        </div>
                      );
                    }

                    return availableSystemsForAssign.map((s) => (
                      <SelectItem key={s.systemCode} value={s.systemCode} className="text-xs">
                        {s.systemNumber} ({s.systemCode}) {s.assignedStudentName ? `— Assigned: ${s.assignedStudentName}` : "— Available for Assignment"}
                      </SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
              {selectedSystem && (
                <div className="text-[11px] text-muted-foreground pt-1 flex items-center justify-between">
                  <span>Selected: <strong>{selectedSystem.systemNumber}</strong> ({selectedSystem.systemCode})</span>
                  <Badge variant={statusConfig[selectedSystem.status]?.variant || "outline"} className="text-[10px] scale-90">
                    {selectedSystem.status}
                  </Badge>
                </div>
              )}
            </div>

            {/* Currently Assigned Student Details & Unassign Button */}
            {selectedSystem?.assignedStudentName && (
              <div className="p-3 bg-muted/40 rounded-lg border space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground">Currently Assigned Candidate:</span>
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                    {selectedSystem.assignedShiftName || `Shift ${selectedSystem.assignedShift || activeShiftState || 1}`} · Set {selectedSystem.assignedSet || "A"}
                  </Badge>
                </div>
                <div className="text-xs space-y-0.5">
                  <div className="font-bold text-sm text-foreground">{selectedSystem.assignedStudentName}</div>
                  <div className="text-muted-foreground font-mono text-[11px]">{selectedSystem.assignedStudentEmail}</div>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="w-full text-xs font-semibold h-8 cursor-pointer gap-1.5"
                  onClick={async () => {
                    await handleUnassign(selectedSystem.id);
                  }}
                >
                  <UserX className="h-3.5 w-3.5" />
                  Unassign Student from {selectedSystem.systemNumber}
                </Button>
              </div>
            )}

            <Separator />

            {/* Step 2: Auto-Fetch via Response ID (if linked form exists) */}
            {formId && (
              <div className="space-y-2 p-3 bg-muted/40 rounded-lg border text-xs space-y-2">
                <Label className="text-xs font-semibold flex items-center gap-1">
                  <Search className="h-3.5 w-3.5 text-primary" />
                  Auto-fetch by Response ID
                </Label>
                <div className="flex gap-1.5">
                  <Input
                    placeholder="Paste Response ID..."
                    value={responseId}
                    onChange={(e) => setResponseId(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={handleFetchStudent}
                    disabled={isFetchingResponse}
                    className="h-8 px-2"
                  >
                    {isFetchingResponse ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Fetch"}
                  </Button>
                </div>

                {/* Form response quick picker */}
                {formResponses.length > 0 && (
                  <div className="space-y-1 mt-2">
                    <p className="text-[10px] text-muted-foreground font-medium">Or pick from form responses:</p>
                    <div className="max-h-28 overflow-y-auto space-y-1 border rounded bg-background p-1">
                      {formResponses.map((r) => {
                        const alreadySys = systems.find(
                          (s) => s.assignedResponseId === r.id ||
                          (s.assignedStudentEmail && r.submittedByEmail && s.assignedStudentEmail.toLowerCase() === r.submittedByEmail.toLowerCase())
                        );
                        return (
                          <button
                            key={r.id}
                            type="button"
                            disabled={!!alreadySys}
                            className={`w-full flex items-center justify-between text-[11px] p-1.5 rounded text-left transition-colors ${
                              alreadySys
                                ? "opacity-40 cursor-not-allowed bg-muted/30"
                                : "hover:bg-muted cursor-pointer"
                            }`}
                            onClick={() => {
                              if (alreadySys) return;
                              setResponseId(r.id);
                              setStudentName(r.submittedByName || "");
                              setStudentEmail(r.submittedByEmail || "");
                              toast.info(`Selected: ${r.submittedByName || r.id.slice(0, 6)}`);
                            }}
                          >
                            <span className="font-medium truncate max-w-[180px]">
                              {r.submittedByName || `Response ${r.id.slice(0, 6)}`} {alreadySys ? `(Assigned: ${alreadySys.systemNumber})` : ""}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                              {r.id.slice(0, 6)}...
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Candidate Name & Email */}
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Student Full Name *</Label>
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <Input
                    placeholder="e.g. Rahul Sharma"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Student Email Address *</Label>
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <Input
                    placeholder="e.g. rahul@example.com"
                    type="email"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Step 4: Assigned Shift & Set */}
            {shiftsConfig.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Assigned Shift</Label>
                <Select
                  value={selectedShiftForAssign.toString()}
                  onValueChange={(val) => {
                    const shiftNum = parseInt(val);
                    setSelectedShiftForAssign(shiftNum);
                    const auto = getAutoSetForSystem(selectedSystemCode, shiftNum);
                    setSelectedSet(auto);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select Shift" />
                  </SelectTrigger>
                  <SelectContent>
                    {shiftsConfig.map((s) => {
                      const sSets = s.sets && s.sets.length > 0 ? s.sets : [s.set || "A"];
                      return (
                        <SelectItem key={s.shiftNumber} value={s.shiftNumber.toString()} className="text-xs">
                          {s.name || `Shift ${s.shiftNumber}`} (Available: Sets {sSets.join(", ")})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Assign Question Set *</Label>
              </div>
              {(() => {
                const matchedShift = shiftsConfig.find((s) => s.shiftNumber === selectedShiftForAssign);
                const allowedForShift = matchedShift?.sets && matchedShift.sets.length > 0
                  ? matchedShift.sets
                  : Array.from({ length: sets }, (_, i) => String.fromCharCode(65 + i));

                return (
                  <>
                    <Select value={selectedSet} onValueChange={setSelectedSet}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {allowedForShift.map((letter) => (
                          <SelectItem key={letter} value={letter} className="text-xs">
                            Question Set {letter}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground">
                      Shift {selectedShiftForAssign} allows: <strong>Sets {allowedForShift.join(", ")}</strong> (Consecutive kiosks automatically alternate sets).
                    </p>
                  </>
                );
              })()}
            </div>

            {/* Preview Box */}
            {studentName && studentEmail && (
              <Alert className="p-2.5 bg-primary/5 border-primary/30 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                <AlertDescription className="text-xs">
                  <strong>{studentName}</strong> ({studentEmail}) — Shift {selectedShiftForAssign} (Set {selectedSet})
                </AlertDescription>
              </Alert>
            )}

            {/* Action Submit Buttons */}
            <div className="pt-3 space-y-2 border-t">
              <Button
                onClick={handleAssignStudent}
                disabled={isSubmittingAssign || !selectedSystemCode || !studentName || !studentEmail}
                className="w-full text-xs font-bold h-9 cursor-pointer"
              >
                {isSubmittingAssign && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                {selectedSystem?.assignedStudentName ? "Update Assignment" : "Assign Candidate to System"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedSystemCode("");
                  setResponseId("");
                  setStudentName("");
                  setStudentEmail("");
                }}
                className="w-full text-[11px] text-muted-foreground h-7"
              >
                Reset Form
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Confirmation Dialog for Shift Completion */}
      <Dialog open={completeShiftDialogOpen} onOpenChange={setCompleteShiftDialogOpen}>
        <DialogContent className="max-w-md rounded-xl border bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              Mark Shift {activeShiftState} as Completed?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Please review the consequences of completing the current shift.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-sm">
            <div className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs leading-relaxed">
              <p className="font-semibold mb-1">Notice on Shift Completion:</p>
              Confirming this will clear all currently assigned students from the active registration system for Shift {activeShiftState}.
              The quiz configuration, question sets, completed results, and overall rankings will remain completely intact. Connected kiosks will remain registered and ready for the next shift.
            </div>

            <div className="text-xs space-y-1.5 text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Current Shift:</span>
                <span className="font-semibold text-foreground">Shift {activeShiftState}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Active Systems Assigned:</span>
                <span className="font-semibold text-foreground">{assignedCount + inProgressCount} Systems</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Next Shift:</span>
                <span className="font-semibold text-foreground">Shift {Math.min((shiftsConfig.length || 1), activeShiftState + 1)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <Button
              variant="outline"
              onClick={() => setCompleteShiftDialogOpen(false)}
              disabled={isCompletingShift}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleCompleteShift}
              disabled={isCompletingShift}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
            >
              {isCompletingShift ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Completing Shift...
                </>
              ) : (
                `Yes, Complete Shift ${activeShiftState}`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
