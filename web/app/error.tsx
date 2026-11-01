"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RotateCcw,
  LayoutDashboard,
  Home,
  AlertTriangle,
  Terminal,
  Bug,
} from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log exception to monitoring / telemetry
    console.error("[CodeBreakers Runtime Error]:", error);
  }, [error]);

  return (
    <div className="relative min-h-[85vh] w-full flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* ── Ambient Background Glows ── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/3 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-xl w-full text-center space-y-8 relative z-10">
        {/* ── Status Badge ── */}
        <div className="flex justify-center">
          <Badge
            variant="outline"
            className="px-3 py-1.5 text-xs font-mono gap-2 bg-card/80 backdrop-blur-md border-rose-500/30 text-rose-500 shadow-sm"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>500 // RUNTIME_EXECUTION_ERROR</span>
          </Badge>
        </div>

        {/* ── Heading ── */}
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Something Went Wrong
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            An unexpected error occurred while executing this operation. Our system has logged the diagnostic trace.
          </p>
        </div>

        {/* ── Error Diagnostic Terminal Box ── */}
        <div className="bg-card/60 backdrop-blur-md border border-rose-500/20 rounded-2xl p-4 text-left shadow-lg font-mono text-xs text-muted-foreground max-w-md mx-auto space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="text-[10px] text-muted-foreground/70 ml-2">stack trace</span>
            </div>
            {error.digest && (
              <span className="text-[9px] text-muted-foreground/60 font-mono">
                Digest: {error.digest.slice(0, 8)}...
              </span>
            )}
          </div>
          <div className="text-rose-400/90 font-medium break-words pt-1">
            {error.message || "An unhandled exception occurred during render."}
          </div>
          {error.digest && (
            <p className="text-[10px] text-muted-foreground/50 pt-1 border-t border-border/20">
              Error Digest ID: <code className="text-foreground/70">{error.digest}</code>
            </p>
          )}
        </div>

        {/* ── Navigation & Recovery Actions ── */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => reset()}
            size="default"
            className="gap-2 shadow-md bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </Button>

          <Button asChild variant="outline" size="default" className="gap-2 bg-card/80">
            <Link href="/dashboard">
              <LayoutDashboard className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
          </Button>

          <Button asChild variant="ghost" size="default" className="gap-2 text-muted-foreground hover:text-foreground">
            <Link href="/">
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
