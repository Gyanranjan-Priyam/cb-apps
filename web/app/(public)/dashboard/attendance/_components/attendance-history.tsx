"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { getUserAttendanceHistory } from "../actions";
import { CheckCircle, Calendar, Trophy, QrCode } from "lucide-react";
import { SilentRefreshButton } from "@/components/ui/silent-refresh-button";

interface Attendance {
  id: string;
  status: string;
  points: number;
  markedAt: string;
  method: string;
  session: {
    sessionNumber: number;
    title: string;
    date: string;
    day: string;
  };
}

interface Stats {
  total: number;
  present: number;
  totalPoints: number;
}

export default function AttendanceHistory() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, present: 0, totalPoints: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    setLoading(true);
    const result = await getUserAttendanceHistory();
    
    if (result.success && result.attendances) {
      // Convert dates to strings for consistency
      const formattedAttendances = result.attendances.map(a => ({
        ...a,
        markedAt: a.markedAt.toISOString(),
        session: {
          ...a.session,
          date: a.session.date.toISOString(),
        },
      }));
      setAttendances(formattedAttendances);
      setStats(result.stats || { total: 0, present: 0, totalPoints: 0 });
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Sessions
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Attendance marked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Present
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? `${((stats.present / stats.total) * 100).toFixed(1)}% attendance` : "No data"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Points
            </CardTitle>
            <Trophy className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.totalPoints}</div>
            <p className="text-xs text-muted-foreground">
              Points earned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance History Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Attendance History</CardTitle>
              <CardDescription className="mt-1">
                View all your attendance records and points earned
              </CardDescription>
            </div>
            <SilentRefreshButton onRefresh={loadAttendance} toastMessage="Attendance records refreshed" />
          </div>
        </CardHeader>
        <CardContent>
          {attendances.length === 0 ? (
            <div className="text-center py-12">
              <QrCode className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Attendance Records</h3>
              <p className="text-sm text-muted-foreground">
                Scan QR codes to mark your attendance and see your records here
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Session #</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendances.map((attendance) => (
                    <TableRow key={attendance.id}>
                      <TableCell className="font-medium">
                        <Badge variant="outline">
                          #{attendance.session.sessionNumber}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {attendance.session.title}
                      </TableCell>
                      <TableCell>
                        {format(new Date(attendance.session.date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>{attendance.session.day}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            attendance.status === "present"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            attendance.status === "present"
                              ? "bg-green-600"
                              : ""
                          }
                        >
                          {attendance.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {attendance.method === "qr-scan" ? (
                            <>
                              <QrCode className="h-3 w-3 mr-1" />
                              QR Scan
                            </>
                          ) : (
                            "Manual"
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        +{attendance.points}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
