"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
  QrCode,
  ArrowRight,
  Loader2,
  Shield,
  Smartphone,
  Users,
} from "lucide-react";

export default function AttendanceScanLandingPage() {
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedCode = code.trim().toUpperCase();

    if (!normalizedCode) {
      toast.error("Please enter an attendance code");
      return;
    }

    if (normalizedCode.length < 4) {
      toast.error("Code must be at least 4 characters");
      return;
    }

    setIsValidating(true);
    try {
      const res = await fetch("/api/attendance/validate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalizedCode }),
      });
      const data = await res.json();

      if (data.valid) {
        toast.success(
          `Valid! Session #${data.sessionNumber}: ${data.sessionTitle}`
        );
        router.push(`/attendance/scan/${normalizedCode}`);
      } else {
        toast.error(data.error || "Invalid code");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {/* Header */}
      <header className="w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center gap-3 px-4 py-3">
          <Image
            src="/assets/logo.png"
            alt="CodeBreakers Logo"
            width={36}
            height={36}
            className="rounded-lg"
          />
          <div>
            <h1 className="text-base font-bold tracking-tight">
              CodeBreakers
            </h1>
            <p className="text-[10px] text-muted-foreground -mt-0.5">
              Attendance Scanner
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Code Entry Card */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-3">
                <QrCode className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-xl">
                Enter Attendance Code
              </CardTitle>
              <CardDescription className="text-sm">
                Enter the code shared by your admin to start scanning student QR
                codes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  placeholder="Enter code (e.g. AB3K7X)"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="text-center text-sm font-mono font-bold tracking-[0.3em] h-14 uppercase"
                  maxLength={6}
                  autoFocus
                  disabled={isValidating}
                />
                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  disabled={isValidating || !code.trim()}
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      Start Scanning
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Info Section */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg border bg-card/50">
              <Shield className="h-5 w-5 mx-auto text-primary mb-1.5" />
              <p className="text-[10px] text-muted-foreground font-medium">
                Admin Authorized
              </p>
            </div>
            <div className="text-center p-3 rounded-lg border bg-card/50">
              <Smartphone className="h-5 w-5 mx-auto text-primary mb-1.5" />
              <p className="text-[10px] text-muted-foreground font-medium">
                Mobile Friendly
              </p>
            </div>
            <div className="text-center p-3 rounded-lg border bg-card/50">
              <Users className="h-5 w-5 mx-auto text-primary mb-1.5" />
              <p className="text-[10px] text-muted-foreground font-medium">
                Real-time Sync
              </p>
            </div>
          </div>

          <p className="text-center text-[11px] text-muted-foreground px-4">
            This page allows authorized team members to scan student QR codes
            for attendance. All scans sync across all devices in real-time.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-3 text-center">
        <p className="text-[10px] text-muted-foreground">
          © {new Date().getFullYear()} CodeBreakers GCEK. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
