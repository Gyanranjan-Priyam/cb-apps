import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Award, ListChecks, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format, differenceInDays, isPast, isFuture } from "date-fns";
import { getAllPublicTasks, getUserTaskSubmissions } from "@/app/data/public/tasks/actions";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tasks",
  description: "View and complete tasks to earn points",
};

export default async function TasksPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const tasksResult = await getAllPublicTasks();
  const tasks = tasksResult.status === "success" ? tasksResult.data : [];

  const submissionsResult = await getUserTaskSubmissions(session.user.id);
  const submissions = submissionsResult.status === "success" ? submissionsResult.data : {};

  const getTaskStatus = (startDate: Date, dueDate: Date) => {
    const now = new Date();
    const start = new Date(startDate);
    const due = new Date(dueDate);

    if (now < start) {
      return { 
        label: "Upcoming", 
        variant: "secondary" as const,
        color: "bg-gray-100 text-gray-800 border-gray-300"
      };
    } else if (now > due) {
      return { 
        label: "Overdue", 
        variant: "destructive" as const,
        color: "bg-red-100 text-red-800 border-red-300"
      };
    } else {
      return { 
        label: "Active", 
        variant: "default" as const,
        color: "bg-green-100 text-green-800 border-green-300"
      };
    }
  };

  const getSubmissionBadge = (taskId: string) => {
    const submission = submissions[taskId];
    
    if (!submission) {
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        badge: <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Not Submitted</Badge>
      };
    }

    switch (submission.status) {
      case "approved":
        return {
          icon: <CheckCircle className="h-4 w-4 text-green-600" />,
          badge: <Badge className="bg-green-100 text-green-800 border-green-300">Approved (+{submission.pointsAwarded} pts)</Badge>
        };
      case "rejected":
        return {
          icon: <XCircle className="h-4 w-4 text-red-600" />,
          badge: <Badge className="bg-red-100 text-red-800 border-red-300">Rejected</Badge>
        };
      case "submitted":
        return {
          icon: <Clock className="h-4 w-4 text-blue-600" />,
          badge: <Badge className="bg-blue-100 text-blue-800 border-blue-300">Submitted</Badge>
        };
      default:
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          badge: <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pending</Badge>
        };
    }
  };

  // Separate tasks into categories
  const activeTasks = tasks.filter(task => {
    const now = new Date();
    return new Date(task.startDate) <= now && new Date(task.dueDate) >= now;
  });

  const upcomingTasks = tasks.filter(task => {
    return isFuture(new Date(task.startDate));
  });

  const completedTasks = tasks.filter(task => {
    return isPast(new Date(task.dueDate));
  });

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
          <ListChecks className="h-7 w-7" />
          Tasks
        </h1>
        <p className="text-muted-foreground mt-2">
          Complete tasks to earn points and improve your ranking
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTasks.length}</div>
            <p className="text-xs text-muted-foreground">Available now</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Your Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(submissions).length}</div>
            <p className="text-xs text-muted-foreground">Tasks submitted</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Points Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(submissions).reduce((sum, sub) => sum + sub.pointsAwarded, 0)}
            </div>
            <p className="text-xs text-muted-foreground">From tasks</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Tasks */}
      {activeTasks.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Active Tasks</h2>
          
          {/* Desktop List View */}
          <div className="hidden md:block">
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {activeTasks.map((task) => {
                    const status = getTaskStatus(task.startDate, task.dueDate);
                    const submissionBadge = getSubmissionBadge(task.id);
                    const daysRemaining = differenceInDays(new Date(task.dueDate), new Date());

                    return (
                      <div key={task.id} className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">#{task.taskNumber}</Badge>
                              <Badge className={status.color}>{status.label}</Badge>
                              <div className="flex items-center gap-1">
                                {submissionBadge.icon}
                                {submissionBadge.badge}
                              </div>
                            </div>
                            <h3 className="text-lg font-semibold mb-1">{task.title}</h3>
                            {task.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                {task.description}
                              </p>
                            )}
                            {submissions[task.id]?.feedback && (
                              <p className="text-xs text-muted-foreground italic mb-2 bg-muted/50 p-2 rounded">
                                <strong>Feedback:</strong> {submissions[task.id].feedback}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                              <div className="flex items-center gap-1">
                                <Award className="h-4 w-4 text-green-600" />
                                <span className="font-semibold text-foreground">{task.points} points</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {daysRemaining > 0 
                                    ? `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} left`
                                    : 'Due today'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>Due: {format(new Date(task.dueDate), "MMM dd, yyyy")}</span>
                              </div>
                            </div>
                          </div>
                          <div className="shrink-0">
                            <Button 
                              asChild 
                              variant={submissions[task.id]?.status === "approved" ? "outline" : "default"}
                            >
                              <Link href={`/dashboard/activities/tasks/${task.taskNumber}`}>
                                {submissions[task.id]?.status === "approved" ? "View Details" : "View Task"}
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden grid gap-4">
            {activeTasks.map((task) => {
              const status = getTaskStatus(task.startDate, task.dueDate);
              const submissionBadge = getSubmissionBadge(task.id);
              const daysRemaining = differenceInDays(new Date(task.dueDate), new Date());

              return (
                <Card key={task.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">#{task.taskNumber}</Badge>
                          <Badge className={status.color}>{status.label}</Badge>
                        </div>
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                      </div>
                    </div>
                    {task.description && (
                      <CardDescription className="line-clamp-2 mt-2">
                        {task.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="h-4 w-4 text-green-600" />
                      <span className="font-semibold">{task.points} points</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        {daysRemaining > 0 
                          ? `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} left`
                          : 'Due today'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Due: {format(new Date(task.dueDate), "MMM dd, yyyy")}</span>
                    </div>
                    
                    <div className="pt-3 border-t">
                      <div className="flex items-center gap-2 mb-3">
                        {submissionBadge.icon}
                        {submissionBadge.badge}
                      </div>
                      
                      {submissions[task.id]?.feedback && (
                        <p className="text-xs text-muted-foreground italic mb-2">
                          Feedback: {submissions[task.id].feedback}
                        </p>
                      )}
                      
                      <Button 
                        asChild 
                        className="w-full"
                        variant={submissions[task.id]?.status === "approved" ? "outline" : "default"}
                      >
                        <Link href={`/dashboard/activities/tasks/${task.taskNumber}`}>
                          {submissions[task.id]?.status === "approved" ? "View Details" : "View Task"}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Tasks */}
      {upcomingTasks.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Upcoming Tasks</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingTasks.map((task) => {
              const status = getTaskStatus(task.startDate, task.dueDate);

              return (
                <Card key={task.id} className="opacity-75">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">#{task.taskNumber}</Badge>
                      <Badge className={status.color}>{status.label}</Badge>
                    </div>
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    {task.description && (
                      <CardDescription className="line-clamp-2 mt-2">
                        {task.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="h-4 w-4 text-green-600" />
                      <span className="font-semibold">{task.points} points</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Starts: {format(new Date(task.startDate), "MMM dd, yyyy")}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed/Overdue Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Past Tasks</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedTasks.map((task) => {
              const status = getTaskStatus(task.startDate, task.dueDate);
              const submissionBadge = getSubmissionBadge(task.id);

              return (
                <Card key={task.id} className="opacity-60">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">#{task.taskNumber}</Badge>
                      <Badge className={status.color}>{status.label}</Badge>
                    </div>
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="h-4 w-4 text-green-600" />
                      <span className="font-semibold">{task.points} points</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {submissionBadge.icon}
                      {submissionBadge.badge}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {tasks.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ListChecks className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No tasks available</p>
            <p className="text-sm text-muted-foreground">Check back later for new tasks</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
