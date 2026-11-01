import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getQuizByQuizId } from "../../actions";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PublishResultButton } from "./_components/publish-result-button";
import { PublishAllResultsButton } from "./_components/publish-all-results-button";
import { ExportExcelButton } from "./_components/export-excel-button";
import { calculateQuizRankings } from "@/lib/quiz-ranking";

export default async function QuizResultsPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params;
  const result = await getQuizByQuizId(quizId);

  if (result.status === "error" || !result.data) {
    notFound();
  }

  const quiz = result.data;

  // Fetch all quiz attempts with user details
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      quizId: quiz.id,
    },
    include: {
      quiz: {
        select: {
          title: true,
          quizId: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Fetch user details for all attempts
  const userIds = [...new Set(attempts.map(a => a.userId))];
  const users = await prisma.user.findMany({
    where: {
      id: {
        in: userIds,
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  const userMap = new Map(users.map(u => [u.id, u]));

  // Calculate CBT Rankings (Primary: Marks desc, Secondary: Submission time asc, Equal marks & time = identical rank)
  const { sortedAttempts, rankMap, rankedDetailsMap } = calculateQuizRankings(attempts);

  // Evaluate candidate qualification status based on quiz cutoff settings
  const evaluateAttemptQualification = (attempt: { id: string; score: number; pointsEarned: number }) => {
    const rank = rankMap.get(attempt.id) || 1;
    const isTied = rankedDetailsMap.get(attempt.id)?.isTied || false;
    const mode = quiz.cutoffType || "PERCENTAGE";

    if (mode === "TOP_N") {
      const topCount = quiz.topSelectCount || 10;
      const isTop = rank <= topCount;
      const rankSuffix = isTied ? ` (Rank #${rank} Tied)` : ` (Rank #${rank})`;
      return {
        isQualified: isTop,
        statusText: isTop ? `Qualified (Top ${topCount})` : "Failed",
        statusLabel: isTop ? `QUALIFIED${rankSuffix}` : `FAILED${rankSuffix}`,
        variant: isTop ? "default" as const : "destructive" as const,
        rank,
        isTied,
      };
    }

    if (mode === "MARKS") {
      const minMarks = quiz.cutoffMarks !== null && quiz.cutoffMarks !== undefined ? quiz.cutoffMarks : 0;
      const isPassed = (attempt.pointsEarned ?? 0) >= minMarks;
      return {
        isQualified: isPassed,
        statusText: isPassed ? "Qualified" : "Failed",
        statusLabel: isPassed ? `QUALIFIED (>= ${minMarks} pts)` : `FAILED (< ${minMarks} pts)`,
        variant: isPassed ? "default" as const : "destructive" as const,
        rank,
        isTied,
      };
    }

    // Default: PERCENTAGE
    const minPercentage = quiz.cutoffMarks !== null && quiz.cutoffMarks !== undefined ? quiz.cutoffMarks : 50;
    const isPassed = (attempt.score ?? 0) >= minPercentage;
    return {
      isQualified: isPassed,
      statusText: isPassed ? "Qualified" : "Failed",
      statusLabel: isPassed ? `QUALIFIED (>= ${minPercentage}%)` : `FAILED (< ${minPercentage}%)`,
      variant: isPassed ? "default" as const : "destructive" as const,
      rank,
      isTied,
    };
  };

  // Map attempts to formatted list for export with rankings
  const rankedAttemptsData = sortedAttempts.map((attempt) => {
    const user = userMap.get(attempt.userId);
    const setLetter = attempt.setNumber && attempt.setNumber >= 1 && attempt.setNumber <= 26
      ? String.fromCharCode(64 + attempt.setNumber)
      : "A";

    let tabSwitches = 0;
    try {
      if (attempt.answersJson) {
        const parsed = JSON.parse(attempt.answersJson);
        tabSwitches = parsed.tabSwitches || 0;
      }
    } catch {}

    const qual = evaluateAttemptQualification(attempt);
    const details = rankedDetailsMap.get(attempt.id);

    return {
      id: attempt.id,
      participantName: attempt.participantName || user?.name || "Unknown User",
      participantEmail: attempt.participantEmail || user?.email || "N/A",
      shiftNumber: attempt.shiftNumber || 1,
      shiftName: attempt.shiftName || `Shift ${attempt.shiftNumber || 1}`,
      setLetter,
      score: attempt.score,
      correctAnswers: attempt.correctAnswers,
      totalQuestions: attempt.totalQuestions,
      pointsEarned: attempt.pointsEarned,
      status: attempt.completedAt ? "Completed" : "In Progress",
      tabSwitches,
      createdAt: attempt.createdAt,
      completedAt: attempt.completedAt,
      isPublished: attempt.isPublished,
      isQualified: qual.isQualified,
      resultStatus: qual.statusLabel,
      rank: qual.rank,
      isTied: details?.isTied || false,
    };
  });

  // Fetch set assignments
  const setAssignments = await prisma.quizSetAssignment.findMany({
    where: {
      quizId: quiz.id,
    },
    include: {
      quiz: {
        select: {
          questionsJson: true,
        },
      },
    },
  });

  // Fetch user details for assignments
  const assignmentUserIds = setAssignments.map(a => a.userId);
  const assignmentUsers = await prisma.user.findMany({
    where: {
      id: {
        in: assignmentUserIds,
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  const assignmentUserMap = new Map(assignmentUsers.map(u => [u.id, u]));

  // Calculate set distribution
  const setDistribution = setAssignments.reduce((acc, assignment) => {
    acc[assignment.assignedSet] = (acc[assignment.assignedSet] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate statistics
  const totalAttempts = attempts.length;
  const uniqueParticipants = userIds.length;
  const averageScore = totalAttempts > 0
    ? attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts
    : 0;
  const averageCorrect = totalAttempts > 0
    ? attempts.reduce((sum, a) => sum + a.correctAnswers, 0) / totalAttempts
    : 0;

  const totalQuestions = attempts[0]?.totalQuestions || 0;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/quizzes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Quiz Results
          </h1>
          <p className="text-muted-foreground mt-2">
            {quiz.title} ({quiz.quizId})
          </p>
        </div>
        <div className="flex items-center gap-2">
          {attempts.length > 0 && (
            <ExportExcelButton
              quizTitle={quiz.title}
              quizId={quiz.quizId}
              attempts={rankedAttemptsData}
            />
          )}
          <Button variant="outline" asChild>
            <Link href={`/admin/quizzes/${quiz.quizId}`}>
              View Quiz Details
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Attempts</CardDescription>
            <CardTitle className="text-3xl">{totalAttempts}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Unique Participants</CardDescription>
            <CardTitle className="text-3xl">{uniqueParticipants}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Score</CardDescription>
            <CardTitle className="text-3xl">
              {averageScore.toFixed(1)}%
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Correct Answers</CardDescription>
            <CardTitle className="text-3xl">
              {averageCorrect.toFixed(1)} {totalQuestions > 0 ? `/ ${totalQuestions}` : ""}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Set Distribution */}
      {Object.keys(setDistribution).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Set Distribution</CardTitle>
            <CardDescription>
              Number of students assigned to each question set
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {Object.entries(setDistribution).map(([set, count]) => (
                <div
                  key={set}
                  className="flex flex-col items-center justify-center p-4 border rounded-lg bg-card"
                >
                  <div className="text-2xl font-bold">Set {set}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {count} {count === 1 ? 'student' : 'students'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Set Assignments Table */}
      {setAssignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Set Assignments</CardTitle>
            <CardDescription>
              View which set is assigned to each participant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participant</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Assigned Set</TableHead>
                    <TableHead>Assigned Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {setAssignments.map((assignment) => {
                    const user = assignmentUserMap.get(assignment.userId);
                    const hasAttempted = attempts.some(
                      a => a.userId === assignment.userId && a.completedAt
                    );
                    
                    return (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">
                          {user?.name || 'Unknown User'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user?.email || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">Set {assignment.assignedSet}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(assignment.assignedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {hasAttempted ? (
                            <Badge variant="default">Completed</Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <div>
            <CardTitle>All Attempts ({attempts.length})</CardTitle>
            <CardDescription>
              Detailed results and rankings for all quiz attempts
            </CardDescription>
          </div>
          {attempts.length > 0 && (
            <div className="flex items-center gap-2">
              <ExportExcelButton
                quizTitle={quiz.title}
                quizId={quiz.quizId}
                attempts={rankedAttemptsData}
                variant="outline"
              />
              <PublishAllResultsButton quizId={quiz.id} />
            </div>
          )}
        </CardHeader>
        <CardContent>
          {attempts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No attempts recorded yet</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Rank</TableHead>
                    <TableHead>Participant</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Set</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Correct Answers</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Qualification</TableHead>
                    <TableHead>Submitted At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAttempts.map((attempt) => {
                    const user = userMap.get(attempt.userId);
                    const setLetter = attempt.setNumber && attempt.setNumber >= 1 && attempt.setNumber <= 26
                      ? String.fromCharCode(64 + attempt.setNumber)
                      : "A";
                    const qual = evaluateAttemptQualification(attempt);
                    const details = rankedDetailsMap.get(attempt.id);
                    const subDate = details?.submissionDate || new Date(attempt.completedAt || attempt.createdAt);

                    return (
                      <TableRow key={attempt.id}>
                        <TableCell className="font-bold text-center">
                          <div className="flex flex-col items-center gap-1">
                            <Badge
                              variant="outline"
                              className={`font-mono text-xs font-bold ${
                                qual.rank === 1
                                   ? "bg-amber-500/10 text-amber-500 border-amber-500/40"
                                  : qual.rank === 2
                                  ? "bg-slate-500/10 text-slate-400 border-slate-500/40"
                                  : qual.rank === 3
                                  ? "bg-amber-700/10 text-amber-700 border-amber-700/40"
                                  : ""
                              }`}
                            >
                              #{qual.rank}
                            </Badge>
                            {qual.isTied && (
                              <span className="text-[10px] text-amber-500/90 font-mono font-medium">
                                Tied
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {attempt.participantName || user?.name || "Unknown User"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground font-mono">
                          {attempt.participantEmail || user?.email || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-mono">
                            {attempt.shiftName || `Shift ${attempt.shiftNumber || 1}`}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">Set {setLetter}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={attempt.score >= 70 ? "default" : attempt.score >= 50 ? "secondary" : "destructive"}>
                            {attempt.score.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {attempt.correctAnswers} / {attempt.totalQuestions}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{attempt.pointsEarned} pts</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={qual.variant}>
                            {qual.statusText}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground font-mono">
                          <div>{subDate.toLocaleDateString()}</div>
                          <div className="text-[11px] text-muted-foreground/80">{subDate.toLocaleTimeString()}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-2">
                            <PublishResultButton
                              attemptId={attempt.id}
                              isPublished={attempt.isPublished}
                              publishedAt={attempt.publishedAt}
                              size="sm"
                            />
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/admin/quizzes/results/${quiz.quizId}/${attempt.id}`}>
                                View Details
                              </Link>
                            </Button>
                          </div>
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
    </div>
  );
}
