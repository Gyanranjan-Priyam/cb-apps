import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/app/data/admin/get-current-user";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Award, Clock, ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { ExportResultPdfButton } from "@/app/admin/quizzes/results/[quizId]/_components/export-result-pdf-button";
import { ScorecardPDFData } from "@/lib/student-result-pdf";
import { calculateQuizRankings } from "@/lib/quiz-ranking";

function findCorrectAnswerIndex(question: any): number {
  if (!question || !Array.isArray(question.options)) return -1;
  const options = question.options.map((opt: any) =>
    opt !== null && opt !== undefined ? String(opt).trim() : ""
  );

  if (typeof question.correctAnswer === "number" && question.correctAnswer >= 0 && question.correctAnswer < options.length) {
    return question.correctAnswer;
  }
  if (typeof question.answer === "number" && question.answer >= 0 && question.answer < options.length) {
    return question.answer;
  }

  const rawTarget = question.correctAnswer !== undefined && question.correctAnswer !== null ? question.correctAnswer : question.answer;
  if (rawTarget === undefined || rawTarget === null) return -1;
  const targetStr = String(rawTarget).trim();

  const exactIdx = options.findIndex((opt: string) => opt.toLowerCase() === targetStr.toLowerCase());
  if (exactIdx !== -1) return exactIdx;

  const parsedNum = parseInt(targetStr, 10);
  if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum < options.length && String(parsedNum) === targetStr) {
    return parsedNum;
  }

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

export default async function QuizResultsPage({ 
  params 
}: { 
  params: Promise<{ attemptId: string }> 
}) {
  const { attemptId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the quiz attempt
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: true,
    },
  });

  if (!attempt || attempt.userId !== user.id) {
    notFound();
  }

  // Parse the answers
  let tabSwitches = 0;
  if (attempt.answersJson) {
    try {
      const answersData = JSON.parse(attempt.answersJson);
      tabSwitches = answersData.tabSwitches || 0;
    } catch (e) {
      console.error("Error parsing answers:", e);
    }
  }

  const userAnswersMap = parseUserAnswersMap(attempt.answersJson);

  let questionsData: any = {};
  const setLetter = attempt.setNumber && attempt.setNumber >= 0 && attempt.setNumber <= 25
    ? String.fromCharCode(65 + attempt.setNumber)
    : "A";

  const { getQuestionsForShiftAndSet } = await import("@/app/admin/quizzes/utils");
  const questions = getQuestionsForShiftAndSet(attempt.quiz.questionsJson, attempt.shiftNumber || 1, setLetter);

  // Build detailed results
  const detailedResults = questions.map((question: any, idx: number) => {
    const options: string[] = Array.isArray(question.options) ? question.options : [];
    const userOptionIdx = resolveUserOptionIndex(userAnswersMap[idx], options);
    const correctOptionIdx = findCorrectAnswerIndex(question);
    const isCorrect = userOptionIdx !== -1 && correctOptionIdx !== -1 && userOptionIdx === correctOptionIdx;
    
    return {
      questionIndex: idx,
      question: question.question,
      userAnswer: userOptionIdx,
      correctAnswer: correctOptionIdx,
      isCorrect,
      options,
    };
  });

  const scorecardQuestions = questions.map((q: any, idx: number) => {
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

  // Fetch all attempts for this quiz to calculate competition ranking
  const allAttempts = await prisma.quizAttempt.findMany({
    where: { quizId: attempt.quizId },
  });

  const { rankMap, rankedDetailsMap } = calculateQuizRankings(allAttempts);
  const studentRank = rankMap.get(attempt.id) || 1;
  const rankDetails = rankedDetailsMap.get(attempt.id);
  const isTied = rankDetails?.isTied || false;
  const exactSubmissionDate = rankDetails?.submissionDate || new Date(attempt.completedAt || attempt.createdAt);

  const scorecardPdfData: ScorecardPDFData = {
    studentName: user.name || "Student",
    studentEmail: user.email || "",
    quizTitle: attempt.quiz.title,
    quizId: attempt.quiz.quizId,
    setLetter,
    score: attempt.score,
    correctAnswers: attempt.correctAnswers,
    totalQuestions: attempt.totalQuestions,
    pointsEarned: attempt.pointsEarned,
    tabSwitches,
    submissionDate: exactSubmissionDate,
    isPublished: attempt.isPublished,
    statusLabel: attempt.isPublished ? (isTied ? `Rank #${studentRank} (Tied)` : `Rank #${studentRank}`) : undefined,
    questions: scorecardQuestions,
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Quiz Results
          </h1>
          <p className="text-muted-foreground mt-1">
            {attempt.quiz.title}
          </p>
        </div>
        <div>
          <ExportResultPdfButton data={scorecardPdfData} />
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Performance</CardTitle>
            <div className="flex items-center gap-2">
              {attempt.isPublished && (
                <Badge variant="outline" className="font-mono text-sm border-amber-500/40 text-amber-500 bg-amber-500/10">
                  Rank #{studentRank} {isTied ? "(Tied)" : ""}
                </Badge>
              )}
              <Badge variant={attempt.score >= 70 ? "default" : "secondary"} className="text-lg px-4 py-1">
                {attempt.score}%
              </Badge>
            </div>
          </div>
          <CardDescription>
            Submitted on {exactSubmissionDate.toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Summary */}
          <div className={`grid gap-4 ${attempt.isPublished ? "grid-cols-2 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-4"}`}>
            {attempt.isPublished && (
              <div className="text-center p-4 bg-muted rounded-lg flex flex-col items-center justify-center">
                <p className="text-sm text-muted-foreground">Rank</p>
                <p className="text-3xl font-black text-primary font-mono">#{studentRank}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {isTied ? "Tied Position" : `of ${allAttempts.length}`}
                </p>
              </div>
            )}
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Score</p>
              <p className="text-3xl font-bold text-primary">{attempt.score}%</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Correct</p>
              <p className="text-3xl font-bold text-green-600">{attempt.correctAnswers}</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-3xl font-bold">{attempt.totalQuestions}</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Points</p>
              <p className="text-3xl font-bold text-primary">{attempt.pointsEarned}</p>
            </div>
          </div>

          {tabSwitches > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Note:</strong> {tabSwitches} violation{tabSwitches !== 1 ? 's' : ''} detected during the quiz.
              </AlertDescription>
            </Alert>
          )}

          {/* Quiz Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center justify-between text-sm p-3 bg-muted rounded-lg">
              <span className="text-muted-foreground">Quiz Set:</span>
              <span className="font-medium">Set {setLetter}</span>
            </div>
            <div className="flex items-center justify-between text-sm p-3 bg-muted rounded-lg">
              <span className="text-muted-foreground">Points Per Question:</span>
              <span className="font-medium">{attempt.quiz.pointsPerQuestion}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      {detailedResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Answer Review</CardTitle>
            <CardDescription>
              Review your answers and see the correct solutions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {detailedResults.map((result, index) => (
                <div 
                  key={result.questionIndex} 
                  className={`p-4 rounded-lg border-2 ${
                    result.isCorrect 
                      ? 'border-green-600 bg-green-600/5' 
                      : 'border-red-600 bg-red-600/5'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      result.isCorrect 
                        ? 'bg-green-600 text-white' 
                        : 'bg-red-600 text-white'
                    }`}>
                      {result.isCorrect ? '✓' : '✗'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">Question {result.questionIndex + 1}</h4>
                        <Badge variant={result.isCorrect ? "default" : "destructive"}>
                          {result.isCorrect ? 'Correct' : 'Incorrect'}
                        </Badge>
                      </div>
                      <p className="text-sm mb-3">{result.question}</p>
                      
                      <div className="space-y-2">
                        {result.options.map((option: string, oIndex: number) => {
                          const isUserAnswer = result.userAnswer === oIndex;
                          const isCorrectAnswer = result.correctAnswer === oIndex;
                          
                          return (
                            <div 
                              key={oIndex}
                              className={`p-3 rounded-lg border text-sm ${
                                isCorrectAnswer
                                  ? 'border-green-600 bg-green-600/10'
                                  : isUserAnswer && !result.isCorrect
                                  ? 'border-red-600 bg-red-600/10'
                                  : 'border-muted bg-background'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{String.fromCharCode(65 + oIndex)}.</span>
                                <span className="flex-1">{option}</span>
                                {isCorrectAnswer && (
                                  <Badge variant="outline" className="border-green-600 text-green-600 text-xs">
                                    Correct Answer
                                  </Badge>
                                )}
                                {isUserAnswer && !result.isCorrect && (
                                  <Badge variant="outline" className="border-red-600 text-red-600 text-xs">
                                    Your Answer
                                  </Badge>
                                )}
                                {isUserAnswer && result.isCorrect && (
                                  <Badge variant="outline" className="border-green-600 text-green-600 text-xs">
                                    Your Answer
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {!result.isCorrect && (
                        <div className="mt-3 p-2 bg-muted rounded text-xs">
                          <span className="text-muted-foreground">
                            You selected: <strong>{String.fromCharCode(65 + result.userAnswer)}</strong> | 
                            Correct answer: <strong>{String.fromCharCode(65 + result.correctAnswer)}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Button */}
      <Card>
        <CardContent className="p-6">
          <Button 
            asChild
            className="w-full"
            size="lg"
          >
            <Link href="/dashboard/activities/quizzes">
              Back to Quizzes
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
