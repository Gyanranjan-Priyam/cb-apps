"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Trophy,
  Calendar,
  Layers,
  Search,
  Download,
  ExternalLink,
  Users,
  Award,
  CheckCircle2,
  Brain,
  ListChecks,
  Sparkles,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import type { LeaderboardEntry } from "@/app/(public)/dashboard/leaderboard/actions";
import { BRANCH_OPTIONS } from "@/lib/branch-constants";

interface BatchItem {
  id: string;
  name: string;
  code: string;
}

interface AdminLeaderboardViewProps {
  initialOverallData: LeaderboardEntry[];
  initialMonthlyData: LeaderboardEntry[];
  batches: BatchItem[];
  currentYear: number;
  currentMonth: number;
}

type SortField =
  | "totalPoints"
  | "attendancePoints"
  | "taskPoints"
  | "quizPoints"
  | "eventPoints"
  | "sessionsAttended";

export function AdminLeaderboardView({
  initialOverallData,
  initialMonthlyData,
  batches,
  currentYear,
  currentMonth,
}: AdminLeaderboardViewProps) {
  const [activeTab, setActiveTab] = useState<"overall" | "monthly">("overall");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBatch, setSelectedBatch] = useState<string>("all");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("totalPoints");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Filter and Sort Data
  const currentDataset =
    activeTab === "overall" ? initialOverallData : initialMonthlyData;

  const filteredData = useMemo(() => {
    return currentDataset
      .filter((item) => {
        // Batch filter
        if (selectedBatch !== "all") {
          const itemBatchId = item.batchId || item.batch?.id;
          if (itemBatchId !== selectedBatch) return false;
        }

        // Branch filter
        if (selectedBranch !== "all" && item.branch !== selectedBranch) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = item.userName?.toLowerCase().includes(q);
          const matchUsername = item.username?.toLowerCase().includes(q);
          const matchReg = item.registration?.toLowerCase().includes(q);
          const matchBranch = item.branch?.toLowerCase().includes(q);
          const matchBatch =
            item.batch?.name?.toLowerCase().includes(q) ||
            item.batch?.code?.toLowerCase().includes(q);

          if (
            !matchName &&
            !matchUsername &&
            !matchReg &&
            !matchBranch &&
            !matchBatch
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const valA = (a[sortField] as number) || 0;
        const valB = (b[sortField] as number) || 0;
        return sortOrder === "desc" ? valB - valA : valA - valB;
      });
  }, [
    currentDataset,
    selectedBatch,
    selectedBranch,
    searchQuery,
    sortField,
    sortOrder,
  ]);

  // Overall KPIs
  const stats = useMemo(() => {
    const totalStudents = filteredData.length;
    const totalPoints = filteredData.reduce(
      (sum, item) => sum + item.totalPoints,
      0,
    );
    const totalAttendanceSessions = filteredData.reduce(
      (sum, item) => sum + (item.sessionsAttended || 0),
      0,
    );
    const avgPoints =
      totalStudents > 0 ? Math.round(totalPoints / totalStudents) : 0;

    return {
      totalStudents,
      totalPoints,
      totalAttendanceSessions,
      avgPoints,
    };
  }, [filteredData]);

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = [
      "Rank",
      "Name",
      "Registration No",
      "Branch",
      "Batch",
      "Total Points",
      "Attendance Points",
      "Task Points",
      "Quiz Points",
      "Event Points",
      "Sessions Attended",
      "Tasks Completed",
      "Quizzes Taken",
    ];

    const rows = filteredData.map((item, index) => [
      index + 1,
      `"${item.userName || "N/A"}"`,
      `"${item.registration || "N/A"}"`,
      `"${item.branch || "N/A"}"`,
      `"${item.batch?.name || item.batch?.code || "Unassigned"}"`,
      item.totalPoints,
      item.attendancePoints,
      item.taskPoints,
      item.quizPoints,
      item.eventPoints,
      item.sessionsAttended || 0,
      item.tasksCompleted || 0,
      item.quizzesTaken || 0,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `CodeBreakers_${activeTab}_leaderboard_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-mono font-bold px-2 py-0.5 border-0 shadow-sm">
          🥇 #1
        </Badge>
      );
    }
    if (rank === 2) {
      return (
        <Badge className="bg-slate-400 hover:bg-slate-500 text-white font-mono font-bold px-2 py-0.5 border-0 shadow-sm">
          🥈 #2
        </Badge>
      );
    }
    if (rank === 3) {
      return (
        <Badge className="bg-amber-700 hover:bg-amber-800 text-white font-mono font-bold px-2 py-0.5 border-0 shadow-sm">
          🥉 #3
        </Badge>
      );
    }
    if (rank <= 10) {
      return (
        <Badge
          variant="outline"
          className="font-mono font-semibold px-2 py-0.5 border-primary/30 text-primary bg-primary/5"
        >
          #{rank}
        </Badge>
      );
    }
    return (
      <span className="font-mono text-xs text-muted-foreground font-medium pl-2">
        #{rank}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 w-full">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Trophy className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Student Leaderboard & Progress
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
            Monitor real-time student performance, point distributions, and
            engagement across all cohorts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            className="h-9 text-xs font-mono gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>

          <Button asChild size="sm" className="h-9 text-xs font-mono gap-1.5">
            <Link href="/admin/points">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Manage Points</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Metric Summary Tiles (4 KPI Grid) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 border border-border/80 bg-card space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider">
              Students Ranked
            </span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
            {stats.totalStudents}
          </div>
          <p className="text-[10px] text-muted-foreground font-mono">
            Active verified student profiles
          </p>
        </Card>

        <Card className="p-4 border border-border/80 bg-card space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider">
              Points Velocity
            </span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
            {stats.totalPoints.toLocaleString()}
          </div>
          <p className="text-[10px] text-muted-foreground font-mono">
            Combined points awarded
          </p>
        </Card>

        <Card className="p-4 border border-border/80 bg-card space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider">
              Avg Student PTS
            </span>
            <Trophy className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
            {stats.avgPoints}
          </div>
          <p className="text-[10px] text-muted-foreground font-mono">
            Mean points per active student
          </p>
        </Card>

        <Card className="p-4 border border-border/80 bg-card space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider">
              Attendance Logs
            </span>
            <CheckCircle2 className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
            {stats.totalAttendanceSessions}
          </div>
          <p className="text-[10px] text-muted-foreground font-mono">
            Present sessions recorded
          </p>
        </Card>
      </div>

      {/* ── Top 3 Podium Highlights (if >= 3 students) ── */}
      {filteredData.length >= 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Rank 2 (Silver) */}
          <Card className="p-4 border border-slate-300/40 bg-card relative overflow-hidden flex flex-col justify-between order-2 sm:order-1">
            <div className="flex items-center justify-between">
              <Badge className="bg-slate-400 text-white font-mono font-bold px-2 py-0.5">
                🥈 2nd Place
              </Badge>
              <span className="text-xs font-mono font-bold text-foreground">
                {filteredData[1].totalPoints} PTS
              </span>
            </div>
            <div className="mt-3 space-y-0.5">
              <h3 className="font-bold text-sm text-foreground truncate">
                {filteredData[1].userName}
              </h3>
              <p className="text-[11px] text-muted-foreground font-mono truncate">
                {filteredData[1].branch || "General"} •{" "}
                {filteredData[1].batch?.code || "Member"}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
              <span>{filteredData[1].attendancePoints} Att</span>
              <span>{filteredData[1].taskPoints} Task</span>
              <span>{filteredData[1].quizPoints} Quiz</span>
            </div>
          </Card>

          {/* Rank 1 (Gold) */}
          <Card className="p-4 border-2 border-amber-500/50 bg-amber-500/5 relative overflow-hidden flex flex-col justify-between order-1 sm:order-2 shadow-md">
            <div className="flex items-center justify-between">
              <Badge className="bg-amber-500 text-white font-mono font-bold px-2.5 py-0.5 shadow-sm">
                👑 Champion #1
              </Badge>
              <span className="text-sm font-mono font-bold text-amber-600 dark:text-amber-400">
                {filteredData[0].totalPoints} PTS
              </span>
            </div>
            <div className="mt-3 space-y-0.5">
              <h3 className="font-bold text-base text-foreground truncate">
                {filteredData[0].userName}
              </h3>
              <p className="text-xs text-muted-foreground font-mono truncate">
                {filteredData[0].branch || "General"} •{" "}
                {filteredData[0].batch?.code || "Member"}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-[10px] font-mono font-medium text-foreground">
              <span>{filteredData[0].attendancePoints} Att</span>
              <span>{filteredData[0].taskPoints} Task</span>
              <span>{filteredData[0].quizPoints} Quiz</span>
            </div>
          </Card>

          {/* Rank 3 (Bronze) */}
          <Card className="p-4 border border-amber-700/40 bg-card relative overflow-hidden flex flex-col justify-between order-3 sm:order-3">
            <div className="flex items-center justify-between">
              <Badge className="bg-amber-700 text-white font-mono font-bold px-2 py-0.5">
                🥉 3rd Place
              </Badge>
              <span className="text-xs font-mono font-bold text-foreground">
                {filteredData[2].totalPoints} PTS
              </span>
            </div>
            <div className="mt-3 space-y-0.5">
              <h3 className="font-bold text-sm text-foreground truncate">
                {filteredData[2].userName}
              </h3>
              <p className="text-[11px] text-muted-foreground font-mono truncate">
                {filteredData[2].branch || "General"} •{" "}
                {filteredData[2].batch?.code || "Member"}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
              <span>{filteredData[2].attendancePoints} Att</span>
              <span>{filteredData[2].taskPoints} Task</span>
              <span>{filteredData[2].quizPoints} Quiz</span>
            </div>
          </Card>
        </div>
      )}

      {/* ── Tabs & Filter Controls ── */}
      <Card className="border border-border/80 bg-card">
        <div className="p-4 sm:p-5 border-b border-border/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as "overall" | "monthly")}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid grid-cols-2 w-full sm:w-80">
              <TabsTrigger
                value="overall"
                className="text-xs font-mono gap-1.5"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Overall Ranking</span>
              </TabsTrigger>
              <TabsTrigger
                value="monthly"
                className="text-xs font-mono gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Monthly Cycle</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search and Dropdown Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full lg:w-auto">
            {/* Batch Selector */}
            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
              <SelectTrigger className="h-9 text-xs font-mono">
                <SelectValue placeholder="All Batches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  All Batches ({batches.length})
                </SelectItem>
                {batches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Branch Selector */}
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="h-9 text-xs font-mono">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {BRANCH_OPTIONS.map((br) => (
                  <SelectItem key={br.code} value={br.code}>
                    {br.code} - {br.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name, roll, reg..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-8 text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* ── Leaderboard Table ── */}
        <CardContent className="p-0">
          <div className="overflow-x-auto overscroll-x-contain">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border/60">
                  <TableHead className="w-16 text-center text-xs font-mono uppercase">
                    Rank
                  </TableHead>
                  <TableHead className="min-w-[200px] text-xs font-mono uppercase">
                    Student Member
                  </TableHead>
                  <TableHead className="min-w-[120px] text-xs font-mono uppercase">
                    Cohort / Branch
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("totalPoints")}
                    className="text-right text-xs font-mono uppercase cursor-pointer hover:text-foreground select-none"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Total PTS</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("attendancePoints")}
                    className="text-right text-xs font-mono uppercase cursor-pointer hover:text-foreground select-none hidden md:table-cell"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Attendance</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("taskPoints")}
                    className="text-right text-xs font-mono uppercase cursor-pointer hover:text-foreground select-none hidden lg:table-cell"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Tasks</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("quizPoints")}
                    className="text-right text-xs font-mono uppercase cursor-pointer hover:text-foreground select-none hidden lg:table-cell"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Quizzes</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead className="w-20 text-center text-xs font-mono uppercase">
                    Profile
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((student, index) => {
                    const identifier = student.username || student.userId;
                    return (
                      <TableRow
                        key={student.userId}
                        className="hover:bg-muted/30 transition-colors border-b border-border/40"
                      >
                        {/* Rank */}
                        <TableCell className="text-center font-mono text-xs">
                          {getRankBadge(index + 1)}
                        </TableCell>

                        {/* Student Details */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-xs text-foreground truncate max-w-[180px]">
                                {student.userName}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-mono truncate">
                              {student.registration
                                ? `Reg: ${student.registration}`
                                : `@${student.username || "user"}`}
                            </p>
                          </div>
                        </TableCell>

                        {/* Cohort / Branch */}
                        <TableCell>
                          <div className="flex items-center gap-1 flex-wrap">
                            {student.batch && (
                              <Badge
                                variant="outline"
                                className="text-[9px] font-mono px-1.5 py-0 h-4"
                              >
                                {student.batch.code}
                              </Badge>
                            )}
                            {student.branch && (
                              <Badge
                                variant="secondary"
                                className="text-[9px] font-mono px-1.5 py-0 h-4"
                              >
                                {student.branch}
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        {/* Total Points */}
                        <TableCell className="text-right">
                          <Badge
                            variant="default"
                            className="font-mono text-xs font-bold px-2 py-0.5 bg-primary/15 text-primary border border-primary/30"
                          >
                            {student.totalPoints} PTS
                          </Badge>
                        </TableCell>

                        {/* Attendance */}
                        <TableCell className="text-right text-xs font-mono hidden md:table-cell">
                          <span className="text-foreground font-semibold">
                            {student.attendancePoints} pts
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            {student.sessionsAttended || 0} sessions
                          </span>
                        </TableCell>

                        {/* Tasks */}
                        <TableCell className="text-right text-xs font-mono hidden lg:table-cell">
                          <span className="text-foreground font-semibold">
                            {student.taskPoints} pts
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            {student.tasksCompleted || 0} approved
                          </span>
                        </TableCell>

                        {/* Quizzes */}
                        <TableCell className="text-right text-xs font-mono hidden lg:table-cell">
                          <span className="text-foreground font-semibold">
                            {student.quizPoints} pts
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            {student.quizzesTaken || 0} tests
                          </span>
                        </TableCell>

                        {/* Public Link */}
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <Link
                              href={`/member/${encodeURIComponent(identifier)}`}
                              prefetch={true}
                              title="View Public Profile"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-32 text-center text-xs text-muted-foreground font-mono"
                    >
                      No students found matching the selected filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
