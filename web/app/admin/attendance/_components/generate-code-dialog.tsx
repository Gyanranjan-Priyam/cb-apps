"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Share2,
  Loader2,
  Copy,
  CheckCircle2,
  Trash2,
  Clock,
  QrCode,
  ExternalLink,
  RefreshCcw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AttendanceSession {
  id: string;
  sessionNumber: number;
  title: string;
}

interface ActiveCode {
  code: string;
  sessionId: string;
  sessionTitle: string;
  sessionNumber: number;
  createdByName: string;
  createdAt: string;
  expiresAt: string;
  active: boolean;
}

interface GenerateCodeDialogProps {
  sessions: AttendanceSession[];
  onCodeGenerated?: () => void;
}

export default function GenerateCodeDialog({
  sessions,
  onCodeGenerated,
}: GenerateCodeDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [activeCodes, setActiveCodes] = useState<ActiveCode[]>([]);
  const [isLoadingCodes, setIsLoadingCodes] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchActiveCodes = useCallback(async () => {
    setIsLoadingCodes(true);
    try {
      const res = await fetch("/api/admin/attendance/delegate-code");
      const data = await res.json();
      if (data.success) {
        setActiveCodes(data.codes);
      }
    } catch {
      console.error("Failed to fetch active codes");
    } finally {
      setIsLoadingCodes(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchActiveCodes();
      setGeneratedCode(null);
    }
  }, [open, fetchActiveCodes]);

  const handleGenerate = async () => {
    if (!selectedSession) {
      toast.error("Please select an attendance session");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/admin/attendance/delegate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: selectedSession }),
      });
      const data = await res.json();

      if (data.success) {
        setGeneratedCode(data.code);
        toast.success(`Code generated: ${data.code}`);
        fetchActiveCodes();
        onCodeGenerated?.();
      } else {
        toast.error(data.error || "Failed to generate code");
      }
    } catch {
      toast.error("Network error generating code");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevoke = async (code: string) => {
    try {
      const res = await fetch(
        `/api/admin/attendance/delegate-code?code=${code}`,
        { method: "DELETE" }
      );
      const data = await res.json();

      if (data.success) {
        toast.success(`Code ${code} revoked`);
        fetchActiveCodes();
        if (generatedCode === code) {
          setGeneratedCode(null);
        }
      } else {
        toast.error(data.error || "Failed to revoke code");
      }
    } catch {
      toast.error("Network error revoking code");
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(text);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const getScannerUrl = (code: string) => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/attendance/scan/${code}`;
  };

  const getTimeRemaining = (expiresAt: string) => {
    const expires = new Date(expiresAt);
    if (expires < new Date()) return "Expired";
    return formatDistanceToNow(expires, { addSuffix: false }) + " left";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Delegate Scanning
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Delegate Attendance Scanning
          </DialogTitle>
          <DialogDescription>
            Generate a code that allows team members to scan student QR codes on
            their own devices. All scans sync in real-time. Codes expire
            automatically after 2 hours.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Generate Section */}
          <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Generate New Code
            </label>
            <div className="flex gap-2">
              <Select
                value={selectedSession}
                onValueChange={setSelectedSession}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select session..." />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      #{s.sessionNumber}: {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !selectedSession}
                className="shrink-0"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Generate"
                )}
              </Button>
            </div>
          </div>

          {/* Newly Generated Code Display */}
          {generatedCode && (
            <div className="p-4 rounded-lg border-2 border-primary/40 bg-primary/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                  New Code Generated
                </span>
                <Badge variant="default" className="bg-green-600">
                  Active
                </Badge>
              </div>

              {/* Big code display */}
              <div className="flex items-center justify-center gap-3 py-3">
                <span className="text-3xl sm:text-4xl font-bold font-mono tracking-[0.3em] text-foreground select-all">
                  {generatedCode}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(generatedCode)}
                  className="shrink-0"
                >
                  {copiedCode === generatedCode ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </Button>
              </div>

              {/* Scanner link */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => copyToClipboard(getScannerUrl(generatedCode))}
                >
                  <Copy className="h-3 w-3 mr-1.5" />
                  Copy Scanner Link
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() =>
                    window.open(getScannerUrl(generatedCode), "_blank")
                  }
                >
                  <ExternalLink className="h-3 w-3 mr-1.5" />
                  Open
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground text-center">
                Share this code or the scanner link with team members. They can
                open it on their phones to start scanning.
              </p>
            </div>
          )}

          {/* Active Codes List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Active Codes ({activeCodes.length})
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchActiveCodes}
                disabled={isLoadingCodes}
                className="h-7"
              >
                <RefreshCcw
                  className={`h-3 w-3 mr-1 ${isLoadingCodes ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>

            {activeCodes.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-xs border rounded-lg">
                <QrCode className="h-8 w-8 mx-auto mb-2 opacity-40" />
                No active delegation codes. Generate one above to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {activeCodes.map((c) => (
                  <div
                    key={c.code}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-base tracking-widest">
                          {c.code}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(c.code)}
                        >
                          {copiedCode === c.code ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Session #{c.sessionNumber}: {c.sessionTitle}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{getTimeRemaining(c.expiresAt)}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => handleRevoke(c.code)}
                      title="Revoke this code"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
