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
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Eye, MoreVertical, Search } from "lucide-react";
import { format } from "date-fns";
import { AttendanceSessionData, deleteAttendanceSession } from "../actions";
import { getActiveBatchesList } from "@/app/admin/batches/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { SilentRefreshButton } from "@/components/ui/silent-refresh-button";
import EditSessionDialog from "./edit-session-dialog";

interface SessionsTableProps {
  sessions: AttendanceSessionData[];
}

export default function SessionsTable({ sessions }: SessionsTableProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] =
    useState<AttendanceSessionData | null>(null);
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
    if (!selectedSession) return;

    setIsDeleting(true);
    try {
      const result = await deleteAttendanceSession(selectedSession.id);

      if (result.status === "success") {
        toast.success(result.message);
        setDeleteDialogOpen(false);
        setSelectedSession(null);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState("");

  const filteredSessions = sessions.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      s.title.toLowerCase().includes(q) ||
      s.sessionNumber.toString().includes(q) ||
      s.day.toLowerCase().includes(q)
    );
  });

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
        <p className="text-muted-foreground">
          No attendance sessions found. Create your first session to get started.
        </p>
        <SilentRefreshButton showLabel label="Refresh" toastMessage="Attendance sessions refreshed" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 text-xs h-9"
          />
        </div>
        <SilentRefreshButton toastMessage="Attendance sessions refreshed silently" />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session #</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Target Batch</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Day</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-xs">
                  No sessions match &quot;{searchQuery}&quot;
                </TableCell>
              </TableRow>
            ) : (
              filteredSessions.map((session) => (
                <TableRow key={session.id}>
                <TableCell className="font-medium">
                  <Badge variant="outline">#{session.sessionNumber}</Badge>
                </TableCell>
                <TableCell>{session.title}</TableCell>
                <TableCell>{getBatchLabel(session.targetBatchIds)}</TableCell>
                <TableCell>{format(new Date(session.date), "PPP")}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{session.day}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(session.createdAt), "MMM dd, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          router.push(
                            `/admin/points/attendance/${session.sessionNumber}`,
                          );
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2 text-blue-500" />
                        View Session
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedSession(session);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2 text-green-500" />
                        Edit Session
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedSession(session);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Session
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )))}
          </TableBody>
        </Table>
      </div>

      {selectedSession && (
        <EditSessionDialog
          session={selectedSession}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete session #
              {selectedSession?.sessionNumber} - {selectedSession?.title}. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
