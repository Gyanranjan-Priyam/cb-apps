"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CloseWindowButton } from "./close-window-button";

interface BannedUserScreenProps {
  user: {
    banReason?: string | null;
    banExpires?: string | null;
  };
}

export function BannedUserScreen({ user }: BannedUserScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-background to-destructive/5">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-destructive">Access Blocked</h1>
          <p className="text-muted-foreground mb-4">
            You have been blocked from accessing quizzes.
          </p>
          {user.banReason && (
            <div className="p-4 bg-destructive/10 rounded-lg mb-4">
              <p className="text-sm font-medium text-destructive mb-1">Reason:</p>
              <p className="text-sm text-muted-foreground">{user.banReason}</p>
            </div>
          )}
          {user.banExpires && (
            <p className="text-sm text-muted-foreground mb-4">
              Ban expires: {new Date(user.banExpires).toLocaleString()}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Please contact the CodeBreakers coordinators for assistance.
          </p>
        </div>
        <div className="space-y-3">
          <CloseWindowButton 
            redirectTo="/dashboard" 
            variant="outline" 
            className="w-full"
          >
            Return to Dashboard
          </CloseWindowButton>
        </div>
      </div>
    </div>
  );
}

interface QuizBlockedScreenProps {
  quizBlock: {
    reason: string;
    violationType: string;
    violationCount: number;
    blockedAt: string;
  };
}

export function QuizBlockedScreen({ quizBlock }: QuizBlockedScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-background to-destructive/5">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-destructive">Quiz Access Locked</h1>
          <p className="text-muted-foreground mb-4">
            You have been blocked from accessing this specific quiz due to violations.
          </p>
          <div className="p-4 bg-destructive/10 rounded-lg mb-4 text-left">
            <p className="text-sm font-medium text-destructive mb-2">Block Details:</p>
            <p className="text-sm text-muted-foreground mb-2">{quizBlock.reason}</p>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-1 bg-destructive/20 rounded text-destructive font-medium">
                {quizBlock.violationType.replace(/_/g, ' ')}
              </span>
              <span className="text-muted-foreground">
                {quizBlock.violationCount} violation{quizBlock.violationCount !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Blocked on: {new Date(quizBlock.blockedAt).toLocaleString()}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            This block is specific to this quiz. Please contact the administrators to appeal this decision.
          </p>
        </div>
        <div className="space-y-3">
          <CloseWindowButton 
            redirectTo="/dashboard/activities/quizzes" 
            variant="outline" 
            className="w-full"
          >
            Back to Quizzes
          </CloseWindowButton>
        </div>
      </div>
    </div>
  );
}
