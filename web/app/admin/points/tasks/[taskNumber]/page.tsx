import { notFound, redirect } from "next/navigation";
import { getTaskByNumber, getAllMembers, getTaskSubmissions } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Award, FileText, TrendingUp } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import MemberSubmissionList from "./_components/member-submission-list";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

interface PageProps {
  params: Promise<{
    taskNumber: string;
  }>;
}

export default async function TaskDetailPage({ params }: PageProps) {
  const { taskNumber } = await params;
  const taskNum = parseInt(taskNumber, 10);

  if (isNaN(taskNum)) {
    notFound();
  }

  const result = await getTaskByNumber(taskNum);

  if (result.status === "error" || !result.data) {
    notFound();
  }

  const task = result.data;

  // Get current admin user
  const authSession = await auth.api.getSession({
    headers: await headers(),
  });

  if (!authSession?.user?.id) {
    redirect("/login");
  }

  // Fetch all members
  const membersResult = await getAllMembers();
  const members = membersResult.status === "success" ? membersResult.data : [];

  // Fetch submission data for this task
  const submissionsResult = await getTaskSubmissions(task.id);
  const initialSubmissions = submissionsResult.status === "success" ? submissionsResult.data : {};

  // Calculate task statistics
  const totalMembers = members.length;
  const submittedCount = Object.values(initialSubmissions).filter(sub => sub.status === "submitted" || sub.status === "approved" || sub.status === "rejected").length;
  const approvedCount = Object.values(initialSubmissions).filter(sub => sub.status === "approved").length;
  const rejectedCount = Object.values(initialSubmissions).filter(sub => sub.status === "rejected").length;
  const pendingCount = totalMembers - submittedCount;

  // Calculate task status
  const now = new Date();
  const startDate = new Date(task.startDate);
  const dueDate = new Date(task.dueDate);
  const daysUntilDue = differenceInDays(dueDate, now);
  
  let taskStatus: { label: string; variant: "default" | "secondary" | "destructive" } = {
    label: "Active",
    variant: "default"
  };
  
  if (now < startDate) {
    taskStatus = { label: "Upcoming", variant: "secondary" };
  } else if (now > dueDate) {
    taskStatus = { label: "Overdue", variant: "destructive" };
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Task #{task.taskNumber}
          </h1>
          <Badge variant={taskStatus.variant} className="text-base">
            {taskStatus.label}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          View task details and manage member submissions
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Task Information</CardTitle>
            <CardDescription>Basic details about this task</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Task Title</p>
                <p className="text-lg font-semibold">{task.title}</p>
              </div>
            </div>

            {task.description && (
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-purple-500/10 p-2">
                  <FileText className="h-4 w-4 text-purple-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-sm text-foreground mt-1">{task.description}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="rounded-full bg-blue-500/10 p-2">
                <Calendar className="h-4 w-4 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                <p className="text-lg font-semibold">
                  {format(new Date(task.startDate), "MMMM dd, yyyy")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-full bg-orange-500/10 p-2">
                <Clock className="h-4 w-4 text-orange-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                <p className="text-lg font-semibold">
                  {format(new Date(task.dueDate), "MMMM dd, yyyy")}
                </p>
                {taskStatus.label === "Active" && (
                  <p className="text-sm text-muted-foreground">
                    {daysUntilDue > 0 ? `${daysUntilDue} days remaining` : "Due today"}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-full bg-green-500/10 p-2">
                <Award className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Points</p>
                <p className="text-lg font-semibold">{task.points} points</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Submission Statistics</CardTitle>
            <CardDescription>Member submissions for this task</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
                <p className="text-sm text-green-600 font-medium">Approved</p>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
                <p className="text-sm text-red-600 font-medium">Rejected</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-3xl font-bold text-blue-600">{submittedCount}</p>
                <p className="text-sm text-blue-600 font-medium">Submitted</p>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
                <p className="text-sm text-yellow-600 font-medium">Pending</p>
              </div>
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Members</span>
                <span className="text-lg font-semibold">{totalMembers}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-muted-foreground">Submission Rate</span>
                <span className="text-lg font-semibold">
                  {totalMembers > 0 ? Math.round((submittedCount / totalMembers) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-muted-foreground">Approval Rate</span>
                <span className="text-lg font-semibold">
                  {submittedCount > 0 ? Math.round((approvedCount / submittedCount) * 100) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Member Submissions</CardTitle>
          <CardDescription>List of members and their submission status</CardDescription>
        </CardHeader>
        <CardContent>
          <MemberSubmissionList 
            members={members} 
            taskId={task.id}
            taskPoints={task.points}
            initialSubmissions={initialSubmissions}
            adminId={authSession.user.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
