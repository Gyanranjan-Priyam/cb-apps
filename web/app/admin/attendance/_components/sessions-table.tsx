"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { format } from "date-fns";
import { Eye, Trash2, MoreVertical, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getActiveBatchesList } from "@/app/admin/batches/actions";

interface AttendanceSession {
  id: string;
  sessionNumber: number;
  title: string;
  date: string;
  day: string;
  targetBatchIds?: string[];
  _count: {
    attendances: number;
  };
}

interface SessionsTableProps {
  sessions: AttendanceSession[];
  selectedSession: string;
  onSelectSession: (sessionId: string) => void;
  onSessionDeleted?: () => void;
  canDelete?: boolean;
}

export default function SessionsTable({
  sessions,
  selectedSession,
  onSelectSession,
  onSessionDeleted,
  canDelete = true,
}: SessionsTableProps) {
  const [sessionToDelete, setSessionToDelete] =
    useState<AttendanceSession | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [batchesList, setBatchesList] = useState<
    { id: string; name: string; code: string }[]
  >([]);

  useEffect(() => {
    getActiveBatchesList().then((list) => setBatchesList(list));
  }, []);

  const getBatchLabel = (targetBatchIds?: string[]) => {
    if (!targetBatchIds || targetBatchIds.length === 0) {
      return (
        <Badge variant="outline" className="text-xs text-muted-foreground">
          All Batches
        </Badge>
      );
    }
    const matchedBatches = batchesList.filter((b) =>
      targetBatchIds.includes(b.id),
    );
    if (matchedBatches.length === 0) {
      return (
        <Badge variant="secondary" className="text-xs">
          Batch Restricted
        </Badge>
      );
    }
    return (
      <div className="flex flex-wrap gap-1">
        {matchedBatches.map((b) => (
          <Badge key={b.id} variant="default" className="text-xs font-mono">
            {b.code}
          </Badge>
        ))}
      </div>
    );
  };

  const handleDelete = async () => {
    if (!sessionToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/admin/attendance/sessions?id=${sessionToDelete.id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(
          `Session #${sessionToDelete.sessionNumber} deleted successfully`,
        );
        setSessionToDelete(null);
        onSessionDeleted?.();
      } else {
        toast.error(data.error || "Failed to delete attendance session");
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Failed to delete attendance session");
    } finally {
      setIsDeleting(false);
    }
  };

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No attendance sessions found. Create your first session to get started.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Session #</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Target Batch</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Day</TableHead>
              <TableHead className="text-center">Present Count</TableHead>
              <TableHead className="text-center">Scanner Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => {
              const isSelected = selectedSession === session.id;
              return (
                <TableRow
                  key={session.id}
                  className={isSelected ? "bg-primary/5" : ""}
                >
                  <TableCell className="font-medium">
                    <Badge variant="outline">#{session.sessionNumber}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    <button
                      type="button"
                      onClick={() => onSelectSession(session.id)}
                      className="hover:underline text-left cursor-pointer font-medium"
                    >
                      {session.title}
                    </button>
                  </TableCell>
                  <TableCell>{getBatchLabel(session.targetBatchIds)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(session.date), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="text-sm">{session.day}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-semibold">
                      {session._count?.attendances || 0} students
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {isSelected ? (
                      <Badge className="bg-green-600 hover:bg-green-600 text-white gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Active for Scanning
                      </Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectSession(session.id)}
                        className="text-xs h-7"
                      >
                        Select
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Session Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/admin/points/attendance/${session.sessionNumber}`}
                            className="cursor-pointer flex items-center"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => onSelectSession(session.id)}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Select for Scanning
                        </DropdownMenuItem>
                        {canDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="cursor-pointer text-destructive focus:text-destructive"
                              onClick={() => setSessionToDelete(session)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Session
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={!!sessionToDelete}
        onOpenChange={(open) => {
          if (!open) setSessionToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attendance Session?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>
                Session #{sessionToDelete?.sessionNumber}:{" "}
                {sessionToDelete?.title}
              </strong>
              ? This will also remove all attendance records associated with
              this session. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Session"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
