"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShieldBan, ShieldCheck } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { blockUserFromQuiz, unblockUserFromQuiz, unblockUserFromSpecificQuiz } from "../actions";

interface BlockUserActionsProps {
  userId: string;
  userName: string;
  isBanned: boolean;
  quizId?: string; // Optional quiz ID for quiz-specific unblock
  onUpdate: () => void;
}

export function BlockUserActions({ userId, userName, isBanned, quizId, onUpdate }: BlockUserActionsProps) {
  const [reason, setReason] = useState("");
  const [banDays, setBanDays] = useState("7");
  const [isBlocking, setIsBlocking] = useState(false);
  const [isUnblocking, setIsUnblocking] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);

  const handleBlock = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for blocking");
      return;
    }

    setIsBlocking(true);
    try {
      const result = await blockUserFromQuiz(userId, reason, parseInt(banDays));
      
      if (result.status === "success") {
        toast.success(`${userName} has been blocked from quizzes`);
        setShowBlockDialog(false);
        setReason("");
        setBanDays("7");
        onUpdate();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to block user");
    } finally {
      setIsBlocking(false);
    }
  };

  const handleUnblock = async () => {
    setIsUnblocking(true);
    try {
      // Use quiz-specific unblock if quizId is provided
      const result = quizId 
        ? await unblockUserFromSpecificQuiz(userId, quizId)
        : await unblockUserFromQuiz(userId);
      
      if (result.status === "success") {
        toast.success(quizId 
          ? `${userName} has been unblocked from this quiz`
          : `${userName} has been unblocked from all quizzes`
        );
        onUpdate();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to unblock user");
    } finally {
      setIsUnblocking(false);
    }
  };

  if (isBanned) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="outline" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Unblock
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock User from {quizId ? "This Quiz" : "All Quizzes"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unblock <strong>{userName}</strong>? 
              {quizId 
                ? " They will regain access to this specific quiz only."
                : " They will regain access to all quizzes."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnblock}
              disabled={isUnblocking}
            >
              {isUnblocking ? "Unblocking..." : "Unblock User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="destructive" className="gap-2">
          <ShieldBan className="h-4 w-4" />
          Block
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Block User from Quizzes</AlertDialogTitle>
          <AlertDialogDescription>
            Block <strong>{userName}</strong> from accessing all quizzes. This action can be reversed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for blocking *</Label>
            <Input
              id="reason"
              placeholder="e.g., Tab switching, cheating, misbehavior..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="banDays">Ban Duration (days)</Label>
            <Input
              id="banDays"
              type="number"
              min="1"
              max="365"
              value={banDays}
              onChange={(e) => setBanDays(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave as 0 for permanent ban or specify days (1-365)
            </p>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleBlock}
            disabled={isBlocking || !reason.trim()}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isBlocking ? "Blocking..." : "Block User"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
