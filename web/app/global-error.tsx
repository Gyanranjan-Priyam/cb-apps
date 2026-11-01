"use client";

import { useEffect } from "react";
import "./globals.css";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[CodeBreakers Global Fatal Error]:", error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased font-sans flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center space-y-6 bg-card border border-border/80 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
            <span>FATAL_LAYOUT_CRASH</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              Critical System Error
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              A critical layout or network error interrupted the application lifecycle.
            </p>
          </div>

          {/* Error display */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 text-left font-mono text-xs text-muted-foreground space-y-1 overflow-x-auto">
            <p className="text-rose-400 font-semibold">{error.message || "Unknown root layout error"}</p>
            {error.digest && (
              <p className="text-[10px] text-muted-foreground/60">Digest ID: {error.digest}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:bg-primary/90 transition-all cursor-pointer"
            >
              Reload Application
            </button>

            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = "/";
                }
              }}
              className="px-5 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-medium text-xs border border-border/60 transition-all cursor-pointer"
            >
              Return to Homepage
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
