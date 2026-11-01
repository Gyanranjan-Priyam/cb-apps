"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import {
  TrendingUp,
  ArrowUpRight,
  Activity,
  BarChart3,
  LineChart as LineChartIcon,
  CalendarCheck,
  FileCode,
  HelpCircle,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Badge } from "@/components/ui/badge";

export interface MonthlyPointRecord {
  month: string;
  total: number;
  attendance: number;
  tasks: number;
  quizzes: number;
  events: number;
}

interface AnalyticsGraphCardProps {
  stats: {
    totalPoints: number;
    attendancePoints: number;
    taskPoints: number;
    quizPoints: number;
    eventPoints?: number;
    pendingTasks: number;
    activeQuizzes: number;
    upcomingEvents?: number;
    monthlyProgress?: MonthlyPointRecord[];
  };
  recentActivities?: Array<{
    id: string;
    type: "task" | "event" | "quiz";
    title: string;
    description: string;
    date: Date | string;
    status?: string;
    points?: number;
  }>;
}

type TabType = "ALL" | "ATTENDANCE" | "TASKS" | "QUIZZES" | "EVENTS";
type ChartMode = "AREA" | "BAR";

export function AnalyticsGraphCard({ stats }: AnalyticsGraphCardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("ALL");
  const [chartMode, setChartMode] = useState<ChartMode>("AREA");

  const eventPts = stats.eventPoints || 0;

  // Format 6 months of data with safe defaults
  const chartData = useMemo(() => {
    if (stats.monthlyProgress && stats.monthlyProgress.length > 0) {
      return stats.monthlyProgress.map((m) => ({
        ...m,
        total: Number(m.total || 0),
        attendance: Number(m.attendance || 0),
        tasks: Number(m.tasks || 0),
        quizzes: Number(m.quizzes || 0),
        events: Number(m.events || 0),
      }));
    }

    const now = new Date();
    const fallback: MonthlyPointRecord[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      fallback.push({
        month: d.toLocaleString("default", { month: "short" }),
        total: 0,
        attendance: 0,
        tasks: 0,
        quizzes: 0,
        events: 0,
      });
    }
    return fallback;
  }, [stats.monthlyProgress]);

  // Tab configurations: colors, metrics, and labels
  const tabConfig = useMemo(() => {
    switch (activeTab) {
      case "ATTENDANCE":
        return {
          dataKey: "attendance",
          label: "Attendance Points",
          points: stats.attendancePoints,
          color: "#10b981", // Emerald
          gradientId: "attGradient",
          icon: CalendarCheck,
          subtitle: "Verified session presence logs",
        };
      case "TASKS":
        return {
          dataKey: "tasks",
          label: "Task Points",
          points: stats.taskPoints,
          color: "#8b5cf6", // Violet / Indigo
          gradientId: "taskGradient",
          icon: FileCode,
          subtitle: `${stats.pendingTasks} pending task${stats.pendingTasks === 1 ? "" : "s"} available`,
        };
      case "QUIZZES":
        return {
          dataKey: "quizzes",
          label: "Quiz Points",
          points: stats.quizPoints,
          color: "#0ea5e9", // Sky Blue
          gradientId: "quizGradient",
          icon: HelpCircle,
          subtitle: `${stats.activeQuizzes} active quiz${stats.activeQuizzes === 1 ? "" : "zes"} available`,
        };
      case "EVENTS":
        return {
          dataKey: "events",
          label: "Event Points",
          points: eventPts,
          color: "#f59e0b", // Amber / Gold
          gradientId: "eventGradient",
          icon: Trophy,
          subtitle: "Hackathons, workshops & competition awards",
        };
      case "ALL":
      default:
        return {
          dataKey: "total",
          label: "Total Score",
          points: stats.totalPoints,
          color: "#22c55e", // Bright Emerald Green
          gradientId: "allGradient",
          icon: Activity,
          subtitle: "Combined cross-platform performance velocity",
        };
    }
  }, [activeTab, stats, eventPts]);

  // Compute month-over-month growth rate
  const growthRate = useMemo(() => {
    const key = tabConfig.dataKey as keyof MonthlyPointRecord;
    const values = chartData.map((d) => Number(d[key] || 0));
    const current = values[values.length - 1] || 0;
    const previous = values[values.length - 2] || 0;

    if (previous === 0 && current > 0) return "+100%";
    if (previous === 0 && current === 0) return "0%";
    const diff = current - previous;
    const pct = Math.round((diff / previous) * 100);
    return `${pct >= 0 ? "+" : ""}${pct}%`;
  }, [chartData, tabConfig.dataKey]);

  // Compute dynamic Y-axis maximum for proportional scaling (never flat)
  const yAxisDomain = useMemo<[number, number]>(() => {
    const key = tabConfig.dataKey as keyof MonthlyPointRecord;
    const values = chartData.map((d) => Number(d[key] || 0));
    const maxVal = Math.max(...values, 0);

    if (maxVal <= 0) {
      return [0, 10];
    }
    if (maxVal <= 10) {
      return [0, 15];
    }
    if (maxVal <= 30) {
      return [0, Math.ceil((maxVal + 5) / 5) * 5];
    }
    return [0, Math.ceil((maxVal * 1.2) / 10) * 10];
  }, [chartData, tabConfig.dataKey]);

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: "ALL", label: "All Velocity", count: stats.totalPoints },
    { key: "ATTENDANCE", label: "Attendance", count: stats.attendancePoints },
    { key: "TASKS", label: "Tasks", count: stats.taskPoints },
    { key: "QUIZZES", label: "Quizzes", count: stats.quizPoints },
    { key: "EVENTS", label: "Events", count: eventPts },
  ];

  return (
    <Card className="rounded-2xl border border-border/80 bg-card text-card-foreground p-5 sm:p-6 shadow-xs relative overflow-hidden flex flex-col gap-5">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight text-foreground font-mono uppercase">
                Monthly Progress Velocity
              </h2>
              <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0 h-4 bg-muted text-muted-foreground">
                6M Track
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">
              Live learning momentum & points cadence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Chart Display Mode Switcher (Area Curve vs Column Bar) */}
          <div className="flex items-center p-0.5 rounded-lg bg-muted/60 border border-border/60">
            <button
              type="button"
              onClick={() => setChartMode("AREA")}
              title="Spline Area Chart"
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                chartMode === "AREA"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setChartMode("BAR")}
              title="Column Bar Chart"
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                chartMode === "BAR"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
          </div>

          <Link
            href="/dashboard/leaderboard"
            prefetch={true}
            className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 group px-2.5 py-1 rounded-lg border border-border/40 hover:border-border hover:bg-muted/30"
          >
            <span>Leaderboard</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* ── Category Pill Filter Tabs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 rounded-xl bg-muted/40 border border-border/60">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-card text-foreground shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              <span className="truncate">{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono shrink-0 ${
                  isActive
                    ? "bg-primary/15 text-primary font-bold"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Primary Metric Summary Display ── */}
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-2">
            <span
              className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight"
              style={{ color: tabConfig.color }}
            >
              {tabConfig.points.toLocaleString()}
            </span>
            <span className="text-sm font-semibold font-mono text-muted-foreground uppercase">
              PTS Total
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {tabConfig.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{growthRate}</span>
            <span className="text-[10px] font-normal text-muted-foreground">vs last mo</span>
          </div>
        </div>
      </div>

      {/* ── Professional Interactive Chart Container ── */}
      <div className="w-full h-56 sm:h-64 rounded-xl bg-muted/20 border border-border/60 p-2 sm:p-3 relative">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === "AREA" ? (
            <AreaChart
              data={chartData}
              margin={{ top: 15, right: 12, left: -16, bottom: 0 }}
            >
              <defs>
                <linearGradient id={tabConfig.gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={tabConfig.color} stopOpacity={0.45} />
                  <stop offset="60%" stopColor={tabConfig.color} stopOpacity={0.12} />
                  <stop offset="95%" stopColor={tabConfig.color} stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="stroke-border/40"
              />

              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground, #888)", fontFamily: "monospace" }}
                dy={6}
              />

              <YAxis
                domain={yAxisDomain}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "var(--muted-foreground, #888)", fontFamily: "monospace" }}
                width={36}
                allowDecimals={false}
              />

              <Tooltip
                cursor={{
                  stroke: tabConfig.color,
                  strokeWidth: 1.5,
                  strokeDasharray: "4 4",
                  strokeOpacity: 0.7,
                }}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0].payload as MonthlyPointRecord;
                  const currentVal = Number(payload[0].value || 0);

                  return (
                    <div className="rounded-xl border border-border bg-popover/95 backdrop-blur-md p-3 shadow-xl text-xs space-y-2 min-w-[160px]">
                      <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                        <span className="font-bold text-foreground font-mono">{item.month} Performance</span>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono px-1.5 py-0"
                          style={{ borderColor: tabConfig.color, color: tabConfig.color }}
                        >
                          +{currentVal} pts
                        </Badge>
                      </div>

                      <div className="space-y-1 font-mono text-[11px]">
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Attendance
                          </span>
                          <span className="font-semibold text-foreground">{item.attendance} pts</span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-violet-500" />
                            Tasks
                          </span>
                          <span className="font-semibold text-foreground">{item.tasks} pts</span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-sky-500" />
                            Quizzes
                          </span>
                          <span className="font-semibold text-foreground">{item.quizzes} pts</span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            Events
                          </span>
                          <span className="font-semibold text-foreground">{item.events} pts</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />

              <Area
                type="monotone"
                dataKey={tabConfig.dataKey}
                stroke={tabConfig.color}
                strokeWidth={3}
                fill={`url(#${tabConfig.gradientId})`}
                dot={{
                  r: 3.5,
                  fill: tabConfig.color,
                  stroke: "var(--card, #18181b)",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: tabConfig.color,
                  stroke: "#ffffff",
                  strokeWidth: 2.5,
                }}
                animationDuration={600}
              />
            </AreaChart>
          ) : (
            <BarChart
              data={chartData}
              margin={{ top: 15, right: 12, left: -16, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="stroke-border/40"
              />

              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground, #888)", fontFamily: "monospace" }}
                dy={6}
              />

              <YAxis
                domain={yAxisDomain}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "var(--muted-foreground, #888)", fontFamily: "monospace" }}
                width={36}
                allowDecimals={false}
              />

              <Tooltip
                cursor={{ fill: "currentColor", opacity: 0.05 }}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0].payload as MonthlyPointRecord;
                  const currentVal = Number(payload[0].value || 0);

                  return (
                    <div className="rounded-xl border border-border bg-popover/95 backdrop-blur-md p-3 shadow-xl text-xs space-y-2 min-w-[160px]">
                      <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                        <span className="font-bold text-foreground font-mono">{item.month}</span>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono px-1.5 py-0"
                          style={{ borderColor: tabConfig.color, color: tabConfig.color }}
                        >
                          +{currentVal} pts
                        </Badge>
                      </div>

                      <div className="space-y-1 font-mono text-[11px]">
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Attendance:</span>
                          <span className="font-semibold text-foreground">{item.attendance} pts</span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Tasks:</span>
                          <span className="font-semibold text-foreground">{item.tasks} pts</span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Quizzes:</span>
                          <span className="font-semibold text-foreground">{item.quizzes} pts</span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Events:</span>
                          <span className="font-semibold text-foreground">{item.events} pts</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />

              <Bar
                dataKey={tabConfig.dataKey}
                fill={tabConfig.color}
                radius={[6, 6, 0, 0]}
                maxBarSize={38}
                animationDuration={600}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* ── Metric Footnotes / Sub-indicators ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-border/40 text-center font-mono">
        <div className="p-2 rounded-xl bg-muted/20 border border-border/40">
          <p className="text-[10px] text-muted-foreground uppercase">Attendance</p>
          <p className="text-xs font-bold text-foreground mt-0.5">
            {stats.attendancePoints} <span className="text-[9px] font-normal text-muted-foreground">PTS</span>
          </p>
        </div>
        <div className="p-2 rounded-xl bg-muted/20 border border-border/40">
          <p className="text-[10px] text-muted-foreground uppercase">Tasks</p>
          <p className="text-xs font-bold text-foreground mt-0.5">
            {stats.taskPoints} <span className="text-[9px] font-normal text-muted-foreground">PTS</span>
          </p>
        </div>
        <div className="p-2 rounded-xl bg-muted/20 border border-border/40">
          <p className="text-[10px] text-muted-foreground uppercase">Quizzes</p>
          <p className="text-xs font-bold text-foreground mt-0.5">
            {stats.quizPoints} <span className="text-[9px] font-normal text-muted-foreground">PTS</span>
          </p>
        </div>
        <div className="p-2 rounded-xl bg-muted/20 border border-border/40">
          <p className="text-[10px] text-muted-foreground uppercase">Events</p>
          <p className="text-xs font-bold text-foreground mt-0.5">
            {eventPts} <span className="text-[9px] font-normal text-muted-foreground">PTS</span>
          </p>
        </div>
      </div>
    </Card>
  );
}
