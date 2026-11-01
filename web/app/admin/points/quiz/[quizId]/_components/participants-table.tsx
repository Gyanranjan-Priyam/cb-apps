"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Award, User } from "lucide-react";
import { useState } from "react";
import { updateAttemptStatus } from "../actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface QuizAttempt {
  id: string;
  setNumber: number;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  pointsEarned: number;
  completedAt: Date | null;
  status: string;
}

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  username: string | null;
  registration: string | null;
  branch: string | null;
}

interface Participant {
  user: UserData;
  attempts: QuizAttempt[];
}

interface ParticipantsTableProps {
  participants: Participant[];
  quizId: string;
  pointsPerQuestion: number;
}

export default function ParticipantsTable({ 
  participants, 
  quizId,
  pointsPerQuestion 
}: ParticipantsTableProps) {
  const router = useRouter();
  const [loadingAttemptId, setLoadingAttemptId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<{
    attemptId: string;
    action: "approved" | "rejected";
    userName: string;
  } | null>(null);

  if (participants.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No participants yet.</p>
      </div>
    );
  }

  const handleStatusUpdate = async (
    attemptId: string, 
    status: "approved" | "rejected",
    userName: string
  ) => {
    setSelectedAction({ attemptId, action: status, userName });
    setDialogOpen(true);
  };

  const confirmStatusUpdate = async () => {
    if (!selectedAction) return;

    setLoadingAttemptId(selectedAction.attemptId);
    setDialogOpen(false);

    const result = await updateAttemptStatus(selectedAction.attemptId, selectedAction.action);

    if (result.status === "success") {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.message);
    }

    setLoadingAttemptId(null);
    setSelectedAction(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="default" className="bg-green-600">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Participant</TableHead>
              <TableHead className="hidden md:table-cell">Registration</TableHead>
              <TableHead className="hidden lg:table-cell">Branch</TableHead>
              <TableHead>Set</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Correct</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.flatMap((participant) =>
              participant.attempts.map((attempt) => (
                <TableRow key={attempt.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{participant.user.name || "N/A"}</span>
                      <span className="text-xs text-muted-foreground">
                        {participant.user.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm font-mono">
                      {participant.user.registration || "N/A"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-sm">{participant.user.branch || "N/A"}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      Set {String.fromCharCode(65 + attempt.setNumber)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">{attempt.score}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {attempt.correctAnswers} / {attempt.totalQuestions}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Award className="h-3 w-3 text-yellow-600" />
                      <span className="font-semibold text-yellow-600">
                        {attempt.pointsEarned}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(attempt.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {attempt.status === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusUpdate(attempt.id, "approved", participant.user.name || "User")}
                            disabled={loadingAttemptId === attempt.id}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusUpdate(attempt.id, "rejected", participant.user.name || "User")}
                            disabled={loadingAttemptId === attempt.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {attempt.status === "approved" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusUpdate(attempt.id, "rejected", participant.user.name || "User")}
                          disabled={loadingAttemptId === attempt.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {attempt.status === "rejected" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusUpdate(attempt.id, "approved", participant.user.name || "User")}
                          disabled={loadingAttemptId === attempt.id}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedAction?.action === "approved" ? "Approve Points" : "Reject Points"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {selectedAction?.action === "approved" ? "approve" : "reject"} points for {selectedAction?.userName}? This action can be reversed later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusUpdate}
              className={selectedAction?.action === "approved" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {selectedAction?.action === "approved" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
