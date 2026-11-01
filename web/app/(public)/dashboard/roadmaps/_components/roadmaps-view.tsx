/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RoadmapData, UserProgressData } from "@/lib/roadmaps/types";
import {
  Compass,
  ArrowRight,
  LayoutGrid,
  List,
  Search,
  X,
  Sparkles,
  CheckCircle2,
  Clock,
  BookOpen,
  Layout,
  Server,
  Cloud,
  Binary,
  BrainCircuit,
  ShieldAlert,
  Code2,
  Cpu,
  Globe,
  Smartphone,
  Box,
  Palette,
  Gamepad2,
  Bot,
  Layers,
  Filter,
  CircleDot,
} from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ICON_MAP: Record<string, any> = {
  Layout,
  Server,
  Cloud,
  Binary,
  BrainCircuit,
  ShieldAlert,
  Compass,
  Code2,
  Cpu,
  Layers,
  Globe,
  Smartphone,
  Box,
  Palette,
  Gamepad2,
  Bot,
};

export type RoadmapWithProgress = RoadmapData & {
  userProgress?: UserProgressData;
};

interface RoadmapsViewProps {
  roadmaps: RoadmapWithProgress[];
}

export function RoadmapsView({ roadmaps }: RoadmapsViewProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "in-progress" | "completed" | "not-started">("all");

  // Load saved preference from localStorage safely on mount
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem("cb_roadmaps_view_mode") as "grid" | "list" | null;
      if (savedMode === "grid" || savedMode === "list") {
        setViewMode(savedMode);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode);
    try {
      localStorage.setItem("cb_roadmaps_view_mode", mode);
    } catch {
      // Ignore localStorage errors
    }
  };

  // Derive unique categories from roadmaps with counts
  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    roadmaps.forEach((r) => {
      if (r.category) {
        counts[r.category] = (counts[r.category] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [roadmaps]);

  // Filter roadmaps by search query, category, and completion status
  const filteredRoadmaps = useMemo(() => {
    return roadmaps.filter((r) => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = r.title.toLowerCase().includes(q);
        const matchesDesc = r.description.toLowerCase().includes(q);
        const matchesCategory = r.category?.toLowerCase().includes(q);
        const matchesBadge = r.badgeText?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesCategory && !matchesBadge) {
          return false;
        }
      }

      // 2. Category Filter
      if (selectedCategory !== "all" && r.category !== selectedCategory) {
        return false;
      }

      // 3. Status Filter
      if (selectedStatus !== "all") {
        const pct = r.userProgress?.percentage || 0;
        if (selectedStatus === "completed" && pct !== 100) return false;
        if (selectedStatus === "in-progress" && (pct === 0 || pct === 100)) return false;
        if (selectedStatus === "not-started" && pct > 0) return false;
      }

      return true;
    });
  }, [roadmaps, searchQuery, selectedCategory, selectedStatus]);

  const hasActiveFilters = searchQuery !== "" || selectedCategory !== "all" || selectedStatus !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedStatus("all");
  };

  return (
    <div className="space-y-6">
      {/* ── Toolbar: Search, Filter Dropdowns & View Switcher ── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card/60 p-3 sm:p-4 rounded-2xl border border-border/60 backdrop-blur-xs shadow-xs">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-3xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search tracks, topics, or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9.5 pr-8 h-9.5 bg-background/80 text-xs sm:text-sm rounded-xl border-border/60 focus-visible:ring-primary/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns and View Switcher */}
        <div className="flex items-center flex-wrap gap-2.5 justify-between lg:justify-end">
          {/* Category Dropdown */}
          <div className="flex-1 sm:flex-initial min-w-[180px] sm:w-[170px]">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-9.5 w-full text-xs sm:text-sm rounded-xl bg-background/80 border-border/60 focus-visible:ring-primary/20">
                <div className="flex items-center gap-2 truncate">
                  <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="All Categories" />
                </div>
              </SelectTrigger>
              <SelectContent align="end" className="rounded-xl border-border/60">
                <SelectItem value="all" className="text-xs sm:text-sm font-medium">
                  All Categories ({roadmaps.length})
                </SelectItem>
                {categories.map(({ name, count }) => (
                  <SelectItem key={name} value={name} className="text-xs sm:text-sm capitalize">
                    {name.replace(/-/g, " ")} ({count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Dropdown */}
          <div className="flex-1 sm:flex-initial min-w-[190px] sm:w-[160px]">
            <Select value={selectedStatus} onValueChange={(val: any) => setSelectedStatus(val)}>
              <SelectTrigger className="h-9.5 w-full text-xs sm:text-sm rounded-xl bg-background/80 border-border/60 focus-visible:ring-primary/20">
                <div className="flex items-center gap-2 truncate">
                  <CircleDot className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="All Status" />
                </div>
              </SelectTrigger>
              <SelectContent align="end" className="rounded-xl border-border/60">
                <SelectItem value="all" className="text-xs sm:text-sm font-medium">
                  All Progress Status
                </SelectItem>
                <SelectItem value="in-progress" className="text-xs sm:text-sm">
                  In Progress
                </SelectItem>
                <SelectItem value="completed" className="text-xs sm:text-sm">
                  Completed
                </SelectItem>
                <SelectItem value="not-started" className="text-xs sm:text-sm">
                  Not Started
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grid / List View Toggle */}
          <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/50 shrink-0">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleViewModeChange("grid")}
              className={`h-7.5 px-2.5 rounded-lg text-xs gap-1.5 transition-all ${
                viewMode === "grid"
                  ? "bg-background text-foreground shadow-xs font-semibold hover:bg-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleViewModeChange("list")}
              className={`h-7.5 px-2.5 rounded-lg text-xs gap-1.5 transition-all ${
                viewMode === "list"
                  ? "bg-background text-foreground shadow-xs font-semibold hover:bg-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Subtitle & Results Counter ── */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold text-foreground">
            Explore Learning Tracks
          </h2>
          <Badge variant="outline" className="text-[11px] font-semibold bg-muted/40">
            {filteredRoadmaps.length} {filteredRoadmaps.length === 1 ? "track" : "tracks"}
          </Badge>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-7 text-xs text-muted-foreground hover:text-destructive gap-1 px-2"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset filters</span>
          </Button>
        )}
      </div>

      {/* ── Empty State ── */}
      {filteredRoadmaps.length === 0 && (
        <Card className="border-dashed border-border/80 bg-card/40 p-10 text-center flex flex-col items-center justify-center rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-muted/80 flex items-center justify-center text-muted-foreground mb-3">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">No roadmaps found</h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mt-1 mb-4">
            No developer tracks match your current search or filter criteria. Try adjusting your search term or clearing the active filters.
          </p>
          <Button size="sm" variant="outline" onClick={clearFilters} className="text-xs gap-1.5">
            <X className="w-3.5 h-3.5" />
            <span>Clear all filters</span>
          </Button>
        </Card>
      )}

      {/* ── GRID VIEW ── */}
      {viewMode === "grid" && filteredRoadmaps.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
          {filteredRoadmaps.map((r) => {
            const IconComponent = (r.iconName && ICON_MAP[r.iconName]) || Compass;
            const progressPct = r.userProgress?.percentage || 0;
            const completedCount = r.userProgress?.completedNodeIds?.length || 0;
            const totalNodesCount = r.nodes.length;
            const totalHours = r.nodes.reduce(
              (acc, curr) => acc + (curr.data?.estimatedHours || 4),
              0
            );

            return (
              <Card
                key={r.id}
                className="group relative border-border/60 hover:border-primary/50 transition-all duration-300 shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden bg-card/90 hover:-translate-y-0.5 rounded-2xl"
              >
                {/* Glow accent highlight on hover */}
                <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary/0 via-primary/60 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Header with Icon and Badge */}
                <div className="p-5 pb-3 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 group-hover:scale-105 group-hover:bg-primary/15 transition-all">
                      <IconComponent className="w-6 h-6" />
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {r.category && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] uppercase tracking-wider font-semibold bg-muted/60"
                        >
                          {r.category.replace(/-/g, " ")}
                        </Badge>
                      )}
                      {r.badgeText && (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-semibold bg-primary/5 text-primary border-primary/25"
                        >
                          {r.badgeText}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {r.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                      {r.description}
                    </p>
                  </div>
                </div>

                {/* Footer with Progress & Action */}
                <div className="p-5 pt-0 space-y-3.5">
                  {/* Progress Meter Box */}
                  <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/40">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                        {progressPct === 100 ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <BookOpen className="w-3.5 h-3.5" />
                        )}
                        <span>{progressPct === 100 ? "Track Completed" : "Your Progress"}</span>
                      </div>
                      <span
                        className={`font-bold ${
                          progressPct === 100 ? "text-emerald-500" : "text-foreground"
                        }`}
                      >
                        {progressPct}%
                      </span>
                    </div>

                    <Progress
                      value={progressPct}
                      className="h-1.5"
                    />

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                      <span className="font-medium">
                        {completedCount} / {totalNodesCount} topics mastered
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span>~{totalHours}h</span>
                      </span>
                    </div>
                  </div>

                  <Button size="sm" asChild className="w-full h-9 text-xs font-semibold gap-1.5 rounded-xl shadow-xs">
                    <Link href={`/dashboard/roadmaps/${r.slug}`}>
                      <span>
                        {progressPct > 0 && progressPct < 100
                          ? "Continue Learning"
                          : progressPct === 100
                          ? "Review Curriculum"
                          : "Open Interactive Canvas"}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {viewMode === "list" && filteredRoadmaps.length > 0 && (
        <div className="flex flex-col gap-3">
          {filteredRoadmaps.map((r) => {
            const IconComponent = (r.iconName && ICON_MAP[r.iconName]) || Compass;
            const progressPct = r.userProgress?.percentage || 0;
            const completedCount = r.userProgress?.completedNodeIds?.length || 0;
            const totalNodesCount = r.nodes.length;
            const totalHours = r.nodes.reduce(
              (acc, curr) => acc + (curr.data?.estimatedHours || 4),
              0
            );

            return (
              <Card
                key={r.id}
                className="group relative border-border/60 hover:border-primary/50 transition-all duration-200 shadow-xs hover:shadow-md bg-card/90 overflow-hidden rounded-2xl"
              >
                {/* Active Indicator Bar on Left */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 ${
                    progressPct === 100
                      ? "bg-emerald-500"
                      : progressPct > 0
                      ? "bg-primary"
                      : "bg-transparent group-hover:bg-primary/40"
                  } transition-colors`}
                />

                <CardContent className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Icon + Title + Description */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 shrink-0 group-hover:scale-105 group-hover:bg-primary/15 transition-all">
                      <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors">
                          {r.title}
                        </h3>
                        {r.category && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] uppercase tracking-wider font-semibold bg-muted/60"
                          >
                            {r.category.replace(/-/g, " ")}
                          </Badge>
                        )}
                        {r.badgeText && (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-semibold bg-primary/5 text-primary border-primary/25"
                          >
                            {r.badgeText}
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed max-w-2xl">
                        {r.description}
                      </p>
                    </div>
                  </div>

                  {/* Middle Column: Progress Info */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between sm:justify-start gap-2 sm:gap-4 lg:gap-1.5 w-full lg:w-64 shrink-0 bg-muted/30 p-3 rounded-xl border border-border/40">
                    <div className="flex items-center justify-between w-full text-[11px]">
                      <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                        {progressPct === 100 ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-primary" />
                        )}
                        <span>{completedCount} / {totalNodesCount} topics</span>
                      </span>
                      <span
                        className={`font-bold ${
                          progressPct === 100 ? "text-emerald-500" : "text-foreground"
                        }`}
                      >
                        {progressPct}%
                      </span>
                    </div>

                    <Progress value={progressPct} className="h-1.5 w-full" />

                    <div className="flex items-center justify-between w-full text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span>~{totalHours} hrs estimated</span>
                      </span>
                      <span>{r.nodes.filter(n => n.type === "topic").length} core milestones</span>
                    </div>
                  </div>

                  {/* Right Column: CTA Button */}
                  <div className="shrink-0 flex items-center justify-end w-full lg:w-auto">
                    <Button
                      size="sm"
                      asChild
                      className="w-full sm:w-auto h-9 text-xs font-semibold gap-1.5 rounded-xl shadow-xs px-4"
                    >
                      <Link href={`/dashboard/roadmaps/${r.slug}`}>
                        <span>
                          {progressPct > 0 && progressPct < 100
                            ? "Continue"
                            : progressPct === 100
                            ? "Review"
                            : "Open Canvas"}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
