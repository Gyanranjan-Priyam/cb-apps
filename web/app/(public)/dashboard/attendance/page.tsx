"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { QrCode, Download, Loader2, Sparkles, UserCheck } from "lucide-react";
import QRCode from "qrcode";
import AttendanceHistory from "./_components/attendance-history";
import { getUserProfileForAttendancePass } from "./actions";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  cbUserId?: string | null;
  registration?: string | null;
  rollNumber?: string | null;
  branch?: string | null;
  admissionYear?: string | number | null;
  role?: string | null;
  batch?: {
    name?: string | null;
    code?: string | null;
  } | null;
}

export default function AttendancePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      const res = await getUserProfileForAttendancePass();
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        toast.error("Failed to load user profile for attendance pass");
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  useEffect(() => {
    if (!user || !canvasRef.current) return;

    const identifier = user.cbUserId || user.registration || user.email;
    const profileUrl = typeof window !== "undefined"
      ? `${window.location.origin}/member/${encodeURIComponent(identifier)}`
      : `https://www.codebreakersgcek.tech/member/${encodeURIComponent(identifier)}`;

    setIsGenerating(true);
    QRCode.toCanvas(canvasRef.current, profileUrl, {
      errorCorrectionLevel: "H",
      width: 220,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })
      .catch((err) => console.error("Error generating QR code:", err))
      .finally(() => setIsGenerating(false));
  }, [user]);

  const handleDownloadQR = () => {
    if (!canvasRef.current || !user) return;
    const link = document.createElement("a");
    link.download = `${user.cbUserId || "student"}-attendance-qr.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
    toast.success("Attendance QR Pass downloaded");
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-8xl">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Attendance & Check-in</h1>
        <p className="text-sm text-muted-foreground">
          Show your personal QR Pass to the instructor to mark your attendance as present
        </p>
      </div>

      {/* Main Grid: QR Pass + Quick Guidance */}
      <div className="grid gap-6 md:grid-cols-12 items-start">
        {/* Left Column: Personal QR Pass Card */}
        <Card className="md:col-span-5 border-border shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-semibold">Student QR Pass</CardTitle>
              </div>
              <Badge variant="outline" className="font-mono text-[11px] bg-background">
                {user?.cbUserId || "CB-MEMBER"}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Present this QR to your instructor at the start of each session
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex flex-col items-center justify-center space-y-4">
            {loading ? (
              <div className="h-[220px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-border/80 flex items-center justify-center">
                  <canvas ref={canvasRef} className="rounded-xl" />
                </div>

                <div className="text-center space-y-1 w-full">
                  <h3 className="font-semibold text-foreground text-sm truncate">
                    {user?.name || "Student"}
                  </h3>
                  <div className="flex items-center justify-center gap-1.5 flex-wrap text-xs text-muted-foreground">
                    {user?.batch?.name && (
                      <span className="font-medium text-primary">{user.batch.name}</span>
                    )}
                    {user?.branch && <span>• {user.branch}</span>}
                    {user?.rollNumber && <span className="font-mono">({user.rollNumber})</span>}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadQR}
                  className="w-full text-xs gap-2 rounded-xl h-9"
                  disabled={isGenerating}
                >
                  <Download className="h-3.5 w-3.5" />
                  Save QR Pass
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Check-in Instructions */}
        <Card className="md:col-span-7 border-border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold">How Check-in Works</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Simple, instantaneous QR attendance verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                  1
                </div>
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground text-xs">Open your Student QR Pass</p>
                  <p className="text-[11px]">Keep this screen open or save your QR code image to your phone gallery.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                  2
                </div>
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground text-xs">Instructor Scans Your QR</p>
                  <p className="text-[11px]">The instructor will scan your QR code with their admin attendance scanner.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-xs">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground text-xs">Instant XP & Present Status</p>
                  <p className="text-[11px]">Your attendance is recorded in real time and attendance points are instantly credited.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Full Attendance History */}
      <AttendanceHistory />
    </div>
  );
}
