"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import QRCode from "qrcode";

interface MemberQRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: {
    name: string;
    cbUserId: string | null;
    email: string;
  };
}

export default function MemberQRDialog({
  open,
  onOpenChange,
  member,
}: MemberQRDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const profileUrl = `${window.location.origin}/member/${encodeURIComponent(member.cbUserId || member.email)}`;

  const generateQR = useCallback(async () => {
    if (!canvasRef.current || !open) return;

    setIsGenerating(true);
    try {
      const qrWidth = typeof window !== "undefined" && window.innerWidth < 640 ? 210 : 260;
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
  }, [profileUrl, open]);

  useEffect(() => {
    if (open) {
      // Small delay to ensure canvas is mounted
      const timer = setTimeout(generateQR, 50);
      return () => clearTimeout(timer);
    }
  }, [open, generateQR]);

  const handleDownload = () => {
    if (!canvasRef.current) return;

    // Create a new canvas with member name label
    const originalCanvas = canvasRef.current;
    const downloadCanvas = document.createElement("canvas");
    const ctx = downloadCanvas.getContext("2d");
    if (!ctx) return;

    const padding = 32;
    const labelHeight = 56;
    const idHeight = 28;
    const totalWidth = originalCanvas.width + padding * 2;
    const totalHeight = originalCanvas.height + padding * 2 + labelHeight + idHeight;

    downloadCanvas.width = totalWidth;
    downloadCanvas.height = totalHeight;

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    // Member name at top
    ctx.fillStyle = "#000000";
    ctx.font = "bold 18px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(member.name, totalWidth / 2, padding + 24);

    // CB User ID
    ctx.fillStyle = "#666666";
    ctx.font = "14px monospace";
    ctx.fillText(
      member.cbUserId || "",
      totalWidth / 2,
      padding + 48
    );

    // QR code
    ctx.drawImage(
      originalCanvas,
      padding,
      padding + labelHeight + idHeight
    );

    // Download
    const link = document.createElement("a");
    const filename = `${(member.cbUserId || member.name).replace(/\s+/g, "_")}_QR.png`;
    link.download = filename;
    link.href = downloadCanvas.toDataURL("image/png");
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">{member.name}</DialogTitle>
          <DialogDescription className="text-center">
            {member.cbUserId && (
              <span className="font-mono text-xs">{member.cbUserId}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          {isGenerating && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          <div className="rounded-lg border p-3 bg-white">
            <canvas ref={canvasRef} className={isGenerating ? "hidden" : ""} />
          </div>

          <p className="text-xs text-muted-foreground text-center max-w-[260px]">
            Scan this QR code to view the member&apos;s public profile or use it for attendance verification.
          </p>

          <Button
            variant="outline"
            onClick={handleDownload}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Download QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
