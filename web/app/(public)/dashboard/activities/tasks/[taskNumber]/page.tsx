import { notFound, redirect } from "next/navigation";
import { getTaskDetails, getUserTaskSubmissions } from "@/app/data/public/tasks/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Award, FileText, AlertCircle, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { format, differenceInDays, isPast } from "date-fns";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import SubmitTaskButton from "./_components/submit-task-button";

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

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch user's GitHub username
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { githubUsername: true },
  });

  const result = await getTaskDetails(taskNum);

  if (result.status === "error" || !result.data) {
    notFound();
  }

  const task = result.data;

  // Fetch user's submission status for this task
  const submissionsResult = await getUserTaskSubmissions(session.user.id);
  const submissions = submissionsResult.status === "success" ? submissionsResult.data : {};
  const userSubmission = submissions[task.id];

  // Calculate task status
  const now = new Date();
  const startDate = new Date(task.startDate);
  const dueDate = new Date(task.dueDate);
  const daysUntilDue = differenceInDays(dueDate, now);
  const isOverdue = isPast(dueDate);
  const isUpcoming = now < startDate;
  
  let taskStatus: { label: string; variant: "default" | "secondary" | "destructive"; color: string } = {
    label: "Active",
    variant: "default",
    color: "bg-green-100 text-green-800 border-green-300"
  };
  
  if (isUpcoming) {
    taskStatus = { label: "Upcoming", variant: "secondary", color: "bg-gray-100 text-gray-800 border-gray-300" };
  } else if (isOverdue) {
    taskStatus = { label: "Overdue", variant: "destructive", color: "bg-red-100 text-red-800 border-red-300" };
  }

  const getSubmissionStatus = () => {
    if (!userSubmission) {
      return {
        icon: <AlertCircle className="h-5 w-5 text-yellow-600" />,
        badge: <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Not Submitted</Badge>,
        canSubmit: !isOverdue && !isUpcoming
      };
    }

    switch (userSubmission.status) {
      case "approved":
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          badge: <Badge className="bg-green-100 text-green-800 border-green-300">Approved</Badge>,
          canSubmit: false
        };
      case "rejected":
        return {
          icon: <XCircle className="h-5 w-5 text-red-600" />,
          badge: <Badge className="bg-red-100 text-red-800 border-red-300">Rejected</Badge>,
          canSubmit: !isOverdue && !isUpcoming
        };
      case "submitted":
        return {
          icon: <Clock className="h-5 w-5 text-blue-600" />,
          badge: <Badge className="bg-blue-100 text-blue-800 border-blue-300">Under Review</Badge>,
          canSubmit: false
        };
      case "pending":
        return {
          icon: <Clock className="h-5 w-5 text-yellow-600" />,
          badge: <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pending</Badge>,
          canSubmit: false
        };
      default:
        return {
          icon: <AlertCircle className="h-5 w-5 text-yellow-600" />,
          badge: <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pending</Badge>,
          canSubmit: false
        };
    }
  };

  const submissionStatus = getSubmissionStatus();

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Back Button */}
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/activities/tasks">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </Link>
        </Button>
        
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Task #{task.taskNumber}
          </h1>
          <Badge className={taskStatus.color} variant={taskStatus.variant}>
            {taskStatus.label}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Complete this task to earn {task.points} points
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Task Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Task Information</CardTitle>
              <CardDescription>Details about this task</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 shrink-0">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Task Title</p>
                  <p className="text-lg font-semibold">{task.title}</p>
                </div>
              </div>

              {task.description && (
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-purple-500/10 p-2 shrink-0">
                    <FileText className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                    <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{task.description}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-blue-500/10 p-2 shrink-0">
                    <Calendar className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                    <p className="text-base font-semibold">
                      {format(new Date(task.startDate), "MMMM dd, yyyy")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-orange-500/10 p-2 shrink-0">
                    <Clock className="h-4 w-4 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                    <p className="text-base font-semibold">
                      {format(new Date(task.dueDate), "MMMM dd, yyyy")}
                    </p>
                    {!isOverdue && !isUpcoming && (
                      <p className="text-sm text-muted-foreground">
                        {daysUntilDue > 0 ? `${daysUntilDue} days remaining` : "Due today"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-4 border-t">
                <div className="rounded-full bg-green-500/10 p-2 shrink-0">
                  <Award className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Points</p>
                  <p className="text-lg font-semibold">{task.points} points</p>
                  <p className="text-sm text-muted-foreground">
                    Earn these points upon task approval
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions or Guidelines Card */}
          <Card>
            <CardHeader>
              <CardTitle>How to Complete</CardTitle>
              <CardDescription>Follow these steps to complete the task</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Read the task description carefully</li>
                <li>Complete the required work before the due date</li>
                <li>Click the "Submit Task" button when you're ready</li>
                <li>Wait for admin review and approval</li>
                <li>Points will be awarded once approved</li>
              </ol>
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Make sure to submit your task before the due date. 
                  Late submissions may not be accepted.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Submission Status */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Submission</CardTitle>
              <CardDescription>Current status of your submission</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                {submissionStatus.icon}
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  {submissionStatus.badge}
                </div>
              </div>

              {userSubmission?.pointsAwarded !== undefined && userSubmission.pointsAwarded > 0 && (
                <div className="flex items-center gap-3 pt-3 border-t">
                  <Award className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Points Earned</p>
                    <p className="text-xl font-bold text-green-600">
                      +{userSubmission.pointsAwarded} points
                    </p>
                  </div>
                </div>
              )}

              {userSubmission?.submittedAt && (
                <div className="pt-3 border-t">
                  <p className="text-sm font-medium text-muted-foreground">Submitted On</p>
                  <p className="text-sm">
                    {format(new Date(userSubmission.submittedAt), "MMMM dd, yyyy 'at' hh:mm a")}
                  </p>
                </div>
              )}

              {userSubmission?.evaluatedAt && (
                <div className="pt-3 border-t">
                  <p className="text-sm font-medium text-muted-foreground">Evaluated On</p>
                  <p className="text-sm">
                    {format(new Date(userSubmission.evaluatedAt), "MMMM dd, yyyy 'at' hh:mm a")}
                  </p>
                </div>
              )}

              {userSubmission?.feedback && (
                <div className="pt-3 border-t">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Admin Feedback</p>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{userSubmission.feedback}</p>
                  </div>
                </div>
              )}

              {submissionStatus.canSubmit && (
                <div className="pt-4">
                  <SubmitTaskButton 
                    taskId={task.id}
                    userId={session.user.id}
                    isResubmit={userSubmission?.status === "rejected"}
                    githubUsername={user?.githubUsername}
                  />
                </div>
              )}

              {!submissionStatus.canSubmit && userSubmission && userSubmission.status === "submitted" && (
                <div className="pt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Under Review:</strong> Your submission is being reviewed by the admin. 
                    You'll be notified once it's evaluated.
                  </p>
                </div>
              )}

              {!submissionStatus.canSubmit && userSubmission && userSubmission.status === "approved" && (
                <div className="pt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    <strong>Approved:</strong> Congratulations! Your submission has been approved. 
                    Points have been awarded to your account.
                  </p>
                </div>
              )}

              {isOverdue && !userSubmission && (
                <div className="pt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">
                    <strong>Task Overdue:</strong> This task is past its due date. 
                    Submissions are no longer accepted.
                  </p>
                </div>
              )}

              {isUpcoming && (
                <div className="pt-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-800">
                    <strong>Task Not Started:</strong> This task will be available on{" "}
                    {format(new Date(task.startDate), "MMMM dd, yyyy")}.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Task Number</span>
                <Badge variant="outline">#{task.taskNumber}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Points</span>
                <span className="text-sm font-semibold">{task.points} pts</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className={taskStatus.color}>{taskStatus.label}</Badge>
              </div>
              {!isOverdue && !isUpcoming && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Time Left</span>
                  <span className="text-sm font-semibold">
                    {daysUntilDue > 0 ? `${daysUntilDue} days` : "Due today"}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
