import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Calendar, CheckCircle, Star, Award } from "lucide-react";
import { getUserAchievements } from "./actions";
import { getCurrentUser } from "@/app/data/admin/get-current-user";
import { redirect } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SilentRefreshButton } from "@/components/ui/silent-refresh-button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Achievements",
  description: "View your achievements, attendance, tasks, events, and quiz results",
};

export default async function AchievementsPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  const result = await getUserAchievements(user.id);

  if (result.status === "error") {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            My Achievements
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your earned points and completed activities
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{result.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { attendance, tasks, events, quizzes, summary } = result.data;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            My Achievements
          </h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Track your earned points and completed activities
          </p>
        </div>
        <SilentRefreshButton toastMessage="Achievements refreshed silently" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Total Points
            </CardDescription>
            <CardTitle className="text-3xl">{summary.totalPoints}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Attendance
            </CardDescription>
            <CardTitle className="text-3xl">{attendance.totalPoints}</CardTitle>
            <p className="text-xs text-muted-foreground">{attendance.count} sessions</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Tasks
            </CardDescription>
            <CardTitle className="text-3xl">{tasks.totalPoints}</CardTitle>
            <p className="text-xs text-muted-foreground">{tasks.count} completed</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Events
            </CardDescription>
            <CardTitle className="text-3xl">{events.totalPoints}</CardTitle>
            <p className="text-xs text-muted-foreground">{events.count} participated</p>
          </CardHeader>
        </Card>
      </div>

      {/* Detailed Achievements */}
      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="attendance">
            <span className="hidden sm:inline">Attendance</span>
            <span className="sm:hidden">Attend.</span>
          </TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
        </TabsList>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance History</CardTitle>
              <CardDescription>
                Your attendance records and points earned
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attendance.items.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No attendance records yet</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Session</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Day</TableHead>
                        <TableHead className="text-right">Points</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendance.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.session.title}
                          </TableCell>
                          <TableCell>
                            {new Date(item.session.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.session.day}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="default">{item.points} pts</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Completed Tasks</CardTitle>
              <CardDescription>
                Your approved task submissions and points earned
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tasks.items.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No completed tasks yet</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Evaluated</TableHead>
                        <TableHead className="text-right">Points</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium">{item.task.title}</p>
                              {item.feedback && (
                                <p className="text-sm text-muted-foreground">
                                  {item.feedback}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.submittedAt
                              ? new Date(item.submittedAt).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {item.evaluatedAt
                              ? new Date(item.evaluatedAt).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="default">{item.pointsAwarded} pts</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Participations</CardTitle>
              <CardDescription>
                Your approved event participations and points earned
              </CardDescription>
            </CardHeader>
            <CardContent>
              {events.items.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No event participations yet</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Event Date</TableHead>
                        <TableHead>Evaluated</TableHead>
                        <TableHead className="text-right">Points</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium">{item.event.title}</p>
                              {item.feedback && (
                                <p className="text-sm text-muted-foreground">
                                  {item.feedback}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(item.event.eventDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {item.evaluatedAt
                              ? new Date(item.evaluatedAt).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="default">{item.pointsAwarded} pts</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quizzes Tab */}
        <TabsContent value="quizzes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Quiz Attempts</CardTitle>
              <CardDescription>
                Your completed quizzes and points earned
              </CardDescription>
            </CardHeader>
            <CardContent>
              {quizzes.items.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No quiz attempts yet</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Quiz</TableHead>
                        <TableHead>Set</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Correct</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead className="text-right">Points</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quizzes.items.map((item) => {
                        const setLetter = String.fromCharCode(64 + item.setNumber);
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.quiz.title}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">Set {setLetter}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  item.score >= 70
                                    ? "default"
                                    : item.score >= 50
                                    ? "secondary"
                                    : "destructive"
                                }
                              >
                                {item.score.toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {item.correctAnswers} / {item.totalQuestions}
                            </TableCell>
                            <TableCell>
                              {item.completedAt
                                ? new Date(item.completedAt).toLocaleDateString()
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="default">{item.pointsEarned} pts</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}