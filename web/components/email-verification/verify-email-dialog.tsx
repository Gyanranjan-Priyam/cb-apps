"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { toast } from "sonner";
import { Loader2, Mail, RefreshCw, CheckCircle2 } from "lucide-react";
import {
  requestEmailChangeOTP,
  verifyEmailChangeOTP,
} from "@/lib/email-change-service";

interface VerifyEmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pendingEmail: string;
  onSuccess: (newEmail: string) => void;
}

export function VerifyEmailDialog({
  isOpen,
  onClose,
  pendingEmail,
  onSuccess,
}: VerifyEmailDialogProps) {
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // Timer countdown for resending OTP
  useEffect(() => {
    if (!isOpen) {
      setOtp("");
      setCountdown(60);
      return;
    }

    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, countdown]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter the complete 6-digit verification code");
      return;
    }

    setIsVerifying(true);
    try {
      const result = await verifyEmailChangeOTP(pendingEmail, otp);

      if (result.status === "success") {
        toast.success(result.message);
        onSuccess(result.newEmail || pendingEmail);
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to verify code. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;

    setIsResending(true);
    try {
      const result = await requestEmailChangeOTP(pendingEmail);

      if (result.status === "success") {
        toast.success(`Verification code re-sent to ${pendingEmail}`);
        setCountdown(60);
        setOtp("");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isVerifying) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md w-[95vw] p-0 overflow-hidden border-border bg-background shadow-2xl rounded-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-foreground shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold tracking-tight">
                Verify New Email Address
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                We sent a 6-digit verification code to{" "}
                <span className="font-mono font-medium text-foreground">{pendingEmail}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* OTP Input */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <label className="text-xs font-medium text-muted-foreground">
              Enter 6-digit verification code
            </label>
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
              disabled={isVerifying}
              autoFocus
            >
              <InputOTPGroup className="gap-1.5">
                <InputOTPSlot index={0} className="h-11 w-10 text-base" />
                <InputOTPSlot index={1} className="h-11 w-10 text-base" />
                <InputOTPSlot index={2} className="h-11 w-10 text-base" />
                <InputOTPSlot index={3} className="h-11 w-10 text-base" />
                <InputOTPSlot index={4} className="h-11 w-10 text-base" />
                <InputOTPSlot index={5} className="h-11 w-10 text-base" />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {/* Info note */}
          <div className="rounded-lg border border-border p-3 bg-muted/20 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Important</p>
            <p>
              Once verified, your account login email will be updated to this new address. Your old email will no longer work for logins.
            </p>
          </div>

          {/* Resend Action */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-muted-foreground">Didn&apos;t receive the code?</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResend}
              disabled={countdown > 0 || isResending || isVerifying}
              className="h-8 text-xs font-medium gap-1.5"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Sending...
                </>
              ) : countdown > 0 ? (
                <span className="text-muted-foreground">Resend code in {countdown}s</span>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  Resend Code
                </>
              )}
            </Button>
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-border flex items-center justify-end gap-2 bg-muted/10">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isVerifying}
            className="text-sm rounded-lg"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleVerify}
            disabled={otp.length !== 6 || isVerifying}
            className="text-sm rounded-lg min-w-[130px]"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                Verify & Update
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
