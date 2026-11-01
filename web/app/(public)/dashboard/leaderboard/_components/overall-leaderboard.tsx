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
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";
import { LeaderboardEntry, getOverallLeaderboard } from "../actions";
import { initSocket, joinRoom, onSocketEvent } from "@/lib/socket-client";

interface OverallLeaderboardProps {
  data: LeaderboardEntry[];
  batchId?: string | null;
}

export default function OverallLeaderboard({
  data: initialData,
  batchId,
}: OverallLeaderboardProps) {
  const [data, setData] = useState<LeaderboardEntry[]>(initialData);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // Real-time Socket.IO synchronization on every point update
  useEffect(() => {
    let cleanupRoom: (() => void) | undefined;
    let cleanupListener: (() => void) | undefined;

    initSocket().then((socket) => {
      if (!socket) return;

      cleanupRoom = joinRoom("leaderboard");

      cleanupListener = onSocketEvent("leaderboard-updated", async () => {
        try {
          const res = await getOverallLeaderboard(batchId);
          if (res.status === "success" && res.data) {
            setData(res.data);
          }
        } catch (err) {
          console.debug("Silent leaderboard re-fetch error:", err);
        }
      });
    });

    return () => {
      cleanupListener?.();
      cleanupRoom?.();
    };
  }, [batchId]);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
        <p className="text-muted-foreground">
          No points data available yet
        </p>
        <p className="text-sm text-muted-foreground">
          Start earning points for attendance, tasks, or events to see the leaderboard
        </p>
        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-medium text-[11px]">Real-time Live Sync Active</span>
        </div>
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return null;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">1st</Badge>;
      case 2:
        return <Badge className="bg-gray-400 hover:bg-gray-500">2nd</Badge>;
      case 3:
        return <Badge className="bg-amber-600 hover:bg-amber-700">3rd</Badge>;
      default:
        return <Badge variant="outline">{rank}th</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Real-time live status indicator */}
      <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-2 bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-[11px] tracking-wide uppercase">Live Sync Active</span>
        </div>
        <span className="text-[11px] text-muted-foreground">
          Auto-updates via Socket.IO on every point
        </span>
      </div>
      {/* Top 3 Podium */}
      {data.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* 2nd Place */}
          <div className="flex flex-col items-center justify-end">
            <Medal className="h-8 w-8 text-gray-400 mb-2" />
            <div className="text-center">
              <p className="font-semibold text-sm truncate">{data[1].userName}</p>
              <p className="text-2xl font-bold text-gray-400">{data[1].totalPoints}</p>
              <p className="text-xs text-muted-foreground">points</p>
            </div>
            <div className="w-full bg-gray-200 h-20 mt-2 rounded-t-lg flex items-center justify-center">
              <Badge className="bg-gray-400">2nd</Badge>
            </div>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center justify-end">
            <Trophy className="h-10 w-10 text-yellow-500 mb-2" />
            <div className="text-center">
              <p className="font-semibold truncate">{data[0].userName}</p>
              <p className="text-3xl font-bold text-yellow-500">{data[0].totalPoints}</p>
              <p className="text-xs text-muted-foreground">points</p>
            </div>
            <div className="w-full bg-yellow-200 h-28 mt-2 rounded-t-lg flex items-center justify-center">
              <Badge className="bg-yellow-500">1st</Badge>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center justify-end">
            <Award className="h-8 w-8 text-amber-600 mb-2" />
            <div className="text-center">
              <p className="font-semibold text-sm truncate">{data[2].userName}</p>
              <p className="text-2xl font-bold text-amber-600">{data[2].totalPoints}</p>
              <p className="text-xs text-muted-foreground">points</p>
            </div>
            <div className="w-full bg-amber-200 h-16 mt-2 rounded-t-lg flex items-center justify-center">
              <Badge className="bg-amber-600">3rd</Badge>
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Rank</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Registration</TableHead>
              <TableHead className="text-center">Attendance</TableHead>
              <TableHead className="text-center">Tasks</TableHead>
              <TableHead className="text-center">Events</TableHead>
              <TableHead className="text-center">Quizzes</TableHead>
              <TableHead className="text-right">Total Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((entry, index) => {
              const rank = index + 1;
              return (
                <TableRow key={entry.userId} className={rank <= 3 ? "bg-muted/30" : ""}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getRankIcon(rank)}
                      {getRankBadge(rank)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{entry.userName}</TableCell>
                  <TableCell>
                    {entry.batch ? (
                      <Badge variant="outline" className="text-[10px] font-mono bg-primary/5 text-primary border-primary/20">
                        {entry.batch.code}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {entry.registration || (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-semibold">{entry.attendancePoints}</span>
                      <span className="text-xs text-muted-foreground">
                        ({entry.sessionsAttended} sessions)
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-semibold">{entry.taskPoints}</span>
                      <span className="text-xs text-muted-foreground">
                        ({entry.tasksCompleted} tasks)
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-semibold">{entry.eventPoints}</span>
                      <span className="text-xs text-muted-foreground">
                        ({entry.eventsParticipated} events)
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-semibold">{entry.quizPoints}</span>
                      <span className="text-xs text-muted-foreground">
                        ({entry.quizzesTaken} quizzes)
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-bold text-lg">{entry.totalPoints}</span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
