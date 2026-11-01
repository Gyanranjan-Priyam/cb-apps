/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Clock,
  AlertTriangle,
  Eye,
  EyeOff,
  User as UserIcon,
  Mail,
  IdCard,
  BookOpen,
  Award,
  Timer,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { submitExternalQuizAttempt } from "@/app/admin/quizzes/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { getQuestionsForShiftAndSet } from "@/app/admin/quizzes/utils";

interface Quiz {
  id: string;
  quizId: string;
  title: string;
  description: string;
  sets: number;
  duration: number;
  pointsPerQuestion: number;
  questionsJson: string;
  shift?: number;
  shiftName?: string;
  feedbackFormId?: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  registration?: string | null;
  username?: string | null;
}

interface Question {
  id: number;
  question: string;
  options: string[];
  answer: string;
}

interface ExternalQuizInterfaceProps {
  quiz: Quiz;
  user: User;
  assignedSet: string;
  systemCode: string;
  isCompleted?: boolean;
}

type QuizStep =
  | "user-info"
  | "quiz-details"
  | "quiz-started"
  | "quiz-submitted";

export default function ExternalQuizInterface({
  quiz,
  user,
  assignedSet,
  systemCode,
  isCompleted = false,
}: ExternalQuizInterfaceProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<QuizStep>(
    isCompleted ? "quiz-submitted" : "user-info",
  );
  const [selectedSet] = useState<string>(assignedSet);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [fullscreenWarningTimer, setFullscreenWarningTimer] = useState(10);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedMessageTimer, setBlockedMessageTimer] = useState(5);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const blockedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(quiz.duration * 60);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    pointsEarned: number;
    tabSwitches: number;
  } | null>(null);

  const getQuestionCount = (set: string) => {
    const list = getQuestionsForShiftAndSet(
      quiz.questionsJson,
      quiz.shift || 1,
      set,
    );
    return Array.isArray(list) ? list.length : 0;
  };

  // Load questions for the assigned shift and set when quiz starts
  useEffect(() => {
    if (currentStep === "quiz-started" && selectedSet) {
      const questionsForSet = getQuestionsForShiftAndSet(
        quiz.questionsJson,
        quiz.shift || 1,
        selectedSet,
      );
      if (Array.isArray(questionsForSet)) {
        setQuestions(questionsForSet as Question[]);
      }
    }
  }, [currentStep, selectedSet, quiz.questionsJson, quiz.shift]);

  // Timer countdown
  useEffect(() => {
    if (currentStep !== "quiz-started") return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        if (prev === 300) {
          setShowWarning(true);
          setTimeout(() => setShowWarning(false), 5000);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentStep]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isTimeLow = timeRemaining <= 300 && timeRemaining > 0;

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: answerIndex }));
  };

  const handleSubmitQuiz = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const currentQuestions =
        questions.length > 0
          ? questions
          : getQuestionsForShiftAndSet(
              quiz.questionsJson,
              quiz.shift || 1,
              selectedSet,
            );
      let correctCount = 0;

      // Build answer map: questionIndex -> selected option string
      const answersStringMap: Record<string, string> = {};
      currentQuestions.forEach((q: any, idx: number) => {
        const selectedOptionIndex = answers[idx];
        if (selectedOptionIndex !== undefined) {
          const selectedOption = q.options[selectedOptionIndex] || "";
          answersStringMap[q.id.toString()] = selectedOption;
          if (selectedOption.trim() === (q.answer || "").trim()) {
            correctCount++;
          }
        }
      });

      const totalQ = currentQuestions.length;
      const score = totalQ > 0 ? (correctCount / totalQ) * 100 : 0;
      const points = correctCount * quiz.pointsPerQuestion;

      const res = await submitExternalQuizAttempt({
        systemCode,
        answersJson: JSON.stringify(answersStringMap),
        totalQuestions: totalQ,
        correctAnswers: correctCount,
        score,
        pointsEarned: points,
        setNumber: selectedSet.charCodeAt(0) - 64,
      });

      if (res.status === "success") {
        setSubmissionResult({
          score: Math.round(score * 10) / 10,
          correctAnswers: correctCount,
          totalQuestions: totalQ,
          pointsEarned: points,
          tabSwitches,
        });
        setCurrentStep("quiz-submitted");
      } else {
        toast.error(res.message || "Failed to submit quiz. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast.error(
        "An error occurred while submitting the quiz. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleJumpToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const currentQuestion = questions[currentQuestionIndex];

  // Tab switching / visibility monitoring
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && currentStep === "quiz-started" && !isBlocked) {
        setTabSwitches((prev) => {
          const newCount = prev + 1;

          if (newCount >= 3) {
            setIsBlocked(true);
            setShowWarning(true);
          } else {
            setShowWarning(true);
            setTimeout(() => setShowWarning(false), 5000);
          }

          return newCount;
        });
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentStep === "quiz-started") {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (currentStep === "quiz-started") e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentStep === "quiz-started") {
        if (
          e.key === "F12" ||
          (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J")) ||
          (e.ctrlKey && e.key === "u")
        ) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentStep, isBlocked]);

  // Request / exit fullscreen helpers
  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch (error) {
      console.error("Failed to enter fullscreen:", error);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    } catch (error) {
      console.error("Failed to exit fullscreen:", error);
    }
  };

  // Monitor fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);

      if (
        !document.fullscreenElement &&
        currentStep === "quiz-started" &&
        !isBlocked &&
        !showFullscreenWarning
      ) {
        setShowFullscreenWarning(true);
        setFullscreenWarningTimer(10);
      } else if (document.fullscreenElement && showFullscreenWarning) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setShowFullscreenWarning(false);
        setFullscreenWarningTimer(10);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [currentStep, isBlocked, showFullscreenWarning]);

  // Fullscreen warning countdown
  useEffect(() => {
    if (showFullscreenWarning && fullscreenWarningTimer > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setFullscreenWarningTimer((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            setTabSwitches((prevCount) => prevCount + 1);
            setIsBlocked(true);
            setShowFullscreenWarning(false);
            setShowWarning(false);
            setBlockedMessageTimer(5);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [showFullscreenWarning]);

  // Blocked message countdown
  useEffect(() => {
    if (isBlocked && blockedMessageTimer > 0) {
      blockedTimerRef.current = setInterval(() => {
        setBlockedMessageTimer((prev) => {
          if (prev <= 1) {
            if (blockedTimerRef.current) {
              clearInterval(blockedTimerRef.current);
              blockedTimerRef.current = null;
            }
            setTimeout(() => {
              router.push("/system-register");
            }, 100);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (blockedTimerRef.current) {
        clearInterval(blockedTimerRef.current);
        blockedTimerRef.current = null;
      }
    };
  }, [isBlocked]);

  const handleStartQuiz = () => {
    enterFullscreen();
    setCurrentStep("quiz-started");
  };

  // ── Step 1: User Information ──
  if (currentStep === "user-info") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-background to-muted">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 p-1 flex items-center justify-center shrink-0 shadow-xs">
                <Image
                  src="/assets/logo.png"
                  alt="CodeBreakers Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-xs font-bold text-primary uppercase tracking-widest">
                CodeBreakers
              </span>
            </div>
            <CardTitle className="text-2xl">Verify Your Information</CardTitle>
            <CardDescription>
              Please confirm your details before proceeding to the quiz
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <UserIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Full Name</p>
                  <p className="font-medium">{user.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Email Address</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>

              {user.registration && (
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <IdCard className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">
                      Assigned System / Kiosk
                    </p>
                    <p className="font-medium">{user.registration}</p>
                  </div>
                </div>
              )}
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                If any of the above information is incorrect, please contact
                your administrator before proceeding.
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => setCurrentStep("quiz-details")}
              className="w-full text-lg py-6 cursor-pointer bg-primary hover:bg-primary/90 text-white"
              size="lg"
            >
              Continue to Quiz Details
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Step 2: Quiz Details ──
  if (currentStep === "quiz-details") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-background to-muted">
        <Card className="max-w-3xl w-full">
          <CardHeader>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 p-1 flex items-center justify-center shrink-0 shadow-xs">
                <Image
                  src="/assets/logo.png"
                  alt="CodeBreakers Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-xs font-bold text-primary uppercase tracking-widest">
                CodeBreakers
              </span>
            </div>
            <CardTitle className="text-2xl">{quiz.title}</CardTitle>
            <CardDescription>{quiz.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg border border-primary/20">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    Duration
                  </p>
                  <p className="font-bold text-foreground">
                    {quiz.duration} minutes
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Award className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Points per Question
                  </p>
                  <p className="font-semibold">
                    {quiz.pointsPerQuestion} points
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <BookOpen className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Assigned Set</p>
                  <p className="font-semibold">Set {selectedSet}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <IdCard className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Questions</p>
                  <p className="font-semibold">
                    {getQuestionCount(selectedSet)} questions
                  </p>
                </div>
              </div>
            </div>

            {/* Assigned Set Info */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Your Assigned Set</label>
              <div className="p-6 border-2 border-primary bg-primary/10 rounded-lg">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">
                    Set {selectedSet}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This set has been assigned to you by the administrator
                  </p>
                  <div className="text-xs text-muted-foreground mt-2">
                    {getQuestionCount(selectedSet)} question
                    {getQuestionCount(selectedSet) !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm">
                  <strong>Total Points:</strong> {getQuestionCount(selectedSet)}{" "}
                  questions × {quiz.pointsPerQuestion} points ={" "}
                  <strong>
                    {getQuestionCount(selectedSet) * quiz.pointsPerQuestion}{" "}
                    points
                  </strong>
                </p>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important Instructions:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>The quiz will open in fullscreen mode</li>
                  <li>Do not switch tabs or exit fullscreen during the quiz</li>
                  <li>Any suspicious activity will be recorded</li>
                  <li>You cannot pause the quiz once started</li>
                  <li>Make sure you have a stable internet connection</li>
                  <li>Your set has been assigned by the administrator</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button
                onClick={() => setCurrentStep("user-info")}
                variant="outline"
                className="flex-1 cursor-pointer"
                size="lg"
              >
                Back
              </Button>
              <Button
                onClick={handleStartQuiz}
                className="flex-1 bg-green-600 cursor-pointer hover:bg-green-700 text-white text-lg py-6"
                size="lg"
              >
                Start Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Step 4: Quiz Submitted ──
  if (currentStep === "quiz-submitted" && submissionResult) {
    return (
      <div className="min-h-screen bg-linear-to-br from-background to-muted p-4 py-8">
        <div className="container mx-auto max-w-4xl space-y-6">
          <Card>
            <CardHeader className="text-center">
              <div className="flex flex-col items-center mb-2">
                <div className="w-14 h-14 rounded-2xl bg-muted/60 p-2 border flex items-center justify-center mb-2">
                  <Image
                    src="/assets/logo.png"
                    alt="CodeBreakers Logo"
                    width={48}
                    height={48}
                    className="w-full h-full object-contain"
                    priority
                  />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-primary">
                  CodeBreakers
                </span>
              </div>
              <div className="flex justify-center mb-3">
                <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl">Quiz Completed!</CardTitle>
              <CardDescription className="text-base mt-2">
                Your answers have been submitted and recorded
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 bg-muted rounded-lg">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold">Your Results</h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-background rounded-lg">
                    <p className="text-sm text-muted-foreground">Score</p>
                    <p className="text-3xl font-bold text-primary">
                      {submissionResult.score}%
                    </p>
                  </div>
                  <div className="text-center p-4 bg-background rounded-lg">
                    <p className="text-sm text-muted-foreground">Correct</p>
                    <p className="text-3xl font-bold text-green-600">
                      {submissionResult.correctAnswers}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-background rounded-lg">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-3xl font-bold">
                      {submissionResult.totalQuestions}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-background rounded-lg">
                    <p className="text-sm text-muted-foreground">Points</p>
                    <p className="text-3xl font-bold text-primary">
                      {submissionResult.pointsEarned}
                    </p>
                  </div>
                </div>

                {submissionResult.tabSwitches > 0 && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Note:</strong> {submissionResult.tabSwitches}{" "}
                      violation{submissionResult.tabSwitches !== 1 ? "s" : ""}{" "}
                      detected during the quiz.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center justify-between text-sm p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">Quiz:</span>
                  <span className="font-medium">{quiz.title}</span>
                </div>
                <div className="flex items-center justify-between text-sm p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">Set:</span>
                  <span className="font-medium">Set {selectedSet}</span>
                </div>
                <div className="flex items-center justify-between text-sm p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">Participant:</span>
                  <span className="font-medium">{user.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">Submitted:</span>
                  <span className="font-medium">
                    {new Date().toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <Alert>
                <AlertDescription className="mx-auto max-w-lg text-sm leading-6 text-center">
                  <span>
                    Your results will be reviewed and published by the
                    administrator. An official scorecard will be emailed to{" "}
                    <strong className="font-semibold">{user.email}</strong> once
                    released.
                  </span>
                </AlertDescription>
              </Alert>
              {quiz.feedbackFormId && (
                <Button
                  asChild
                  className="w-full font-bold bg-primary text-primary-foreground hover:opacity-90 rounded-xl"
                >
                  <a
                    href={`/forms/${quiz.feedbackFormId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Fill Feedback Form
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Fallback for completed state without result (already submitted before)
  if (currentStep === "quiz-submitted" && !submissionResult) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-2xl">Quiz Already Submitted</CardTitle>
            <p className="text-muted-foreground text-sm">
              Your responses have been recorded. Results will be published by
              the administrator.
            </p>
            {quiz.feedbackFormId && (
              <Button
                asChild
                className="w-full mt-4 font-bold bg-primary text-primary-foreground hover:opacity-90 rounded-xl"
              >
                <a
                  href={`/forms/${quiz.feedbackFormId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Fill Feedback Form
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Step 3: Quiz Active (Proctored) ──
  return (
    <div className="min-h-screen bg-background">
      {/* Fullscreen Exit Warning Modal */}
      {showFullscreenWarning && !isBlocked && (
        <div className="fixed inset-0 bg-black/95 z-60 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-destructive border-2 shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 text-destructive">
                <AlertTriangle className="h-6 w-6 animate-pulse" />
                <CardTitle className="text-lg">
                  Fullscreen Mode Exited!
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive" className="border-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <AlertDescription className="text-sm font-semibold m-0">
                      Return to fullscreen in:
                    </AlertDescription>
                  </div>
                  <div className="flex items-center gap-2 bg-destructive text-destructive-foreground px-3 py-1 rounded-md">
                    <Timer className="h-4 w-4" />
                    <span className="text-2xl font-bold tabular-nums">
                      {fullscreenWarningTimer}s
                    </span>
                  </div>
                </div>
              </Alert>

              <div className="p-3 bg-muted rounded-lg text-xs space-y-1">
                <p className="font-semibold text-destructive">
                  ⚠️ If timer reaches 0:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-muted-foreground ml-2">
                  <li>Quiz will be blocked immediately</li>
                  <li>Violation reported to admin</li>
                  <li>Need admin approval to continue</li>
                </ul>
              </div>

              <Button
                onClick={enterFullscreen}
                className="w-full bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                size="lg"
              >
                <Eye className="h-5 w-5 mr-2" />
                Enter Fullscreen Now
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Or press{" "}
                <kbd className="px-1.5 py-0.5 bg-muted rounded border text-xs">
                  F11
                </kbd>
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Blocked Screen Overlay */}
      {isBlocked && (
        <div className="fixed inset-0 bg-black/90 z-100 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full border-destructive">
            <CardHeader>
              <div className="flex items-center gap-3 text-destructive">
                <AlertTriangle className="h-8 w-8" />
                <CardTitle className="text-2xl">Quiz Blocked</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-base">
                  Your quiz has been blocked due to violation of exam rules.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <p className="font-semibold">Violation Details:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>
                    Failed to return to fullscreen mode within the allowed time
                  </li>
                  <li>Total violations recorded: {tabSwitches}</li>
                  <li>The violation has been reported to administrators</li>
                </ul>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>What happens now?</strong>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Your quiz attempt has been terminated. The violation has been
                  recorded. Please contact the exam administrator to resolve
                  this issue.
                </p>
              </div>

              <Alert className="border-primary">
                <Clock className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Returning to registration page in{" "}
                  <strong>
                    {blockedMessageTimer} second
                    {blockedMessageTimer !== 1 ? "s" : ""}
                  </strong>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Warning Banner */}
      {showWarning && !isBlocked && (
        <Alert
          variant="destructive"
          className="fixed top-4 left-1/2 -translate-x-1/2 w-auto max-w-md z-50"
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {tabSwitches === 1 &&
              "Warning 1/3: Tab switch detected! Two more violations will block the quiz."}
            {tabSwitches === 2 &&
              "Warning 2/3: Second violation! One more and the quiz will be blocked."}
            {timeRemaining === 300 &&
              tabSwitches === 0 &&
              "5 minutes remaining! Please complete your quiz."}
          </AlertDescription>
        </Alert>
      )}

      {/* Quiz Header */}
      <div className="border-b bg-card sticky top-0 z-40 shadow-xs">
        <div className="container mx-auto px-4 py-3 sm:py-3.5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Left: CodeBreakers Logo & Quiz Info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 p-1 shrink-0 flex items-center justify-center shadow-xs">
                <Image
                  src="/assets/logo.png"
                  alt="CodeBreakers Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary tracking-wider uppercase">
                    CodeBreakers
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <h1 className="text-base sm:text-lg font-bold truncate max-w-[180px] sm:max-w-md">
                    {quiz.title}
                  </h1>
                </div>
                <p className="text-xs text-muted-foreground">
                  {user.name} — Set {selectedSet}
                </p>
              </div>
            </div>

            {/* Right: Quiz Duration & Remaining Timer + Controls */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Quiz Duration Section with Live Countdown */}
              <div
                className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg border-2 ${
                  isTimeLow
                    ? "border-destructive bg-destructive/10"
                    : "border-primary/40 bg-primary/10"
                }`}
              >
                <div className="flex flex-col items-end text-right">
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Timer
                      className={`h-4 w-4 ${isTimeLow ? "text-destructive animate-pulse" : "text-primary"}`}
                    />
                    <span
                      className={`text-base sm:text-lg font-bold font-mono leading-none ${isTimeLow ? "text-destructive" : "text-primary"}`}
                    >
                      {formatTime(timeRemaining)}
                    </span>
                  </div>
                </div>
              </div>

              {tabSwitches > 0 && (
                <Badge
                  variant="destructive"
                  className="flex items-center gap-1"
                >
                  <AlertTriangle className="h-3 w-3" />
                  {tabSwitches === 1 && "Warning 1/3"}
                  {tabSwitches === 2 && "Warning 2/3"}
                  {tabSwitches >= 3 && "BLOCKED"}
                </Badge>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={isFullscreen ? exitFullscreen : enterFullscreen}
                className="cursor-pointer"
              >
                {isFullscreen ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Exit Fullscreen
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Enter Fullscreen
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {questions.length === 0 ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">
                  Loading Questions...
                </h2>
                <p className="text-muted-foreground">
                  Please wait while we load your quiz questions.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Question Area */}
            <div className="lg:col-span-3 space-y-6">
              {/* Progress Info */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        <span className="text-muted-foreground">
                          Question:{" "}
                        </span>
                        <span className="font-semibold">
                          {currentQuestionIndex + 1} of {questions.length}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">
                          Answered:{" "}
                        </span>
                        <span className="font-semibold">
                          {Object.keys(answers).length}/{questions.length}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">
                          Points per Question:{" "}
                        </span>
                        <span className="font-semibold">
                          {quiz.pointsPerQuestion}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Current Question */}
              {currentQuestion && (
                <Card
                  className={
                    answers[currentQuestionIndex] !== undefined
                      ? "border-primary"
                      : ""
                  }
                >
                  <CardHeader>
                    <CardTitle className="text-xl">
                      Question {currentQuestionIndex + 1}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-lg font-medium leading-relaxed">
                      {currentQuestion.question}
                    </p>

                    <div className="space-y-3">
                      {currentQuestion.options.map((option, oIndex) => (
                        <button
                          key={oIndex}
                          onClick={() =>
                            handleAnswerSelect(currentQuestionIndex, oIndex)
                          }
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                            answers[currentQuestionIndex] === oIndex
                              ? "border-primary bg-primary/10"
                              : "border-muted hover:border-muted-foreground/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                answers[currentQuestionIndex] === oIndex
                                  ? "border-primary bg-primary"
                                  : "border-muted-foreground"
                              }`}
                            >
                              {answers[currentQuestionIndex] === oIndex && (
                                <div className="w-3 h-3 rounded-full bg-white" />
                              )}
                            </div>
                            <span className="flex-1">{option}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {answers[currentQuestionIndex] !== undefined && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Badge
                          variant="outline"
                          className="border-green-600 text-green-600"
                        >
                          Answered
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Navigation Buttons */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <Button
                      onClick={handlePreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                      variant="outline"
                      size="lg"
                      className="cursor-pointer"
                    >
                      ← Previous
                    </Button>

                    <div className="text-sm text-muted-foreground">
                      {currentQuestionIndex + 1} / {questions.length}
                    </div>

                    {currentQuestionIndex === questions.length - 1 ? (
                      <Button
                        onClick={handleSubmitQuiz}
                        disabled={
                          Object.keys(answers).length !== questions.length ||
                          isSubmitting
                        }
                        size="lg"
                        className="bg-green-600 hover:bg-green-700 cursor-pointer"
                      >
                        {isSubmitting ? "Submitting..." : "Submit Quiz"}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleNextQuestion}
                        size="lg"
                        className="cursor-pointer"
                      >
                        Next →
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar — Question Navigator */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-base">Questions</CardTitle>
                  <CardDescription className="text-xs">
                    Click to jump to question
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
                    {questions.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => handleJumpToQuestion(index)}
                        className={`
                          aspect-square rounded-lg border-2 font-semibold text-sm transition-all
                          ${
                            currentQuestionIndex === index
                              ? "border-primary bg-primary text-primary-foreground cursor-pointer"
                              : answers[index] !== undefined
                                ? "border-green-600 bg-green-600/10 text-green-600 cursor-pointer"
                                : "border-muted hover:border-muted-foreground/50 cursor-pointer"
                          }
                        `}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-4 h-4 rounded border-2 border-primary bg-primary"></div>
                      <span className="text-muted-foreground">Current</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-4 h-4 rounded border-2 border-green-600 bg-green-600/10"></div>
                      <span className="text-muted-foreground">Answered</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-4 h-4 rounded border-2 border-muted"></div>
                      <span className="text-muted-foreground">Unanswered</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <Button
                      onClick={handleSubmitQuiz}
                      disabled={
                        Object.keys(answers).length !== questions.length ||
                        isSubmitting
                      }
                      className="w-full bg-green-600 hover:bg-green-700 cursor-pointer"
                      size="sm"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Quiz"}
                    </Button>
                    {Object.keys(answers).length !== questions.length && (
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        {questions.length - Object.keys(answers).length}{" "}
                        remaining
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
