"use client";

import { useCallback, useEffect, useRef, useState, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Loader2, QrCode, Copy, Check, ExternalLink } from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";
import Link from "next/link";

interface UserQRDialogProps {
  user: {
    name: string | null;
    cbUserId?: string | null;
    email: string;
    registration?: string | null;
    branch?: string | null;
    admissionYear?: string | number | null;
    role?: string | null;
    batch?: {
      name?: string | null;
      code?: string | null;
    } | null;
  };
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function UserQRDialog({
  user,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: UserQRDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled ? controlledOnOpenChange || (() => {}) : setInternalOpen;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const formatMemberId = (rawId?: string | null) => {
    if (!rawId) return "CB-MEMBER";
    const clean = rawId.trim();
    if (clean.toUpperCase().startsWith("CB-") || clean.toUpperCase().startsWith("GCEK-")) {
      return clean;
    }
    return `CB-${clean}`;
  };

  const identifier = user.cbUserId || user.registration || user.email;
  const profileUrl = typeof window !== "undefined"
    ? `${window.location.origin}/member/${encodeURIComponent(identifier)}`
    : `https://www.codebreakersgcek.tech/member/${encodeURIComponent(identifier)}`;

  const generateQR = useCallback(async () => {
    if (!canvasRef.current || !isOpen) return;

    setIsGenerating(true);
    try {
      const qrWidth = typeof window !== "undefined" && window.innerWidth < 640 ? 210 : 240;
      await QRCode.toCanvas(canvasRef.current, profileUrl, {
        errorCorrectionLevel: "H",
        width: qrWidth,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
    } catch (err) {
      console.error("Error generating QR code:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [profileUrl, isOpen]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(generateQR, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen, generateQR]);

  const handleDownload = () => {
    if (!canvasRef.current) return;

    const originalCanvas = canvasRef.current;
    const downloadCanvas = document.createElement("canvas");
    const ctx = downloadCanvas.getContext("2d");
    if (!ctx) return;

    const padding = 32;
    const headerHeight = 70;
    const footerHeight = 40;
    const totalWidth = originalCanvas.width + padding * 2;
    const totalHeight = originalCanvas.height + padding * 2 + headerHeight + footerHeight;

    downloadCanvas.width = totalWidth;
    downloadCanvas.height = totalHeight;

    // White Card Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    // Header branding
    ctx.fillStyle = "#09090b";
    ctx.font = "bold 18px monospace";
    ctx.textAlign = "center";
    ctx.fillText(user.name || "CodeBreakers Member", totalWidth / 2, padding + 22);

    // Member ID subheader
    ctx.fillStyle = "#71717a";
    ctx.font = "bold 13px monospace";
    ctx.fillText(
      formatMemberId(user.cbUserId || user.registration),
      totalWidth / 2,
      padding + 44
    );

    // Draw QR code
    ctx.drawImage(originalCanvas, padding, padding + headerHeight);

    // Footer note
    ctx.fillStyle = "#a1a1aa";
    ctx.font = "10px monospace";
    ctx.fillText("CodeBreakers Attendance & Profile Pass", totalWidth / 2, totalHeight - padding);

    // Trigger download
    const link = document.createElement("a");
    const filename = `${(user.cbUserId || user.name || "member").replace(/\s+/g, "_")}_Attendance_QR.png`;
    link.download = filename;
    link.href = downloadCanvas.toDataURL("image/png");
    link.click();
    toast.success("Attendance QR Code Downloaded! 📥");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast.success("Profile link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-xs sm:max-w-sm p-4 sm:p-6 max-h-[88dvh] overflow-y-auto overscroll-contain border border-border/80 bg-card rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-1 text-center">
          <div className="mx-auto p-2 w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-0.5">
            <QrCode className="w-5 h-5" />
          </div>
          <DialogTitle className="text-base sm:text-lg font-bold font-mono tracking-tight text-foreground text-center">
            {user.name || "Member QR"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-mono text-center">
            <span className="font-bold text-foreground">
              {formatMemberId(user.cbUserId || user.registration)}
            </span>
            {user.batch?.name ? ` • ${user.batch.name}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 py-1">
          {/* QR Canvas Frame */}
          <div className="p-2.5 sm:p-3 rounded-2xl border-2 border-border/80 bg-white shadow-inner flex items-center justify-center relative min-h-[190px] min-w-[190px] max-w-full">
            {isGenerating && (
              <div className="absolute inset-0 flex items-center justify-center bg-white rounded-2xl">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            <canvas ref={canvasRef} className={`rounded-lg ${isGenerating ? "opacity-0" : "opacity-100 transition-opacity"}`} />
          </div>

          <p className="text-[11px] text-muted-foreground font-mono text-center leading-relaxed max-w-[260px]">
            Scan with admin scanner for instant attendance verification (+10 PTS) or public profile view.
          </p>

          {/* Action Buttons */}
          <div className="w-full space-y-2 pt-1">
            <Button
              onClick={handleDownload}
              className="w-full h-9 font-mono text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl cursor-pointer gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download QR Pass</span>
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="h-8 font-mono text-[11px] rounded-xl gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy Link"}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-8 font-mono text-[11px] rounded-xl gap-1.5"
              >
                <Link href={`/member/${encodeURIComponent(identifier)}`} prefetch={true}>
                  <span>Profile</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
