/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Mail, Calendar, CheckCircle2, XCircle, Award, Clock } from "lucide-react";
import Link from "next/link";
import { PublishResultButton } from "../_components/publish-result-button";
import { ExportResultPdfButton } from "../_components/export-result-pdf-button";
import { ScorecardPDFData } from "@/lib/student-result-pdf";
import { calculateQuizRankings } from "@/lib/quiz-ranking";

function findCorrectAnswerIndex(question: any): number {
  if (!question || !Array.isArray(question.options)) return -1;
  const options = question.options.map((opt: any) =>
    opt !== null && opt !== undefined ? String(opt).trim() : ""
  );

  // 1. Numeric index in correctAnswer or answer
  if (typeof question.correctAnswer === "number" && question.correctAnswer >= 0 && question.correctAnswer < options.length) {
    return question.correctAnswer;
  }
  if (typeof question.answer === "number" && question.answer >= 0 && question.answer < options.length) {
    return question.answer;
  }

  // 2. String target
  const rawTarget = question.correctAnswer !== undefined && question.correctAnswer !== null ? question.correctAnswer : question.answer;
  if (rawTarget === undefined || rawTarget === null) return -1;
  const targetStr = String(rawTarget).trim();

  // 3. Exact text match in options
  const exactIdx = options.findIndex((opt: string) => opt.toLowerCase() === targetStr.toLowerCase());
  if (exactIdx !== -1) return exactIdx;

  // 4. Numeric string ("0", "1", "2")
  const parsedNum = parseInt(targetStr, 10);
  if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum < options.length && String(parsedNum) === targetStr) {
    return parsedNum;
  }

  // 5. Letter key ("A", "B", "C", "D")
  if (targetStr.length === 1) {
    const letterIdx = targetStr.toUpperCase().charCodeAt(0) - 65;
    if (letterIdx >= 0 && letterIdx < options.length) {
      return letterIdx;
    }
  }

  return -1;
}

function parseUserAnswersMap(answersJsonRaw: string | null | undefined): Record<number, any> {
  const map: Record<number, any> = {};
  if (!answersJsonRaw) return map;

  try {
    const parsed = JSON.parse(answersJsonRaw);
    if (!parsed) return map;

    if (Array.isArray(parsed.answers)) {
      parsed.answers.forEach((ans: any, idx: number) => {
        const qIdx = typeof ans.questionIndex === "number" ? ans.questionIndex : idx;
        const aVal = ans.answerIndex !== undefined ? ans.answerIndex : ans.userAnswer;
        if (aVal !== undefined && aVal !== null) {
          map[qIdx] = aVal;
        }
      });
    } else if (typeof parsed.answers === "object" && parsed.answers !== null) {
      Object.entries(parsed.answers).forEach(([k, v]) => {
        const qIdx = parseInt(k, 10);
        if (!isNaN(qIdx) && v !== undefined && v !== null) {
          map[qIdx] = v;
        }
      });
    } else if (Array.isArray(parsed)) {
      parsed.forEach((ans: any, idx: number) => {
        const qIdx = typeof ans.questionIndex === "number" ? ans.questionIndex : idx;
        const aVal = ans.answerIndex !== undefined ? ans.answerIndex : ans.userAnswer ?? ans;
        if (aVal !== undefined && aVal !== null) {
          map[qIdx] = aVal;
        }
      });
    } else if (typeof parsed === "object") {
      Object.entries(parsed).forEach(([k, v]) => {
        if (k === "tabSwitches" || k === "submittedAt") return;
        const qIdx = parseInt(k, 10);
        if (!isNaN(qIdx) && v !== undefined && v !== null) {
          map[qIdx] = v;
        }
      });
    }
  } catch (e) {
    console.error("Error parsing answersJson:", e);
  }

  return map;
}

function resolveUserOptionIndex(rawAnswer: any, options: string[]): number {
  if (rawAnswer === undefined || rawAnswer === null) return -1;

  if (typeof rawAnswer === "number" && rawAnswer >= 0 && rawAnswer < options.length) {
    return rawAnswer;
  }

  const str = String(rawAnswer).trim();
  const parsedNum = parseInt(str, 10);
  if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum < options.length && String(parsedNum) === str) {
    return parsedNum;
  }

  const exactIdx = options.findIndex((opt) => String(opt).trim().toLowerCase() === str.toLowerCase());
  if (exactIdx !== -1) return exactIdx;

  if (str.length === 1) {
    const letterIdx = str.toUpperCase().charCodeAt(0) - 65;
    if (letterIdx >= 0 && letterIdx < options.length) {
      return letterIdx;
    }
  }

  return -1;
}

export default async function StudentResultDetailPage({
  params,
}: {
  params: Promise<{ quizId: string; attemptId: string }>;
}) {
  const { quizId, attemptId } = await params;

  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: true,
    },
  });

  if (!attempt) {
    notFound();
  }

  // Get student details (internal vs external)
  let studentName = attempt.participantName || "Participant";
  let studentEmail = attempt.participantEmail || "N/A";

  if (!attempt.participantName && attempt.userId && !attempt.userId.startsWith("ext_")) {
    const user = await prisma.user.findUnique({
      where: { id: attempt.userId },
      select: { name: true, email: true },
    });
    if (user) {
      studentName = user.name;
      studentEmail = user.email;
    }
  }

  // Parse questions & student answers
  const userAnswersMap = parseUserAnswersMap(attempt.answersJson);

  const setLetter = attempt.setNumber && attempt.setNumber >= 1 && attempt.setNumber <= 26
    ? String.fromCharCode(64 + attempt.setNumber)
    : "A";

  const { getQuestionsForShiftAndSet } = await import("@/app/admin/quizzes/utils");
  const questionsList = getQuestionsForShiftAndSet(attempt.quiz.questionsJson, attempt.shiftNumber || 1, setLetter);

  // Fetch all attempts of this quiz to compute competition rank
  const allQuizAttempts = await prisma.quizAttempt.findMany({
    where: { quizId: attempt.quizId },
  });

  const { rankMap, rankedDetailsMap } = calculateQuizRankings(allQuizAttempts);
  const overallRank = rankMap.get(attempt.id) || 1;
  const rankDetails = rankedDetailsMap.get(attempt.id);
  const isTied = rankDetails?.isTied || false;
  const submissionDate = rankDetails?.submissionDate || new Date(attempt.completedAt || attempt.createdAt);

  let isPassed = attempt.score >= 50;
  let statusLabel = isPassed ? "QUALIFIED / PASSED" : "FAILED / NOT QUALIFIED";

  const mode = attempt.quiz.cutoffType || "PERCENTAGE";
  if (mode === "TOP_N") {
    const topCount = attempt.quiz.topSelectCount || 10;
    isPassed = overallRank > 0 && overallRank <= topCount;
    const rankSuffix = isTied ? ` (Rank #${overallRank} Tied)` : ` (Rank #${overallRank})`;
    statusLabel = isPassed ? `QUALIFIED${rankSuffix}` : `FAILED${rankSuffix}`;
  } else if (mode === "MARKS") {
    const minMarks = attempt.quiz.cutoffMarks ?? 0;
    isPassed = (attempt.pointsEarned ?? 0) >= minMarks;
    statusLabel = isPassed ? `QUALIFIED (>= ${minMarks} pts)` : `FAILED (< ${minMarks} pts)`;
  } else {
    const minPercentage = attempt.quiz.cutoffMarks ?? 50;
    isPassed = (attempt.score ?? 0) >= minPercentage;
    statusLabel = isPassed ? `QUALIFIED (>= ${minPercentage}%)` : `FAILED (< ${minPercentage}%)`;
  }

  let tabSwitches = 0;
  try {
    if (attempt.answersJson) {
      const parsed = JSON.parse(attempt.answersJson);
      tabSwitches = parsed.tabSwitches || 0;
    }
  } catch {}

  const scorecardQuestions = questionsList.map((q: any, idx: number) => {
    const options: string[] = Array.isArray(q.options) ? q.options : [];
    const userOptionIdx = resolveUserOptionIndex(userAnswersMap[idx], options);
    const correctOptionIdx = findCorrectAnswerIndex(q);
    const isCorrect = userOptionIdx !== -1 && correctOptionIdx !== -1 && userOptionIdx === correctOptionIdx;

    return {
      questionIndex: idx,
      questionText: q.question || `Question ${idx + 1}`,
      options,
      userAnswerIndex: userOptionIdx,
      userAnswerText: userOptionIdx !== -1 ? options[userOptionIdx] : undefined,
      correctAnswerIndex: correctOptionIdx,
      correctAnswerText: correctOptionIdx !== -1 ? options[correctOptionIdx] : undefined,
      isCorrect,
    };
  });

  const scorecardPdfData: ScorecardPDFData = {
    studentName,
    studentEmail,
    quizTitle: attempt.quiz.title,
    quizId: attempt.quiz.quizId,
    setLetter,
    score: attempt.score,
    correctAnswers: attempt.correctAnswers,
    totalQuestions: attempt.totalQuestions,
    pointsEarned: attempt.pointsEarned,
    tabSwitches,
    submissionDate: attempt.createdAt,
    isPublished: attempt.isPublished,
    isPassed,
    statusLabel,
    questions: scorecardQuestions,
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-5xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="rounded-xl" asChild>
            <Link href={`/admin/quizzes/results/${attempt.quiz.quizId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Student Result: {studentName}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Detailed performance breakdown & scorecard export
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ExportResultPdfButton data={scorecardPdfData} />
          <PublishResultButton
            attemptId={attempt.id}
            isPublished={attempt.isPublished}
            publishedAt={attempt.publishedAt}
          />
        </div>
      </div>

      {/* Student Details Card */}
      <Card className="rounded-2xl border-border/60 shadow-lg">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <span>{studentName}</span>
              </CardTitle>
              <CardDescription className="text-xs mt-1 flex items-center gap-1.5 font-mono">
                <Mail className="h-3.5 w-3.5" />
                {studentEmail}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                Set {setLetter}
              </Badge>
              <Badge variant={attempt.isPublished ? "default" : "secondary"}>
                {attempt.isPublished ? "Result Published" : "Draft / Pending Release"}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
            <div className="p-4 rounded-xl border border-border/60 bg-card/40 flex flex-col items-center justify-center">
              <div className="text-xs text-muted-foreground font-semibold uppercase">Rank</div>
              <div className="text-3xl font-black mt-1 font-mono text-primary flex items-center gap-1 justify-center">
                #{overallRank}
              </div>
              <div className="mt-1">
                {isTied ? (
                  <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/40 bg-amber-500/10">
                    Tied
                  </Badge>
                ) : (
                  <span className="text-[11px] text-muted-foreground">of {allQuizAttempts.length}</span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border/60 bg-card/40">
              <div className="text-xs text-muted-foreground font-semibold uppercase">Score</div>
              <div className={`text-3xl font-black mt-1 ${isPassed ? "text-emerald-500" : "text-destructive"}`}>
                {attempt.score.toFixed(1)}%
              </div>
              <div className="mt-1">
                <Badge variant={isPassed ? "default" : "destructive"} className="text-xs">
                  {isPassed ? "Passed" : "Needs Improvement"}
                </Badge>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border/60 bg-card/40">
              <div className="text-xs text-muted-foreground font-semibold uppercase">Correct Answers</div>
              <div className="text-3xl font-black mt-1">
                {attempt.correctAnswers} / {attempt.totalQuestions}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Questions</div>
            </div>

            <div className="p-4 rounded-xl border border-border/60 bg-card/40">
              <div className="text-xs text-muted-foreground font-semibold uppercase">Points Awarded</div>
              <div className="text-3xl font-black text-amber-500 mt-1">{attempt.pointsEarned}</div>
              <div className="text-xs text-muted-foreground mt-1">Points</div>
            </div>

            <div className="p-4 rounded-xl border border-border/60 bg-card/40 col-span-2 sm:col-span-1">
              <div className="text-xs text-muted-foreground font-semibold uppercase">Submitted At</div>
              <div className="text-sm font-bold mt-2 font-mono">
                {submissionDate.toLocaleDateString()}
              </div>
              <div className="text-xs text-muted-foreground font-mono mt-0.5">
                {submissionDate.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Response Breakdown */}
      <Card className="rounded-2xl border-border/60 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Question-by-Question Answers</CardTitle>
          <CardDescription className="text-xs">
            Review full participant choices vs correct answer keys
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {questionsList.map((q: any, idx: number) => {
            const options: string[] = Array.isArray(q.options) ? q.options : [];
            const userOptionIdx = resolveUserOptionIndex(userAnswersMap[idx], options);
            const correctOptionIdx = findCorrectAnswerIndex(q);
            const isCorrect = userOptionIdx !== -1 && correctOptionIdx !== -1 && userOptionIdx === correctOptionIdx;

            return (
              <Card
                key={idx}
                className={`p-5 rounded-2xl border-2 transition-all ${
                  userOptionIdx === -1
                    ? "border-border/60 bg-card/40"
                    : isCorrect
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-destructive/30 bg-destructive/5"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="font-mono mt-0.5">
                        Q{idx + 1}
                      </Badge>
                      <h4 className="font-semibold text-base">{q.question}</h4>
                    </div>

                    {userOptionIdx === -1 ? (
                      <Badge variant="secondary" className="text-xs flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        Unattempted
                      </Badge>
                    ) : isCorrect ? (
                      <Badge variant="default" className="text-xs flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Correct
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs flex items-center gap-1">
                        <XCircle className="h-3.5 w-3.5" />
                        Incorrect
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 ml-9 pt-2">
                    {options.map((opt: string, optIdx: number) => {
                      const isUserChoice = userOptionIdx === optIdx;
                      const isRightOption = correctOptionIdx === optIdx;

                      let style = "border-border/60 bg-card/40 text-muted-foreground";
                      if (isRightOption) {
                        style = "border-emerald-500 bg-emerald-500/20 text-emerald-400 font-bold";
                      } else if (isUserChoice && !isRightOption) {
                        style = "border-destructive bg-destructive/20 text-destructive font-bold";
                      }

                      return (
                        <div key={optIdx} className={`p-3 rounded-xl border text-sm flex items-center justify-between transition-colors ${style}`}>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={isRightOption ? "default" : isUserChoice ? "destructive" : "outline"}
                              className="text-xs h-5 px-1.5 font-mono"
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </Badge>
                            <span className={isRightOption || isUserChoice ? "text-foreground font-semibold" : ""}>
                              {opt}
                            </span>
                          </div>

                          {isUserChoice && (
                            <Badge variant={isRightOption ? "default" : "destructive"} className="text-xs">
                              {isRightOption ? "Student Choice (Correct)" : "Student Choice"}
                            </Badge>
                          )}
                          {!isUserChoice && isRightOption && (
                            <Badge variant="outline" className="text-xs border-emerald-500 text-emerald-400">
                              Correct Key
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
