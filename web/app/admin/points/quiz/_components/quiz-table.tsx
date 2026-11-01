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
import { Eye, Calendar, Users, Award } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

interface QuizAttempt {
  id: string;
  userId: string;
  pointsEarned: number;
}

interface Quiz {
  id: string;
  quizId: string;
  title: string;
  description: string;
  sets: number;
  duration: number;
  pointsPerQuestion: number;
  startDateTime: Date | null;
  endDateTime: Date | null;
  isActive: boolean;
  createdAt: Date;
  attempts: QuizAttempt[];
  _count: {
    attempts: number;
  };
}

interface QuizTableProps {
  quizzes: Quiz[];
}

export default function QuizTable({ quizzes }: QuizTableProps) {
  const router = useRouter();

  if (quizzes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No quizzes found. Create a quiz to get started.</p>
      </div>
    );
  }

  const calculateTotalPoints = (attempts: QuizAttempt[]) => {
    return attempts.reduce((sum, attempt) => sum + attempt.pointsEarned, 0);
  };

  const getUniqueParticipants = (attempts: QuizAttempt[]) => {
    const uniqueUsers = new Set(attempts.map(a => a.userId));
    return uniqueUsers.size;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Quiz ID</TableHead>
            <TableHead>Title</TableHead>
            <TableHead className="hidden md:table-cell">Sets</TableHead>
            <TableHead className="hidden md:table-cell">Duration</TableHead>
            <TableHead className="hidden lg:table-cell">Points/Q</TableHead>
            <TableHead className="hidden lg:table-cell">Participants</TableHead>
            <TableHead className="hidden xl:table-cell">Total Points</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quizzes.map((quiz) => {
            const isScheduled = quiz.startDateTime && quiz.endDateTime;
            const isActive = quiz.isActive && (!quiz.endDateTime || new Date(quiz.endDateTime) > new Date());
            const totalPoints = calculateTotalPoints(quiz.attempts);
            const participants = getUniqueParticipants(quiz.attempts);

            return (
              <TableRow key={quiz.id}>
                <TableCell className="font-mono text-xs">
                  {quiz.quizId.split("-").pop()?.substring(0, 8)}...
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{quiz.title}</span>
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      {quiz._count.attempts} attempt{quiz._count.attempts !== 1 ? "s" : ""}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="outline">{quiz.sets} Set{quiz.sets > 1 ? "s" : ""}</Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{quiz.duration} min</span>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex items-center gap-1">
                    <Award className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{quiz.pointsPerQuestion}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{participants}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <Badge variant="secondary" className="font-mono">
                    {totalPoints} pts
                  </Badge>
                </TableCell>
                <TableCell>
                  {isActive ? (
                    <Badge variant="default">Active</Badge>
                  ) : quiz.endDateTime && new Date(quiz.endDateTime) < new Date() ? (
                    <Badge variant="secondary">Ended</Badge>
                  ) : (
                    <Badge variant="outline">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/admin/points/quiz/${quiz.quizId}`)}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">View Points</span>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
