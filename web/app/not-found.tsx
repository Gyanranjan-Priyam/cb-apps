import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Compass,
  Home,
  LayoutDashboard,
  Terminal,
  ArrowLeft,
  Search,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 - Page Not Found | CodeBreakers",
  description: "The page you are looking for does not exist or has been moved.",
};

export default function NotFound() {
  return (
    <div className="relative min-h-[85vh] w-full flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* ── Ambient Background Glows ── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-xl w-full text-center space-y-8 relative z-10">
        {/* ── Status Badge ── */}
        <div className="flex justify-center">
          <Badge
            variant="outline"
            className="px-3 py-1.5 text-xs font-mono gap-2 bg-card/80 backdrop-blur-md border-primary/30 text-primary shadow-sm"
          >
            <Terminal className="w-3.5 h-3.5 text-primary" />
            <span>404 // NULL_REFERENCE_EXCEPTION</span>
          </Badge>
        </div>

        {/* ── Large 404 Heading ── */}
        <div className="space-y-2">
          <h1 className="text-7xl sm:text-9xl font-black tracking-tight text-transparent bg-clip-text bg-linear-to-b from-foreground via-foreground/90 to-muted-foreground/30 font-mono select-none">
            404
          </h1>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Page Not Found on Server
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            The page, roadmap, or resource you are seeking does not exist, has been moved, or is under development by the CodeBreakers team.
          </p>
        </div>

        {/* ── Terminal Snippet ── */}
        <div className="bg-card/60 backdrop-blur-md border border-border/80 rounded-2xl p-4 text-left shadow-lg font-mono text-xs text-muted-foreground max-w-md mx-auto space-y-1.5">
          <div className="flex items-center gap-1.5 pb-2 border-b border-border/40">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            <span className="text-[10px] text-muted-foreground/60 ml-2">bash ~ codebreakers-runtime</span>
          </div>
          <p className="text-primary pt-1">$ curl -I https://codebreakersgcek.tech/path</p>
          <p className="text-rose-500 font-semibold">&gt; HTTP/2 404 Not Found</p>
          <p className="text-muted-foreground/80">&gt; Status: Resource not located in route registry.</p>
        </div>

        {/* ── Navigation Actions ── */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button asChild size="default" className="gap-2 shadow-md">
            <Link href="/dashboard">
              <LayoutDashboard className="w-4 h-4" />
              <span>Go to Dashboard</span>
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
