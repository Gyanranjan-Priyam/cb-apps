import { notFound, redirect } from "next/navigation";
import { getTaskByNumber, getMembersWithSubmissions, getTaskSubmissions } from "@/app/admin/tasks/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Award, FileText } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import MemberSubmissionList from "@/app/admin/tasks/[taskNumber]/_components/member-submission-list";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

interface PageProps {
  params: Promise<{
    taskNumber: string;
  }>;
}

export default async function CoAdminTaskDetailPage({ params }: PageProps) {
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

  // Get current user session
  const authSession = await auth.api.getSession({
    headers: await headers(),
  });

  if (!authSession?.user?.id) {
    redirect("/login");
  }

  // Fetch members who have submitted this task
  const membersResult = await getMembersWithSubmissions(task.id);
  const members = membersResult.status === "success" ? membersResult.data : [];

  // Fetch submission data for this task
  const submissionsResult = await getTaskSubmissions(task.id);
  const initialSubmissions = submissionsResult.status === "success" ? submissionsResult.data : {};

  // Calculate task statistics
  const totalMembers = members.length;
  const submittedCount = Object.values(initialSubmissions).filter(sub => sub.status === "submitted").length;
  const approvedCount = Object.values(initialSubmissions).filter(sub => sub.status === "approved").length;
  const rejectedCount = Object.values(initialSubmissions).filter(sub => sub.status === "rejected").length;
  const pendingCount = 0;

  // Calculate task status
  const now = new Date();
  const startDate = new Date(task.startDate);
  const dueDate = new Date(task.dueDate);
  const isUpcoming = now < startDate;
  const isExpired = now > dueDate;
  const isActive = !isUpcoming && !isExpired;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-base font-semibold">
              Task #{task.taskNumber}
            </Badge>
            {isActive && <Badge className="bg-green-500">Active</Badge>}
            {isUpcoming && <Badge variant="secondary">Upcoming</Badge>}
            {isExpired && <Badge variant="destructive">Expired</Badge>}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-2">
            {task.title}
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and evaluate member submissions for this task
          </p>
        </div>
      </div>

      {/* Task Info & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points Reward</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{task.points}</div>
            <p className="text-xs text-muted-foreground">Points per approved submission</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Timeline</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-1">
              <div>Start: {format(startDate, "MMM dd, yyyy")}</div>
              <div>Due: {format(dueDate, "MMM dd, yyyy")}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {differenceInDays(dueDate, startDate)} days duration
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submitted</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <p className="text-xs text-muted-foreground">Members submitted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submittedCount}</div>
            <p className="text-xs text-muted-foreground">
              {approvedCount} approved, {rejectedCount} rejected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Task Description */}
      {task.description && (
        <Card>
          <CardHeader>
            <CardTitle>Task Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {task.description}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Member Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Member Submissions & Evaluation</CardTitle>
          <CardDescription>
            Review task submissions and evaluate points
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MemberSubmissionList
            taskId={task.id}
            taskPoints={task.points}
            members={members}
            initialSubmissions={initialSubmissions}
            adminId={authSession.user.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
