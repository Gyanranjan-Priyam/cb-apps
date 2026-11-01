import { notFound, redirect } from "next/navigation";
import { getAttendanceSessionByNumber, getAllMembers, getSessionAttendance } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Layers } from "lucide-react";
import { format } from "date-fns";
import MemberAttendanceList from "./_components/member-attendance-list";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface PageProps {
  params: Promise<{
    sessionNumber: string;
  }>;
}

export default async function SessionDetailPage({ params }: PageProps) {
  const { sessionNumber } = await params;
  const sessionNum = parseInt(sessionNumber, 10);

  if (isNaN(sessionNum)) {
    notFound();
  }

  const result = await getAttendanceSessionByNumber(sessionNum);

  if (result.status === "error" || !result.data) {
    notFound();
  }

  const session = result.data;

  // Get target batches details if restricted
  const targetBatches =
    session.targetBatchIds && session.targetBatchIds.length > 0
      ? await prisma.batch.findMany({
          where: { id: { in: session.targetBatchIds } },
          select: { id: true, name: true, code: true },
        })
      : [];

  // Get current admin user
  const authSession = await auth.api.getSession({
    headers: await headers(),
  });

  if (!authSession?.user?.id) {
    redirect("/login");
  }

  // Fetch members for this session (filtered by batch if restricted)
  const membersResult = await getAllMembers(session.targetBatchIds);
  const members = membersResult.status === "success" ? membersResult.data : [];

  // Fetch attendance data for this session
  const attendanceResult = await getSessionAttendance(session.id);
  const initialAttendance = attendanceResult.status === "success" ? attendanceResult.data : {};

  // Calculate attendance statistics
  const totalMembers = members.length;
  const presentCount = Object.values(initialAttendance).filter(status => status === "present").length;
  const absentCount = Object.values(initialAttendance).filter(status => status === "absent").length;
  const pendingCount = totalMembers - presentCount - absentCount;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Session #{session.sessionNumber}
          </h1>
          <Badge variant="secondary" className="text-base">
            {session.day}
          </Badge>
          {targetBatches.length > 0 ? (
            targetBatches.map((b) => (
              <Badge key={b.id} variant="default" className="text-sm font-mono flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                <span>Batch: {b.code}</span>
              </Badge>
            ))
          ) : (
            <Badge variant="outline" className="text-sm text-muted-foreground flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              <span>All Batches (Global)</span>
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          View attendance session details and manage member attendance
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Session Information</CardTitle>
            <CardDescription>Basic details about this session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Session Title</p>
                <p className="text-lg font-semibold">{session.title}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-full bg-amber-500/10 p-2">
                <Layers className="h-4 w-4 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Target Batch</p>
                {targetBatches.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {targetBatches.map((b) => (
                      <Badge key={b.id} variant="default" className="font-mono">
                        {b.name} ({b.code})
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-base font-semibold">All Batches (Open to all students)</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-full bg-blue-500/10 p-2">
                <Clock className="h-4 w-4 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Date & Day</p>
                <p className="text-lg font-semibold">
                  {format(new Date(session.date), "MMMM dd, yyyy")}
                </p>
                <p className="text-sm text-muted-foreground">{session.day}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-full bg-green-500/10 p-2">
                <User className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Created Date</p>
                <p className="text-lg font-semibold">
                  {format(new Date(session.createdAt), "MMMM dd, yyyy")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(session.createdAt), "hh:mm a")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Statistics</CardTitle>
            <CardDescription>Member attendance for this session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-3xl font-bold text-green-600">{presentCount}</p>
                <p className="text-sm text-green-600 font-medium">Present</p>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-3xl font-bold text-red-600">{absentCount}</p>
                <p className="text-sm text-red-600 font-medium">Absent</p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
              <p className="text-sm text-yellow-600 font-medium">Pending</p>
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Members</span>
                <span className="text-lg font-semibold">{totalMembers}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-muted-foreground">Attendance Rate</span>
                <span className="text-lg font-semibold">
                  {totalMembers > 0 ? Math.round((presentCount / totalMembers) * 100) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Member Attendance</CardTitle>
          <CardDescription>List of members and their attendance status</CardDescription>
        </CardHeader>
        <CardContent>
          <MemberAttendanceList 
            members={members} 
            sessionId={session.id}
            sessionTitle={`Session #${session.sessionNumber}: ${session.title}`}
            initialAttendance={initialAttendance}
            adminId={authSession.user.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
