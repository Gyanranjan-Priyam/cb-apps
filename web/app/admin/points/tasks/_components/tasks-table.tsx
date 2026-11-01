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
import { Eye, Calendar, ExternalLink, Search } from "lucide-react";
import { format } from "date-fns";
import { TaskData } from "@/app/admin/tasks/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { SilentRefreshButton } from "@/components/ui/silent-refresh-button";

interface TasksTableProps {
  tasks: TaskData[];
}

export default function TasksTable({ tasks }: TasksTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTasks = tasks.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      t.title.toLowerCase().includes(q) ||
      (t.description?.toLowerCase().includes(q) ?? false) ||
      t.taskNumber.toString().includes(q)
    );
  });

  const getTaskStatus = (startDate: Date, dueDate: Date) => {
    const now = new Date();
    const start = new Date(startDate);
    const due = new Date(dueDate);

    if (now < start) {
      return { label: "Upcoming", variant: "secondary" as const };
    } else if (now > due) {
      return { label: "Overdue", variant: "destructive" as const };
    } else {
      return { label: "Active", variant: "default" as const };
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
        <p className="text-muted-foreground">
          No tasks found. Create tasks from the Tasks Management section.
        </p>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push("/admin/tasks")}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Go to Tasks Management
          </Button>
          <SilentRefreshButton showLabel label="Refresh" toastMessage="Tasks refreshed" />
        </div>
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
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 text-xs h-9"
          />
        </div>
        <SilentRefreshButton toastMessage="Tasks refreshed silently" />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task #</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-xs">
                  No tasks match &quot;{searchQuery}&quot;
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks.map((task) => {
                const status = getTaskStatus(new Date(task.startDate), new Date(task.dueDate));
                return (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">
                      <Badge variant="outline">#{task.taskNumber}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(task.startDate), "MMM dd, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(task.dueDate), "MMM dd, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{task.points} pts</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => router.push(`/admin/tasks/${task.taskNumber}`)}
                      >
                        <Eye className="h-4 w-4 mr-2 text-blue-500" />
                        View Submissions
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
