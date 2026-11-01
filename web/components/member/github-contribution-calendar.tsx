"use client";

import { useEffect, useState } from "react";
import { GitHubCalendar } from "react-github-calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExternalLink, Github, AlertCircle, CalendarDays } from "lucide-react";
import type { ThemeInput } from "react-activity-calendar";

interface GitHubContributionCalendarProps {
  username: string;
  className?: string;
  showCardWrapper?: boolean;
  variant?: "default" | "neo-brutalist";
}

// Exact GitHub Dark Mode palette
const GITHUB_DARK_COLORS = [
  "#161b22", // 0 contributions (empty dark square)
  "#0e4429", // 1-3 contributions
  "#006d32", // 4-6 contributions
  "#26a641", // 7-9 contributions
  "#39d353", // 10+ contributions
];

// Exact GitHub Light Mode palette
const GITHUB_LIGHT_COLORS = [
  "#ebedf0", // 0 contributions (empty light square)
  "#9be9a8", // 1-3 contributions
  "#40c463", // 4-6 contributions
  "#30a14e", // 7-9 contributions
  "#216e39", // 10+ contributions
];

// High-impact Neo-Brutalism Light palette (Paper cream -> Sky -> Mint -> Cyber Yellow -> Punch Red)
const NEO_BRUTALIST_LIGHT_COLORS = [
  "#F3F0E6", // 0 contributions (Warm newsprint cream)
  "#BAE6FD", // 1-3 contributions (Pastel Sky)
  "#6EE7B7", // 4-6 contributions (Electric Mint)
  "#FFD93D", // 7-9 contributions (Vivid Cyber Yellow)
  "#FF6B6B", // 10+ contributions (Hot Crimson Red)
];

// Neo-Brutalism Dark palette
const NEO_BRUTALIST_DARK_COLORS = [
  "#262626", // 0 contributions (Dark slate block)
  "#818CF8", // 1-3 contributions (Electric Indigo)
  "#34D399", // 4-6 contributions (Electric Mint)
  "#FBBF24", // 7-9 contributions (Amber Yellow)
  "#F87171", // 10+ contributions (Electric Coral Red)
];

const GITHUB_DARK_THEME: ThemeInput = {
  dark: GITHUB_DARK_COLORS,
  light: GITHUB_DARK_COLORS,
};

const GITHUB_LIGHT_THEME: ThemeInput = {
  dark: GITHUB_LIGHT_COLORS,
  light: GITHUB_LIGHT_COLORS,
};

const NEO_BRUTALIST_THEME: ThemeInput = {
  dark: NEO_BRUTALIST_DARK_COLORS,
  light: NEO_BRUTALIST_LIGHT_COLORS,
};

export default function GitHubContributionCalendar({
  username,
  className = "",
  showCardWrapper = true,
  variant = "default",
}: GitHubContributionCalendarProps) {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("last");

  const isNeo = variant === "neo-brutalist";

  useEffect(() => {
    setMounted(true);
    setHasError(false);

    // Reactive theme detector listening to documentElement class changes
    const detectTheme = () => {
      const isDarkMode = document.documentElement.classList.contains("dark");
      setIsDark(isDarkMode);
    };

    detectTheme();

    const observer = new MutationObserver(() => {
      detectTheme();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [username]);

  const cleanUsername = username.trim().replace(/^@/, "");

  if (!cleanUsername) return null;

  // Generate list of available years for dropdown (current year down to 2020)
  const currentYear = new Date().getFullYear();
  const availableYears = [
    { label: "Last 12 Months", value: "last" },
    ...Array.from({ length: currentYear - 2019 }, (_, i) => {
      const yr = String(currentYear - i);
      return { label: yr, value: yr };
    }),
  ];

  const currentTheme = isNeo
    ? NEO_BRUTALIST_THEME
    : isDark
    ? GITHUB_DARK_THEME
    : GITHUB_LIGHT_THEME;

  const yearProp = selectedYear === "last" ? "last" : parseInt(selectedYear, 10);

  const content = (
    <div className="space-y-4">
      {/* Global CSS for scrollbar suppression and tooltip styling */}
      <style jsx global>{`
        .github-calendar-scroll-wrapper,
        .github-calendar-scroll-wrapper .react-activity-calendar,
        .github-calendar-scroll-wrapper .react-activity-calendar__container,
        .github-calendar-scroll-wrapper .react-activity-calendar__scroll-container,
        .github-calendar-scroll-wrapper * {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        .github-calendar-scroll-wrapper::-webkit-scrollbar,
        .github-calendar-scroll-wrapper .react-activity-calendar::-webkit-scrollbar,
        .github-calendar-scroll-wrapper .react-activity-calendar__scroll-container::-webkit-scrollbar,
        .github-calendar-scroll-wrapper *::-webkit-scrollbar {
          display: none !important;
          width: 0px !important;
          height: 0px !important;
          background: transparent !important;
        }

        /* Default Tooltip */
        .react-activity-calendar__tooltip {
          background-color: #1f2328 !important;
          color: #ffffff !important;
          font-size: 11px !important;
          font-family: inherit !important;
          font-weight: 500 !important;
          padding: 5px 10px !important;
          border-radius: 6px !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3) !important;
          pointer-events: none !important;
          z-index: 9999 !important;
        }
        .react-activity-calendar__tooltip-arrow {
          fill: #1f2328 !important;
        }

        /* Neo-Brutalist Calendar & Tooltip Overrides */
        .neo-calendar-container .react-activity-calendar__tooltip {
          background-color: #FFFDF5 !important;
          color: #000000 !important;
          font-size: 11px !important;
          font-family: var(--font-space-grotesk), monospace, sans-serif !important;
          font-weight: 800 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          padding: 6px 12px !important;
          border-radius: 0px !important;
          border: 2.5px solid #000000 !important;
          box-shadow: 4px 4px 0px 0px #000000 !important;
          pointer-events: none !important;
          z-index: 9999 !important;
        }
        .neo-calendar-container .react-activity-calendar__tooltip-arrow {
          fill: #000000 !important;
        }
        .neo-calendar-container text {
          font-family: var(--font-space-grotesk), monospace, sans-serif !important;
          font-weight: 800 !important;
          font-size: 10px !important;
          fill: #000000 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.04em !important;
        }
        .neo-calendar-container .react-activity-calendar__legend-colors {
          border: 1.5px solid #000000 !important;
          padding: 2px !important;
          background: #ffffff !important;
          box-shadow: 2px 2px 0px 0px #000000 !important;
        }
        .neo-calendar-container rect {
          stroke: #000000;
          stroke-width: 0.8px;
          rx: 0px;
        }

        /* Neo-Brutalist Select Dropdown Overrides (Fixes light-on-light text bug) */
        .neo-calendar-select-content,
        .neo-calendar-select-content * {
          color: #000000 !important;
        }
        .neo-calendar-select-content [data-slot="select-item"] {
          color: #000000 !important;
          font-family: var(--font-space-grotesk), monospace, sans-serif !important;
          font-weight: 800 !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
        }
        .neo-calendar-select-content [data-slot="select-item"]:hover,
        .neo-calendar-select-content [data-slot="select-item"]:focus,
        .neo-calendar-select-content [data-slot="select-item"][data-state="checked"] {
          background-color: #FFD93D !important;
          color: #000000 !important;
        }
        .neo-calendar-select-content [data-slot="select-item"] svg {
          color: #000000 !important;
          stroke-width: 3px !important;
        }
        .neo-calendar-select-trigger,
        .neo-calendar-select-trigger * {
          color: #000000 !important;
        }
        .neo-calendar-select-trigger svg {
          color: #000000 !important;
          opacity: 1 !important;
        }
      `}</style>

      {/* Header with Title, Year Selector Dropdown & Profile Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={
              isNeo
                ? "p-2 bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_#000]"
                : "p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            }
          >
            <Github className="h-4 w-4 stroke-[2.5px]" />
          </div>
          <div>
            <h4
              className={
                isNeo
                  ? "font-neo font-black text-sm uppercase tracking-wider text-black flex items-center gap-1.5"
                  : "text-sm font-semibold flex items-center gap-1.5 text-foreground"
              }
            >
              GitHub Contributions

            </h4>
            <p
              className={
                isNeo
                  ? "font-mono text-xs font-bold text-zinc-700 uppercase tracking-wide"
                  : "text-xs text-muted-foreground"
              }
            >
              Public activity & commit history
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Year Selection Dropdown */}
          <Select value={selectedYear} onValueChange={(val) => setSelectedYear(val)}>
            <SelectTrigger
              className={
                isNeo
                  ? "neo-calendar-select-trigger h-8 text-xs w-auto min-w-[155px] rounded-none !bg-white !text-black font-neo font-bold border-2 border-black shadow-[2px_2px_0px_0px_#000] cursor-pointer hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all px-3 [&_svg]:!text-black [&_svg]:!opacity-100"
                  : "h-7 text-xs w-[130px] rounded-lg bg-background border-border/80 cursor-pointer"
              }
            >
              <CalendarDays className="h-3.5 w-3.5 mr-1 text-black shrink-0" />
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent
              align="end"
              className={
                isNeo
                  ? "neo-calendar-select-content border-3 border-black rounded-none shadow-[5px_5px_0px_0px_#000] !bg-[#FFFDF5] !text-black p-1.5 z-50 min-w-[160px]"
                  : ""
              }
            >
              {availableYears.map((yr) => (
                <SelectItem
                  key={yr.value}
                  value={yr.value}
                  className={
                    isNeo
                      ? "!text-black hover:!text-black focus:!text-black text-xs font-neo font-black uppercase tracking-wider cursor-pointer hover:!bg-[#FFD93D] focus:!bg-[#FFD93D] data-[state=checked]:!bg-[#FFD93D] data-[state=checked]:!text-black rounded-none my-0.5 px-3 py-2 border border-transparent hover:border-black focus:border-black"
                      : "text-xs cursor-pointer"
                  }
                >
                  {yr.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View GitHub Profile Link */}
          <Button
            variant={isNeo ? "default" : "outline"}
            size="sm"
            className={
              isNeo
                ? "h-8 text-xs gap-1.5 rounded-none bg-[#FFD93D] text-black font-neo font-black uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:bg-[#FFD93D] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                : "h-7 text-xs gap-1.5 rounded-lg border-border/80"
            }
            asChild
          >
            <a
              href={`https://github.com/${cleanUsername}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Profile</span>
              <ExternalLink className="h-3 w-3 stroke-[2.5px]" />
            </a>
          </Button>
        </div>
      </div>

      {/* Calendar Area with Interactive Tooltips */}
      <div
        className={`github-calendar-scroll-wrapper w-full overflow-x-auto py-2 flex justify-start lg:justify-center items-center min-h-[140px] ${
          isNeo ? "neo-calendar-container" : ""
        }`}
      >
        {!mounted ? (
          <div className="w-full space-y-2 py-4">
            <Skeleton
              className={
                isNeo
                  ? "h-28 w-full rounded-none border-2 border-black bg-zinc-200"
                  : "h-28 w-full rounded-lg"
              }
            />
          </div>
        ) : hasError ? (
          <div
            className={
              isNeo
                ? "flex items-center gap-2 text-xs font-mono font-bold text-black bg-[#FF6B6B]/15 border-2 border-black p-3"
                : "flex items-center gap-2 text-xs text-muted-foreground py-6"
            }
          >
            <AlertCircle className="h-4 w-4 text-[#FF6B6B] shrink-0" />
            <span>
              Could not load GitHub contributions for @{cleanUsername}. Profile may be private or username invalid.
            </span>
          </div>
        ) : (
          <div className="w-full flex justify-start lg:justify-center">
            <GitHubCalendar
              key={`${cleanUsername}-${selectedYear}-${isNeo ? "neo" : isDark ? "dark" : "light"}`}
              username={cleanUsername}
              year={yearProp}
              blockSize={isNeo ? 10.8 : 10.2}
              blockMargin={isNeo ? 2.8 : 2.4}
              blockRadius={isNeo ? 0 : 2}
              fontSize={isNeo ? 11 : 10.5}
              theme={currentTheme}
              colorScheme={isNeo ? "light" : isDark ? "dark" : "light"}
              showWeekdayLabels={["mon", "wed", "fri"]}
              labels={{
                totalCount:
                  selectedYear === "last"
                    ? "{{count}} contributions in the last year"
                    : `{{count}} contributions in ${selectedYear}`,
                legend: {
                  less: "Less",
                  more: "More",
                },
              }}
              tooltips={{
                activity: {
                  hoverRestMs: 40,
                  withArrow: true,
                  text: (activity) => {
                    const [year, month, day] = activity.date.split("-").map(Number);
                    const dateObj = new Date(year, month - 1, day);
                    const formattedDate = dateObj.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                    if (activity.count === 0) {
                      return `No contributions on ${formattedDate}`;
                    }
                    return `${activity.count} contribution${activity.count === 1 ? "" : "s"} on ${formattedDate}`;
                  },
                },
              }}
              throwOnError={false}
              errorMessage={`Could not load GitHub contributions for @${cleanUsername}`}
            />
          </div>
        )}
      </div>
    </div>
  );


  if (!showCardWrapper) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Card
      className={
        isNeo
          ? `border-4 border-black shadow-[8px_8px_0px_0px_#000] rounded-none bg-white ${className}`
          : className
      }
    >
      <CardContent className="pt-6">{content}</CardContent>
    </Card>
  );
}

