"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Github, ExternalLink, MessageSquare, Trash2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { deleteSubmission } from "../actions";
import { toast } from "sonner";
import { useTransition } from "react";
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

interface Submission {
  id: string;
  repoName: string;
  repoUrl: string;
  description: string;
  reviewType: string;
  explanation: string;
  liveUrl: string | null;
  whatsappNumber: string | null;
  status: string;
  adminResponse: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SubmissionsListProps {
  submissions: Submission[];
}

export function SubmissionsList({ submissions }: SubmissionsListProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (submissionId: string) => {
    startTransition(async () => {
      try {
        const result = await deleteSubmission(submissionId);
        if (result.success) {
          toast.success(result.message);
          window.location.reload();
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error("Failed to delete submission");
        console.error(error);
      }
    });
  };

  if (submissions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Github className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">No Submissions Yet</h3>
              <p className="text-muted-foreground text-sm">
                You haven't submitted any projects for review yet. Go to "My Projects" and click "Send for Review" on any repository.
              </p>
            </div>
            <Button asChild>
              <a href="/dashboard/projects/my-projects">Go to My Projects</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getReviewTypeBadge = (type: string) => {
    switch (type) {
      case "review":
        return (
          <Badge variant="secondary" className="gap-1">
            <MessageSquare className="h-3 w-3" />
            For Review
          </Badge>
        );
      case "collaboration":
        return (
          <Badge variant="default" className="bg-blue-600 gap-1">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            For Collaboration
          </Badge>
        );
      case "publish":
        return (
          <Badge variant="default" className="bg-green-600 gap-1">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            For Publish
          </Badge>
        );
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="border-yellow-600 text-yellow-600 gap-1">
            <Clock className="h-3 w-3" />
            Pending Review
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="border-green-600 text-green-600 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="border-red-600 text-red-600 gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <Card key={submission.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="space-y-2 flex-1">
                <div className="flex items-center flex-wrap gap-2">
                  <CardTitle className="text-base sm:text-lg">{submission.repoName}</CardTitle>
                  {getReviewTypeBadge(submission.reviewType)}
                  {getStatusBadge(submission.status)}
                </div>
                <CardDescription className="line-clamp-2 text-sm">
                  {submission.description || "No description provided"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Timestamps */}
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Submitted: {formatDate(submission.createdAt)}</span>
              </div>
              {submission.updatedAt.getTime() !== submission.createdAt.getTime() && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Updated: {formatDate(submission.updatedAt)}</span>
                </div>
              )}
            </div>

            {/* Explanation */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Your Explanation:</p>
              <div className="p-3 bg-muted/50 rounded-lg border">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                  {submission.explanation}
                </p>
              </div>
            </div>

            {/* Admin Response */}
            {submission.adminResponse && (
              <div className={`p-3 rounded-lg border space-y-2 ${
                submission.status === "approved" 
                  ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                  : submission.status === "rejected"
                  ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                  : "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
              }`}>
                <div className="flex items-center gap-2">
                  <MessageSquare className={`h-4 w-4 ${
                    submission.status === "approved" ? "text-green-600" : 
                    submission.status === "rejected" ? "text-red-600" : 
                    "text-blue-600"
                  }`} />
                  <p className={`text-sm font-medium ${
                    submission.status === "approved" ? "text-green-600" : 
                    submission.status === "rejected" ? "text-red-600" : 
                    "text-blue-600"
                  }`}>
                    Admin Response:
                  </p>
                </div>
                <p className="text-sm text-muted-foreground pl-6">{submission.adminResponse}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-none">
                <a href={submission.repoUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
                  <Github className="h-3.5 w-3.5" />
                  View Repo
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
              {submission.liveUrl && (
                <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-none">
                  <a href={submission.liveUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Live Demo
                  </a>
                </Button>
              )}
              {submission.status === "pending" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" disabled={isPending} className="flex-1 sm:flex-none gap-2">
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Submission?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this submission? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(submission.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
