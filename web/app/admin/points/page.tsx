import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckSquare, Brain, Trophy } from "lucide-react";
import CreateSessionDialog from "./attendance/_components/create-session-dialog";
import SessionsTable from "./attendance/_components/sessions-table";
import TasksTable from "./tasks/_components/tasks-table";
import CreateEventDialog from "./events/_components/create-event-dialog";
import EventsTable from "./events/_components/events-table";
import QuizTable from "./quiz/_components/quiz-table";
import { getAllAttendanceSessions } from "./attendance/actions";
import { getAllTasks } from "@/app/admin/tasks/actions";
import { getAllEventPoints } from "./events/actions";
import { getAllQuizzes } from "./quiz/actions";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Points Management",
  description: "Manage attendance, tasks, events, and quiz points for members",
};

export default async function PointsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const sessionsResult = await getAllAttendanceSessions();
  const sessions = sessionsResult.status === "success" ? sessionsResult.data : [];

  const tasksResult = await getAllTasks();
  const tasks = tasksResult.status === "success" ? tasksResult.data : [];

  const eventsResult = await getAllEventPoints();
  const events = eventsResult.status === "success" ? eventsResult.data : [];

  const quizzesResult = await getAllQuizzes();
  const quizzes = quizzesResult.status === "success" ? quizzesResult.data : [];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Points Management
          </h1>
          <p className="text-muted-foreground mt-2 text-xs sm:text-sm">
            Manage member points across attendance, tasks, quizzes, and events
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="h-9 gap-1.5 self-start sm:self-auto font-mono text-xs">
          <Link href="/admin/leaderboard">
            <Trophy className="w-3.5 h-3.5" />
            <span>View Student Leaderboard</span>
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Attendance</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Tasks</span>
          </TabsTrigger>
          <TabsTrigger value="quiz" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">Quiz</span>
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Events</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="mt-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="space-y-1">
                <CardTitle>Attendance Sessions</CardTitle>
                <CardDescription>
                  Create and manage attendance sessions for members
                </CardDescription>
              </div>
              <CreateSessionDialog userId={session?.user.id || ""} />
            </CardHeader>
            <CardContent>
              <SessionsTable sessions={sessions} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="space-y-1">
                <CardTitle>Tasks</CardTitle>
                <CardDescription>
                  View all tasks. Manage tasks from the Tasks section.
                </CardDescription>
              </div>
              <Button asChild>
                <Link href="/admin/tasks">
                  Manage Tasks
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <TasksTable tasks={tasks} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quiz" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Quiz Points</CardTitle>
              <CardDescription>
                View and manage points for quiz participation and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuizTable quizzes={quizzes} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="space-y-1">
                <CardTitle>Event Points</CardTitle>
                <CardDescription>
                  Create and manage events for members to participate and earn points
                </CardDescription>
              </div>
              <CreateEventDialog userId={session?.user.id || ""} />
            </CardHeader>
            <CardContent>
              <EventsTable events={events} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}