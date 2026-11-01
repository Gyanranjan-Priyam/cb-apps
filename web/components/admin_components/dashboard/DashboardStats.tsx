"use client";

import { useState, useMemo } from "react";
import {
  Card,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  BrainCircuit,
  CheckSquare,
  Trophy,
  Compass,
  FileText,
  Layers,
  QrCode,
  Receipt,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  BarChart3,
  Code2,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface DashboardStatsProps {
  stats: {
    // Users
    totalUsers: number;
    verifiedUsers: number;
    bannedUsers: number;
    newUsersThisMonth: number;

    // Roadmaps
    totalRoadmaps: number;
    publishedRoadmaps: number;

    // Batches
    totalBatches: number;
    batches?: Array<{ id: string; name: string; code: string }>;

    // Forms
    totalForms: number;
    activeForms: number;
    totalFormResponses: number;

    // Quizzes
    totalQuizzes: number;
    activeQuizzes: number;
    totalQuizAttempts: number;

    // Events & Attendance
    totalEvents: number;
    upcomingEvents: number;
    totalAttendance: number;
    totalSessions: number;

    // Tasks
    totalTasks: number;
    pendingTasks: number;
    approvedSubmissions: number;

    // Points
    totalPointsDistributed: number;

    // Recent activities
    recentUsers: Array<{
      id: string;
      name: string;
      email: string;
      username?: string | null;
      createdAt: Date;
      emailVerified: boolean;
      role?: string | null;
      branch?: string | null;
      batch?: { name: string; code: string } | null;
    }>;

    // Top Performers Leaderboard
    topPerformers?: Array<{
      id: string;
      name: string;
      username?: string | null;
      email: string;
      branch?: string | null;
      batchId?: string | null;
      batch?: { id?: string; name: string; code: string } | null;
      points: number;
      attendancePoints?: number;
      taskPoints?: number;
      eventPoints?: number;
      quizPoints?: number;
    }>;
  };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const [selectedBatchId, setSelectedBatchId] = useState<string>("all");

  const verificationRate =
    stats.totalUsers > 0
      ? Math.round((stats.verifiedUsers / stats.totalUsers) * 100)
      : 0;

  const topPerformers = stats.topPerformers || [];
  const batches = stats.batches || [];

  // Filter performers based on selected batch
  const filteredPerformers = useMemo(() => {
    if (selectedBatchId === "all") {
      return topPerformers;
    }
    return topPerformers.filter((p) => p.batchId === selectedBatchId);
  }, [selectedBatchId, topPerformers]);

  const topRankedUser = filteredPerformers.length > 0 ? filteredPerformers[0] : null;
  const maxPoints = topRankedUser?.points || 1;
  const displayRankedList = filteredPerformers.slice(0, 6);

  // Geometric Overview KPIs
  const heroKpis = [
    {
      title: "Total Members",
      value: stats.totalUsers,
      subtext: `${stats.verifiedUsers} verified (${verificationRate}%)`,
      change: `+${stats.newUsersThisMonth} this month`,
      icon: Users,
      color: "text-blue-500",
      borderColor: "border-blue-500/20 hover:border-blue-500/50",
      bgGlow: "bg-blue-500/5",
      href: "/admin/members",
    },
    {
      title: "Learning Roadmaps",
      value: stats.totalRoadmaps,
      subtext: `${stats.publishedRoadmaps} published tracks`,
      change: "Interactive Studio",
      icon: Compass,
      color: "text-indigo-500",
      borderColor: "border-indigo-500/20 hover:border-indigo-500/50",
      bgGlow: "bg-indigo-500/5",
      href: "/admin/roadmaps",
    },
    {
      title: "Forms & Responses",
      value: stats.totalForms,
      subtext: `${stats.totalFormResponses} submissions recorded`,
      change: `${stats.activeForms} accepting now`,
      icon: FileText,
      color: "text-emerald-500",
      borderColor: "border-emerald-500/20 hover:border-emerald-500/50",
      bgGlow: "bg-emerald-500/5",
      href: "/admin/forms",
    },
    {
      title: "Attendance & QR",
      value: stats.totalAttendance,
      subtext: `Across ${stats.totalSessions} sessions`,
      change: "Live QR Verification",
      icon: QrCode,
      color: "text-amber-500",
      borderColor: "border-amber-500/20 hover:border-amber-500/50",
      bgGlow: "bg-amber-500/5",
      href: "/admin/attendance",
    },
    {
      title: "Points Awarded",
      value: stats.totalPointsDistributed.toLocaleString(),
      subtext: "Gamification & Leaderboard",
      change: `${stats.approvedSubmissions} submissions`,
      icon: Trophy,
      color: "text-yellow-500",
      borderColor: "border-yellow-500/20 hover:border-yellow-500/50",
      bgGlow: "bg-yellow-500/5",
      href: "/admin/points",
    },
    {
      title: "Quizzes & Tests",
      value: stats.totalQuizzes,
      subtext: `${stats.totalQuizAttempts} total attempts`,
      change: `${stats.activeQuizzes} active now`,
      icon: BrainCircuit,
      color: "text-purple-500",
      borderColor: "border-purple-500/20 hover:border-purple-500/50",
      bgGlow: "bg-purple-500/5",
      href: "/admin/quizzes",
    },
  ];

  // Functional Operational Pillars
  const featurePillars = [
    {
      pillar: "Curriculum & Engineering",
      tag: "Knowledge Engine",
      items: [
        {
          title: "Roadmaps Studio",
          desc: "Visual interactive drag-and-drop roadmap and curriculum builder",
          badge: `${stats.totalRoadmaps} Maps`,
          href: "/admin/roadmaps",
          icon: Compass,
          color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
        },
        {
          title: "Quizzes & Proctoring",
          desc: "Time-locked assessments, multi-set assignment, and automated grading",
          badge: `${stats.activeQuizzes} Active`,
          href: "/admin/quizzes",
          icon: BrainCircuit,
          color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
        },
        {
          title: "Tasks & Assignments",
          desc: "Project submissions, GitHub code evaluation, and scoring workflows",
          badge: `${stats.totalTasks} Tasks`,
          href: "/admin/tasks",
          icon: CheckSquare,
          color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
        },
      ],
    },
    {
      pillar: "Student & Cohort Systems",
      tag: "Academic Ops",
      items: [
        {
          title: "Member Directory",
          desc: "Manage registered student profiles, roles, and digital QR ID cards",
          badge: `${stats.totalUsers} Students`,
          href: "/admin/members",
          icon: Users,
          color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        },
        {
          title: "Batches & Cohorts",
          desc: "Organize students by academic admission year and batch permissions",
          badge: `${stats.totalBatches} Cohorts`,
          href: "/admin/batches",
          icon: Layers,
          color: "text-teal-400 bg-teal-500/10 border-teal-500/20",
        },
        {
          title: "QR Attendance Suite",
          desc: "Real-time dynamic rotating QR code attendance scanner and logs",
          badge: `${stats.totalSessions} Sessions`,
          href: "/admin/attendance",
          icon: QrCode,
          color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        },
      ],
    },
    {
      pillar: "Forms, Finance & Points",
      tag: "Platform Hub",
      items: [
        {
          title: "Dynamic Forms Engine",
          desc: "Custom application builder, payment attachments, and live PDF receipts",
          badge: `${stats.activeForms} Active`,
          href: "/admin/forms",
          icon: FileText,
          color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
        },
        {
          title: "Points & Leaderboard",
          desc: "Manage gamification points distribution and student rankings",
          badge: `${stats.totalPointsDistributed.toLocaleString()} Pts`,
          href: "/admin/points",
          icon: Trophy,
          color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
        },
        {
          title: "Financial Ledger",
          desc: "Payment transaction verifications, receipts, and audit trail records",
          badge: "Audits",
          href: "/admin/transactions",
          icon: Receipt,
          color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {/* ── 1. Geometric KPI Matrix ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {heroKpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={kpi.title}
              href={kpi.href}
              prefetch={true}
              className="group block"
            >
              <Card
                className={`h-full border transition-all duration-200 hover:shadow-lg ${kpi.borderColor} ${kpi.bgGlow} p-4 flex flex-col justify-between relative overflow-hidden`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-medium truncate">
                    {kpi.title}
                  </span>
                  <div
                    className={`p-1.5 rounded-md ${kpi.color} bg-background/80 border border-border/40 shrink-0 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="my-3">
                  <div className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono">
                    {kpi.value}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {kpi.subtext}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[10px]">
                  <span className="font-medium text-foreground/80 truncate">
                    {kpi.change}
                  </span>
                  <ArrowUpRight className="w-3 h-3 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* ── 2. Functional Operational Pillars (Modular Grid) ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <h2 className="text-base font-bold tracking-tight uppercase font-mono text-foreground">
              Administrative Command Modules
            </h2>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            9 Core Modules Connected
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {featurePillars.map((pillar) => (
            <div key={pillar.pillar} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-foreground/90 uppercase tracking-wider font-mono">
                  {pillar.pillar}
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase font-mono py-0 h-4 border-border/60"
                >
                  {pillar.tag}
                </Badge>
              </div>

              <div className="space-y-2.5">
                {pillar.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      prefetch={true}
                      className="group block"
                    >
                      <div className="p-3.5 rounded-xl border border-border/70 bg-card hover:bg-accent/40 hover:border-primary/40 transition-all duration-200 shadow-xs flex items-start gap-3.5">
                        <div
                          className={`p-2 rounded-lg border shrink-0 ${item.color} group-hover:scale-105 transition-transform`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1.5">
                            <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                              {item.title}
                            </h3>
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-mono h-4 px-1.5 py-0 shrink-0 font-normal"
                            >
                              {item.badge}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. Bottom Split: Recent Onboardings & Batch-Filtered Leaderboard Graph ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Recent Member Onboardings */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold tracking-tight uppercase font-mono">
                Recent Member Onboardings
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-7 text-xs font-mono gap-1 text-muted-foreground hover:text-foreground"
            >
              <Link href="/admin/members" prefetch={true}>
                View All ({stats.totalUsers})
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>

          <Card className="border-border/70 overflow-hidden">
            <div className="divide-y divide-border/40">
              {stats.recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="p-3.5 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-xs shrink-0 uppercase font-mono">
                      {user.name.charAt(0)}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground truncate">
                          {user.name}
                        </span>
                        {user.emailVerified ? (
                          <span title="Verified Member">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          </span>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[9px] py-0 h-3.5 text-amber-500 border-amber-500/30"
                          >
                            Pending
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate font-mono">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {user.batch && (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono hidden sm:inline-flex bg-muted/40"
                      >
                        {user.batch.code}
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {format(new Date(user.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Graphical Leaderboard with Batch-Wise Filter System */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <h3 className="text-sm font-bold tracking-tight uppercase font-mono">
                Performance Leaderboard
              </h3>
            </div>

            {/* Batch Filter Selector */}
            <div className="flex items-center gap-2">
              <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                <SelectTrigger size="sm" className="h-7 text-xs font-mono w-[160px] bg-card border-border/70">
                  <SelectValue placeholder="Filter Cohort" />
                </SelectTrigger>
                <SelectContent align="end" className="font-mono text-xs">
                  <SelectItem value="all">All Cohorts (Global)</SelectItem>
                  {batches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.code} ({b.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-7 text-xs font-mono gap-1 text-muted-foreground hover:text-foreground hidden sm:flex"
              >
                <Link href="/admin/points" prefetch={true}>
                  Full
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {/* 👑 #1 Highest Point Achiever Hero Card (Top of Section) */}
            {topRankedUser ? (
              <Card className="border-yellow-500/40 bg-linear-to-br from-yellow-500/10 via-card to-card p-4 relative overflow-hidden shadow-sm">
                <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-20 h-20 bg-yellow-500/10 rounded-full blur-xl pointer-events-none" />

                <div className="flex items-center justify-between gap-3 relative z-10">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-yellow-500/20 border-2 border-yellow-500/40 flex items-center justify-center font-bold text-yellow-600 dark:text-yellow-400 text-sm shrink-0 shadow-xs uppercase font-mono relative">
                      {topRankedUser.name.charAt(0)}
                      <span className="absolute -top-1.5 -right-1.5 text-xs">👑</span>
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-yellow-500 text-black font-mono text-[9px] px-1.5 py-0 h-4 font-bold uppercase tracking-wider">
                          Rank #1 High Score
                        </Badge>
                        {topRankedUser.batch && (
                          <Badge variant="outline" className="text-[10px] font-mono border-yellow-500/30">
                            {topRankedUser.batch.code}
                          </Badge>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-foreground truncate">
                        {topRankedUser.name}
                      </h4>
                      <p className="text-[11px] text-muted-foreground truncate font-mono">
                        {topRankedUser.branch || "General Member"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xl sm:text-2xl font-extrabold font-mono text-yellow-600 dark:text-yellow-400">
                      {topRankedUser.points.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                      Points
                    </span>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="border-border/70 p-6 text-center text-xs text-muted-foreground font-mono">
                No participants or points recorded in this cohort yet.
              </Card>
            )}

            {/* 📊 Visual Point Distribution Graph (Relative Proportion Bars) */}
            {displayRankedList.length > 0 && (
              <Card className="border-border/70 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-mono border-b border-border/40 pb-2">
                  <span className="flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-primary" />
                    Cohort Point Distribution Graph
                  </span>
                  <span>Max: {maxPoints.toLocaleString()} pts</span>
                </div>

                <div className="space-y-3 pt-1">
                  {displayRankedList.map((user, idx) => {
                    const rank = idx + 1;
                    const percent = Math.max(8, Math.round((user.points / maxPoints) * 100));
                    const isFirst = rank === 1;
                    const isSecond = rank === 2;
                    const isThird = rank === 3;

                    const barColor = isFirst
                      ? "bg-linear-to-r from-yellow-500 to-amber-500"
                      : isSecond
                      ? "bg-linear-to-r from-slate-400 to-slate-500"
                      : isThird
                      ? "bg-linear-to-r from-amber-700 to-amber-800"
                      : "bg-linear-to-r from-primary/70 to-primary";

                    const badgeColor = isFirst
                      ? "bg-yellow-500 text-black font-bold"
                      : isSecond
                      ? "bg-slate-300 text-slate-900 dark:bg-slate-700 dark:text-slate-100"
                      : isThird
                      ? "bg-amber-700 text-white"
                      : "bg-muted text-muted-foreground";

                    return (
                      <div key={user.id} className="space-y-1 group">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-5 h-5 rounded text-[10px] flex items-center justify-center shrink-0 ${badgeColor}`}>
                              #{rank}
                            </span>
                            <span className="font-semibold text-foreground truncate max-w-[150px] sm:max-w-[200px]">
                              {user.name}
                            </span>
                            {user.batch && (
                              <span className="text-[10px] text-muted-foreground hidden sm:inline">
                                ({user.batch.code})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-bold text-foreground font-mono">
                              {user.points.toLocaleString()} pts
                            </span>
                            <span className="text-[10px] text-muted-foreground w-8 text-right font-mono">
                              {Math.round((user.points / maxPoints) * 100)}%
                            </span>
                          </div>
                        </div>

                        {/* Visual Progress / Ratio Bar */}
                        <div className="h-2.5 w-full bg-muted/60 rounded-full overflow-hidden p-0.5">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
