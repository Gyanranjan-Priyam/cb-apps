/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, AlertTriangle, Eye, EyeOff, User as UserIcon, Mail, Phone, IdCard, Building2, BookOpen, Award, Timer, CheckCircle2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { submitQuizAttempt } from "../actions";
import { blockUserFromQuizAction } from "../block-actions";
import { setSystemAttemptingAction, getSystemState } from "@/app/admin/quizzes/actions";
import { CloseWindowButton } from "./close-window-button";
import { toast } from "sonner";
import { getSocket, initSocket, joinRoom } from "@/lib/socket-client";

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
}

interface User {
  id: string;
  name: string;
  email: string;
  registration?: string | null;
  username?: string | null;
  mobile?: string | null;
  branch?: string | null;
}

interface Question {
  question: string;
  options: string[];
  correctAnswer?: number;
  originalIndex?: number;
  category?: string;
  explanation?: string;
  points?: number;
  negativePoints?: number;
  isFlagged?: boolean;
}

interface QuizProctorInterfaceProps {
  quiz: Quiz;
  user: User;
  hasExistingAttempt?: boolean;
  assignedSet: string;
  /** Optional custom submit handler — when provided, internal submitQuizAttempt is NOT called */
  onSubmit?: (data: {
    quizId: string;
    quizDbId: string;
    assignedSet: string;
    answers: Record<number, number>;
    tabSwitches: number;
    questionsJson: string;
  }) => Promise<{ status: "success" | "error"; message?: string; data?: { score: number; correctAnswers: number; totalQuestions: number; pointsEarned: number; tabSwitches: number; detailedResults?: any[] } }>;
  /** Optional content shown inside the submitted card (replaces Close / View Achievements buttons) */
  afterSubmitContent?: React.ReactNode;
  /** Optional systemCode for external kiosk candidate sessions */
  systemCode?: string;
  /** Optional initial step for active or unblocked attempts */
  initialStep?: QuizStep;
}

type QuizStep = 'user-info' | 'quiz-details' | 'quiz-started' | 'quiz-submitted';

export default function QuizProctorInterface({ 
  quiz, 
  user, 
  hasExistingAttempt,
  assignedSet,
  onSubmit,
  afterSubmitContent,
  systemCode,
  initialStep,
}: QuizProctorInterfaceProps) {
  const [currentStep, setCurrentStep] = useState<QuizStep>(initialStep || 'user-info');
  const [selectedSet] = useState<string>(assignedSet); // Pre-selected with assigned set
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasEnteredFullscreenOnce, setHasEnteredFullscreenOnce] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [fullscreenWarningTimer, setFullscreenWarningTimer] = useState(10);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedMessageTimer, setBlockedMessageTimer] = useState(5);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const blockedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(quiz.duration * 60); // Convert minutes to seconds
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const answersRef = useRef<Record<number, number>>({});
  const handleSubmitRef = useRef<((isAutoSubmit?: boolean, customAnswers?: Record<number, number>) => Promise<void>) | null>(null);
  const [showTimeOverModal, setShowTimeOverModal] = useState(false);
  const [showSubmitConfirmDialog, setShowSubmitConfirmDialog] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Keep answersRef in sync with answers state at all times
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Save question index to localStorage whenever it changes
  useEffect(() => {
    if (systemCode && currentQuestionIndex >= 0) {
      try {
        localStorage.setItem(`cb_qidx_${systemCode}`, String(currentQuestionIndex));
      } catch (e) {}
    }
  }, [currentQuestionIndex, systemCode]);

  // Restore saved question index & answers from localStorage if refreshing or unblocking
  useEffect(() => {
    if (systemCode) {
      try {
        const savedAnswers = localStorage.getItem(`cb_answers_${systemCode}`);
        if (savedAnswers) {
          setAnswers(JSON.parse(savedAnswers));
        }
        const savedIdx = localStorage.getItem(`cb_qidx_${systemCode}`);
        if (savedIdx) {
          const parsedIdx = parseInt(savedIdx, 10);
          if (!isNaN(parsedIdx) && parsedIdx >= 0) {
            setCurrentQuestionIndex(parsedIdx);
          }
        }
      } catch (e) {}
    }
  }, [systemCode]);

  // Active shift sync on tab visibility change (Realtime handles instant push events)
  useEffect(() => {
    if (!systemCode) return;

    const currentShift = quiz.shift || 1;
    const checkShiftSync = async () => {
      try {
        const res = await getSystemState(systemCode);
        if (res.status === "success" && res.data) {
          const sys = res.data;
          const assignedShift = sys.assignedShift || 1;
          const activeShift = sys.quiz?.activeShift || 1;
          
          if (sys.status === "REGISTERED" || sys.status === "ASSIGNED" || assignedShift > currentShift || activeShift > currentShift) {
            if (currentStep === 'quiz-submitted') {
              try {
                if (document.fullscreenElement) {
                  document.exitFullscreen().catch(() => {});
                }
                localStorage.removeItem(`cb_answers_${systemCode}`);
                localStorage.removeItem(`cb_qidx_${systemCode}`);
              } catch (e) {}
              window.location.replace("/quiz/system-register");
            } else if (currentStep === 'quiz-started') {
              toast.info("Shift time has completed. Automatically submitting your attempted questions...");
              if (handleSubmitRef.current) {
                handleSubmitRef.current(true);
              }
            } else {
              window.location.replace("/quiz/system-register");
            }
          }
        }
      } catch (err) {
        console.error("Shift sync error:", err);
      }
    };

    document.addEventListener("visibilitychange", checkShiftSync);
    window.addEventListener("focus", checkShiftSync);

    return () => {
      document.removeEventListener("visibilitychange", checkShiftSync);
      window.removeEventListener("focus", checkShiftSync);
    };
  }, [systemCode, currentStep, quiz.shift]);

  // Real-time Socket.IO unblock & shift completed listener inside QuizProctorInterface
  useEffect(() => {
    const roomsToLeave: Array<() => void> = [];
    let handleUnblock: (() => void) | null = null;
    let handleStatusChanged: ((data: { status?: string; shiftCompleted?: number }) => void) | null = null;
    let handleShiftCompleted: ((data?: any) => void) | null = null;

    initSocket().then((socket) => {
      if (!socket) return;

      if (systemCode) {
        roomsToLeave.push(joinRoom(`system-${systemCode}`));
      }
      if (quiz.id) {
        roomsToLeave.push(joinRoom(`quiz-${quiz.id}`));
      }
      if (quiz.quizId) {
        roomsToLeave.push(joinRoom(`quiz-${quiz.quizId}`));
      }

      handleUnblock = () => {
        setIsBlocked(false);
        setShowWarning(false);
        setShowFullscreenWarning(false);
        toast.success("You have been unblocked by admin! Resuming your exam...");
      };

      handleStatusChanged = (data: { status?: string; shiftCompleted?: number }) => {
        if (data?.status === "ATTEMPTING" || data?.status === "IN_PROGRESS") {
          handleUnblock!();
        } else if (data?.status === "BLOCKED") {
          setIsBlocked(true);
        } else if (data?.status === "REGISTERED" || data?.status === "ASSIGNED" || data?.shiftCompleted) {
          if (systemCode) {
            try {
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
              }
              localStorage.removeItem(`cb_answers_${systemCode}`);
              localStorage.removeItem(`cb_qidx_${systemCode}`);
            } catch (e) {}
            window.location.replace("/quiz/system-register");
            return;
          }
          toast.info("Shift has completed. Auto-submitting your attempted questions...");
          if (handleSubmitRef.current) {
            handleSubmitRef.current(true);
          }
        }
      };

      handleShiftCompleted = () => {
        if (systemCode) {
          try {
            if (document.fullscreenElement) {
              document.exitFullscreen().catch(() => {});
            }
            localStorage.removeItem(`cb_answers_${systemCode}`);
            localStorage.removeItem(`cb_qidx_${systemCode}`);
          } catch (e) {}
          window.location.replace("/quiz/system-register");
          return;
        }
        toast.info("Shift has completed. Auto-submitting your attempted questions...");
        if (handleSubmitRef.current) {
          handleSubmitRef.current(true);
        }
      };

      socket.on("unblocked", handleUnblock);
      socket.on("status-changed", handleStatusChanged);
      socket.on("shift-completed", handleShiftCompleted);
    });

    return () => {
      roomsToLeave.forEach((leaveFn) => leaveFn());
      const socket = getSocket();
      if (socket) {
        if (handleUnblock) socket.off("unblocked", handleUnblock);
        if (handleStatusChanged) socket.off("status-changed", handleStatusChanged);
        if (handleShiftCompleted) socket.off("shift-completed", handleShiftCompleted);
      }
    };
  }, [systemCode, quiz.id, quiz.quizId, currentStep]);

  // Set system to ATTEMPTING status in database & real-time when quiz starts
  useEffect(() => {
    if (currentStep === 'quiz-started' && !isBlocked) {
      const targetCode = systemCode || (user.username?.startsWith("SYS-") ? user.username : null);
      if (targetCode) {
        setSystemAttemptingAction(targetCode).catch((err) => {
          console.error("Failed to set system status to ATTEMPTING:", err);
        });
      }
    }
  }, [currentStep, isBlocked, systemCode, user.username]);

  // Automatic and gesture-based fullscreen trigger
  useEffect(() => {
    if (currentStep !== 'quiz-started' || isBlocked) return;

    // Check if already in fullscreen
    if (document.fullscreenElement) {
      setIsFullscreen(true);
      setHasEnteredFullscreenOnce(true);
    } else {
      // Try immediate automated fullscreen
      enterFullscreen();
    }

    // Capture ANY user click, touch, or keydown on the entire window to enter fullscreen immediately
    const handleGlobalInteraction = () => {
      if (!document.fullscreenElement && currentStep === 'quiz-started' && !isBlocked) {
        enterFullscreen();
      }
    };

    window.addEventListener('click', handleGlobalInteraction, { capture: true });
    window.addEventListener('keydown', handleGlobalInteraction, { capture: true });
    window.addEventListener('pointerdown', handleGlobalInteraction, { capture: true });

    return () => {
      window.removeEventListener('click', handleGlobalInteraction, { capture: true });
      window.removeEventListener('keydown', handleGlobalInteraction, { capture: true });
      window.removeEventListener('pointerdown', handleGlobalInteraction, { capture: true });
    };
  }, [currentStep, isBlocked]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    pointsEarned: number;
    tabSwitches: number;
    detailedResults?: Array<{
      questionIndex: number;
      question: string;
      userAnswer: number;
      correctAnswer: number;
      isCorrect: boolean;
      options: string[];
    }>;
  } | null>(null);

  const getQuestionCount = (set: string) => {
    const list = getQuestionsForShiftAndSet(quiz.questionsJson, quiz.shift || 1, set);
    return Array.isArray(list) ? list.length : 0;
  };

  // Load and deterministically scramble questions per system / candidate
  useEffect(() => {
    if (currentStep === 'quiz-started' && selectedSet) {
      const rawQuestions = getQuestionsForShiftAndSet(quiz.questionsJson, quiz.shift || 1, selectedSet);
      if (Array.isArray(rawQuestions)) {
        // Unique deterministic seed per system or user
        const seedStr = `${systemCode || user.username || user.id || "kiosk"}_${selectedSet}_${quiz.id}`;
        
        let seed = 0;
        for (let i = 0; i < seedStr.length; i++) {
          seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
        }

        const seededRng = () => {
          seed = (seed + 0x6D2B79F5) >>> 0;
          let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
          t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
          return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };

        const indexedQuestions = rawQuestions.map((q: any, idx: number) => ({
          ...q,
          originalIndex: idx,
        }));

        // Deterministic Fisher-Yates shuffle
        for (let i = indexedQuestions.length - 1; i > 0; i--) {
          const j = Math.floor(seededRng() * (i + 1));
          [indexedQuestions[i], indexedQuestions[j]] = [indexedQuestions[j], indexedQuestions[i]];
        }

        setQuestions(indexedQuestions as Question[]);
      }
    }
  }, [currentStep, selectedSet, systemCode, user.id, user.username, quiz.id]);

  // Timer countdown
  useEffect(() => {
    if (currentStep !== 'quiz-started') return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Show time over modal and auto-submit all attempted answers
          setShowTimeOverModal(true);
          handleSubmitQuiz(true, answersRef.current);
          return 0;
        }
        // Show warning when 5 minutes remaining
        if (prev === 300) {
          setShowWarning(true);
          setTimeout(() => setShowWarning(false), 5000);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentStep]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Check if time is running low (less than 5 minutes)
  const isTimeLow = timeRemaining <= 300 && timeRemaining > 0;

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    setAnswers(prev => {
      const next = { ...prev, [questionIndex]: answerIndex };
      answersRef.current = next;
      if (systemCode) {
        try {
          localStorage.setItem(`cb_answers_${systemCode}`, JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });
  };

  const handleInitiateSubmit = () => {
    setShowSubmitConfirmDialog(true);
  };

  const handleSubmitQuiz = async (isAutoSubmit = false, customAnswers?: Record<number, number>) => {
    if (isSubmitting) return;

    // Use customAnswers or answersRef or answers state
    const currentAnswersToSubmit = customAnswers || answersRef.current || answers;

    setIsSubmitting(true);
    
    try {
      // Merge with localStorage if available for external systems
      let finalAnswers = { ...currentAnswersToSubmit };
      if (systemCode) {
        try {
          const local = localStorage.getItem(`cb_answers_${systemCode}`);
          if (local) {
            const parsed = JSON.parse(local);
            finalAnswers = { ...parsed, ...finalAnswers };
          }
        } catch (e) {}
      }

      const submitData = {
        quizId: quiz.quizId,
        quizDbId: quiz.id,
        assignedSet: selectedSet,
        answers: finalAnswers,
        tabSwitches,
        questionsJson: quiz.questionsJson,
        shiftNumber: quiz.shift || 1,
      };

      // Use custom onSubmit if provided (external quiz), otherwise fall back to internal action
      const result = onSubmit
        ? await onSubmit(submitData)
        : await submitQuizAttempt(submitData);

      if (result.status === "success" && result.data) {
        if (systemCode) {
          try {
            localStorage.removeItem(`cb_answers_${systemCode}`);
            localStorage.removeItem(`cb_qidx_${systemCode}`);
          } catch (e) {}
        }
        setSubmissionResult(result.data);
        setCurrentStep('quiz-submitted');
      } else {
        if (isAutoSubmit) {
          if (systemCode) {
            try {
              localStorage.removeItem(`cb_answers_${systemCode}`);
              localStorage.removeItem(`cb_qidx_${systemCode}`);
            } catch (e) {}
          }
          setCurrentStep('quiz-submitted');
        } else {
          toast.error(result.message || "Failed to submit quiz. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      if (isAutoSubmit) {
        setCurrentStep('quiz-submitted');
      } else {
        toast.error("An error occurred while submitting the quiz. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    handleSubmitRef.current = handleSubmitQuiz;
  });

  const handleViewAchievements = () => {
    if (window.opener && !window.opener.closed) {
      window.opener.location.href = '/dashboard/achievements';
      window.close();
    } else {
      window.location.href = '/dashboard/achievements';
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
  const currentOrigIndex = currentQuestion ? (currentQuestion.originalIndex ?? currentQuestionIndex) : currentQuestionIndex;

  // Prevent tab switching and detect visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && currentStep === 'quiz-started' && !isBlocked) {
        setTabSwitches(prev => {
          const newCount = prev + 1;
          
          if (newCount >= 3) {
            // Third strike - block the quiz
            setIsBlocked(true);
            setShowWarning(true);
            
            // Call server action to record the block
            blockUserFromQuizAction({
              quizId: quiz.id,
              quizIdentifier: quiz.quizId,
              reason: `Exceeded maximum violations (${newCount} tab switches/visibility changes detected during quiz)`,
              violationType: "TAB_SWITCH",
              violationCount: newCount,
              userId: user.id,
              systemCode: systemCode || (user.username?.startsWith("SYS-") ? user.username : undefined),
            }).catch(error => {
              console.error("Failed to record quiz block:", error);
            });
          } else {
            // First and second warning
            setShowWarning(true);
            setTimeout(() => setShowWarning(false), 5000);
          }
          
          return newCount;
        });
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentStep === 'quiz-started') {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    // Prevent right-click
    const handleContextMenu = (e: MouseEvent) => {
      if (currentStep === 'quiz-started') {
        e.preventDefault();
      }
    };

    // Prevent certain keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentStep === 'quiz-started') {
        // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
        if (
          e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
          (e.ctrlKey && e.key === 'u')
        ) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentStep, isBlocked]);

  // Request fullscreen
  const enterFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      setIsFullscreen(true);
      setHasEnteredFullscreenOnce(true);
      setShowFullscreenWarning(false);
    } catch (error) {
      console.warn("Fullscreen request:", error);
    }
  };

  // Exit fullscreen
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
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      
      if (active) {
        setHasEnteredFullscreenOnce(true);
        if (showFullscreenWarning) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          setShowFullscreenWarning(false);
          setFullscreenWarningTimer(10);
        }
      } else {
        if (currentStep === 'quiz-started' && !isBlocked && hasEnteredFullscreenOnce && !showFullscreenWarning) {
          // Show the warning modal with countdown only if they were in fullscreen previously
          setShowFullscreenWarning(true);
          setFullscreenWarningTimer(10);
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [currentStep, isBlocked, showFullscreenWarning, hasEnteredFullscreenOnce]);

  // Handle fullscreen warning countdown
  useEffect(() => {
    if (showFullscreenWarning && fullscreenWarningTimer > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setFullscreenWarningTimer((prev) => {
          if (prev <= 1) {
            // Time's up - block the user
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            
            setTabSwitches(prevCount => prevCount + 1);
            setIsBlocked(true);
            setShowFullscreenWarning(false);
            setShowWarning(false);
            setBlockedMessageTimer(5);
            
            // Call server action to record the block
            blockUserFromQuizAction({
              quizId: quiz.id,
              quizIdentifier: quiz.quizId,
              reason: `Failed to return to fullscreen within 10 seconds`,
              violationType: "FULLSCREEN_EXIT",
              violationCount: 1,
              userId: user.id,
              systemCode: systemCode || (user.username?.startsWith("SYS-") ? user.username : undefined),
            }).catch(error => {
              console.error("Failed to record quiz block:", error);
            });
            
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

  // Handle blocked message countdown and auto-close (only for internal dashboard users, not external kiosks)
  useEffect(() => {
    if (isBlocked && blockedMessageTimer > 0 && !systemCode && !user.username?.startsWith("SYS-")) {
      blockedTimerRef.current = setInterval(() => {
        setBlockedMessageTimer((prev) => {
          if (prev <= 1) {
            if (blockedTimerRef.current) {
              clearInterval(blockedTimerRef.current);
              blockedTimerRef.current = null;
            }
            // Close the window after countdown
            setTimeout(() => {
              if (window.opener && !window.opener.closed) {
                window.opener.location.href = '/dashboard/activities/quizzes';
                window.close();
              } else {
                window.location.href = '/dashboard/activities/quizzes';
              }
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
  }, [isBlocked, systemCode, user.username]);

  const handleStartQuiz = () => {
    enterFullscreen();
    setCurrentStep('quiz-started');
    const targetCode = systemCode || (user.username?.startsWith("SYS-") ? user.username : null);
    if (targetCode) {
      setSystemAttemptingAction(targetCode).catch((err) => {
        console.error("Failed to set system status to ATTEMPTING:", err);
      });
    }
  };

  // Step 1: User Information
  if (currentStep === 'user-info') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-background to-muted">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-background p-1 border flex items-center justify-center shrink-0 shadow-xs">
                <Image src="/assets/logo.png" alt="CodeBreakers Logo" width={24} height={24} className="object-contain" priority />
              </div>
              <span className="text-xs font-bold text-primary uppercase tracking-widest">CodeBreakers</span>
            </div>
            <CardTitle className="text-2xl">Verify Your Information</CardTitle>
            <CardDescription>Please confirm your details before proceeding to the quiz</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Information */}
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

              {user.mobile && (
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <Phone className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Mobile Number</p>
                    <p className="font-medium">{user.mobile}</p>
                  </div>
                </div>
              )}

              {user.registration && (
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <IdCard className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Registration Number</p>
                    <p className="font-medium">{user.registration}</p>
                  </div>
                </div>
              )}

              {user.branch && (
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Branch</p>
                    <p className="font-medium">{user.branch}</p>
                  </div>
                </div>
              )}
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                If any of the above information is incorrect, please contact your administrator before proceeding.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={() => setCurrentStep('quiz-details')}
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

  // Step 2: Quiz Details and Set Selection
  if (currentStep === 'quiz-details') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-background to-muted">
        <Card className="max-w-3xl w-full">
          <CardHeader>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-background p-1 border flex items-center justify-center shrink-0 shadow-xs">
                <Image src="/assets/logo.png" alt="CodeBreakers Logo" width={24} height={24} className="object-contain" priority />
              </div>
              <span className="text-xs font-bold text-primary uppercase tracking-widest">CodeBreakers</span>
            </div>
            <CardTitle className="text-2xl">{quiz.title}</CardTitle>
            <CardDescription>{quiz.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quiz Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg border border-primary/20">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Duration</p>
                  <p className="font-bold text-foreground">{quiz.duration} minutes</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Award className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Points per Question</p>
                  <p className="font-semibold">{quiz.pointsPerQuestion} points</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <BookOpen className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Available Sets</p>
                  <p className="font-semibold">{quiz.sets} set{quiz.sets > 1 ? 's' : ''}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <IdCard className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  {hasExistingAttempt ? (
                    <Badge variant="secondary">Retaking Quiz</Badge>
                  ) : (
                    <Badge variant="default">First Attempt</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Set Selection - Display Only (Pre-assigned) */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Your Assigned Set</label>
              <div className="p-6 border-2 border-primary bg-primary/10 rounded-lg">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">Set {selectedSet}</div>
                  <p className="text-sm text-muted-foreground">
                    This set has been randomly assigned to you
                  </p>
                  <div className="text-xs text-muted-foreground mt-2">
                    {getQuestionCount(selectedSet)} question{getQuestionCount(selectedSet) !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm">
                  <strong>Total Points:</strong> {getQuestionCount(selectedSet)} questions × {quiz.pointsPerQuestion} points = <strong>{getQuestionCount(selectedSet) * quiz.pointsPerQuestion} points</strong>
                </p>
              </div>
            </div>

            {/* Instructions */}
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
                  <li>Your set has been randomly assigned by the system</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                onClick={() => setCurrentStep('user-info')}
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

  // Step 4: Quiz Submitted - Thank You Page
  if (currentStep === 'quiz-submitted') {
    const isExternalQuiz = !!systemCode || user.username?.startsWith("SYS-");

    if (isExternalQuiz) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          {/* Time-Over Notification Dialog in Fullscreen */}
          {showTimeOverModal && (
            <div className="fixed inset-0 bg-black/90 z-70 backdrop-blur-md flex items-center justify-center p-4">
              <Card className="max-w-md w-full border-amber-500 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <CardHeader className="text-center pb-2">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-2 animate-bounce">
                    <Clock className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Time Expired!</CardTitle>
                  <CardDescription>
                    The quiz timer has reached 0. All your attempted answers have been automatically submitted and recorded.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <Alert className="border-amber-500/30 bg-amber-500/5">
                    <CheckCircle2 className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-xs">
                      Your quiz progress has been successfully saved.
                    </AlertDescription>
                  </Alert>

                  <Button
                    onClick={() => setShowTimeOverModal(false)}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-base cursor-pointer shadow-lg"
                    size="lg"
                  >
                    View Submission
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="max-w-md w-full space-y-4 text-center p-6 border rounded-xl bg-card shadow-lg">

            <div className="w-16 h-16 rounded-full bg-green-600/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold">Quiz Submitted Successfully</h1>
            <p className="text-muted-foreground text-sm">
              Your responses have been recorded for system <strong>{user.registration || systemCode}</strong>.
            </p>
            <div className="p-3 bg-muted rounded-lg text-xs text-muted-foreground space-y-1 text-left">
              <div><strong>Quiz:</strong> {quiz.title}</div>
              <div><strong>Set:</strong> Set {selectedSet}</div>
              <div><strong>Participant:</strong> {user.name}</div>
              <div><strong>Submitted At:</strong> {new Date().toLocaleString()}</div>
            </div>
            {afterSubmitContent ? (
              afterSubmitContent
            ) : (
              <p className="text-xs text-muted-foreground">
                Official scorecards and results will be reviewed and published by the administrator.
              </p>
            )}
          </div>
        </div>
      );
    }

    if (!submissionResult) return null;

    return (
      <div className="min-h-screen bg-linear-to-br from-background to-muted p-4 py-8">
        {/* Time-Over Notification Dialog in Fullscreen */}
        {showTimeOverModal && (
          <div className="fixed inset-0 bg-black/90 z-70 backdrop-blur-md flex items-center justify-center p-4">
            <Card className="max-w-md w-full border-amber-500 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-2 animate-bounce">
                  <Clock className="h-8 w-8" />
                </div>
                <CardTitle className="text-2xl font-bold">Time Expired!</CardTitle>
                <CardDescription>
                  The quiz timer has reached 0. All your attempted answers have been automatically submitted and recorded.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <Alert className="border-amber-500/30 bg-amber-500/5">
                  <CheckCircle2 className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-xs">
                    Your answers were submitted and evaluated automatically.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={() => setShowTimeOverModal(false)}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-base cursor-pointer shadow-lg"
                  size="lg"
                >
                  View My Results
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="container mx-auto max-w-4xl space-y-6">
          {/* Header Card */}
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
                <span className="text-xs font-bold uppercase tracking-widest text-primary">CodeBreakers</span>
              </div>
              <div className="flex justify-center mb-3">
                <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl">Quiz Completed!</CardTitle>
              <CardDescription className="text-base mt-2">
                Your answers have been submitted and evaluated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Score Summary */}
              <div className="p-6 bg-muted rounded-lg">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold">Your Results</h3>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-background rounded-lg">
                    <p className="text-sm text-muted-foreground">Score</p>
                    <p className="text-3xl font-bold text-primary">{submissionResult.score}%</p>
                  </div>
                  <div className="text-center p-4 bg-background rounded-lg">
                    <p className="text-sm text-muted-foreground">Correct</p>
                    <p className="text-3xl font-bold text-green-600">{submissionResult.correctAnswers}</p>
                  </div>
                  <div className="text-center p-4 bg-background rounded-lg">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-3xl font-bold">{submissionResult.totalQuestions}</p>
                  </div>
                  <div className="text-center p-4 bg-background rounded-lg">
                    <p className="text-sm text-muted-foreground">Points</p>
                    <p className="text-3xl font-bold text-primary">{submissionResult.pointsEarned}</p>
                  </div>
                </div>

                {submissionResult.tabSwitches > 0 && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Note:</strong> {submissionResult.tabSwitches} violation{submissionResult.tabSwitches !== 1 ? 's' : ''} detected during the quiz.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Quiz Info */}
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
                  <span className="font-medium">{new Date().toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          {submissionResult.detailedResults && submissionResult.detailedResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Answer Review</CardTitle>
                <CardDescription>
                  Review your answers and see the correct solutions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {submissionResult.detailedResults.map((result, index) => (
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
                            {result.options.map((option, oIndex) => {
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

          {/* Action Buttons */}
          <Card>
            <CardContent className="p-6">
              {afterSubmitContent ? (
                afterSubmitContent
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <CloseWindowButton 
                    redirectTo="/dashboard/activities/quizzes"
                    variant="outline"
                    className="flex-1"
                    size="lg"
                  >
                    Close Window
                  </CloseWindowButton>
                  <Button 
                    onClick={handleViewAchievements}
                    className="flex-1"
                    size="lg"
                  >
                    View Achievements
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Step 3: Quiz Started
  return (
    <div className="min-h-screen bg-background">
      {/* Fullscreen Exit Warning Modal */}
      {showFullscreenWarning && !isBlocked && (
        <div className="fixed inset-0 bg-black/95 z-60 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-destructive border-2 shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 text-destructive">
                <AlertTriangle className="h-6 w-6 animate-pulse" />
                <CardTitle className="text-lg">Fullscreen Mode Exited!</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Countdown Timer */}
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
                <p className="font-semibold text-destructive">⚠️ If timer reaches 0:</p>
                <ul className="list-disc list-inside space-y-0.5 text-muted-foreground ml-2">
                  <li>Quiz will be blocked immediately</li>
                  <li>Violation reported to admin</li>
                  <li>Need admin approval to continue</li>
                </ul>
              </div>

              {/* Action Button */}
              <Button
                onClick={enterFullscreen}
                className="w-full bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                size="lg"
              >
                <Eye className="h-5 w-5 mr-2" />
                Enter Fullscreen Now
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Or press <kbd className="px-1.5 py-0.5 bg-muted rounded border text-xs">F11</kbd>
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
                  <li>Failed to return to fullscreen mode within the allowed time</li>
                  <li>Total violations recorded: {tabSwitches}</li>
                  <li>The violation has been reported to administrators</li>
                </ul>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>What happens now?</strong>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Your quiz attempt has been terminated and the violation has been recorded. 
                  The administrators have been notified and will review your case. 
                  You must contact your instructor or administrator to unblock your quiz access.
                </p>
              </div>

              {/* For external kiosk candidates: Keep in page until unblocked */}
              {systemCode || user.username?.startsWith("SYS-") ? (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive flex items-center justify-center gap-2 font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                  </span>
                  Waiting for administrator unblock... Your screen will automatically update once unblocked.
                </div>
              ) : (
                <>
                  {/* Auto-close timer for internal members */}
                  <Alert className="border-primary">
                    <Clock className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Window will close automatically in <strong>{blockedMessageTimer} second{blockedMessageTimer !== 1 ? 's' : ''}</strong>
                    </AlertDescription>
                  </Alert>

                  <div className="text-center pt-4">
                    <CloseWindowButton
                      redirectTo="/dashboard/activities/quizzes"
                      variant="destructive"
                      className="w-full"
                      size="lg"
                    >
                      Close Now
                    </CloseWindowButton>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Warning Banner */}
      {showWarning && !isBlocked && (
        <Alert variant="destructive" className="fixed top-4 left-1/2 -translate-x-1/2 w-auto max-w-md z-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {tabSwitches === 1 && 'Warning 1/3: Tab switch detected! Two more violations will block the quiz.'}
            {tabSwitches === 2 && 'Warning 2/3: Second violation! One more and the quiz will be blocked.'}
            {timeRemaining === 300 && tabSwitches === 0 && '5 minutes remaining! Please complete your quiz.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Quiz Header */}
      <div className="border-b bg-card sticky top-0 z-40 shadow-xs">
        <div className="container mx-auto px-4 py-3 sm:py-3.5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Left: CodeBreakers Logo & Quiz Info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-background border p-1 shrink-0 flex items-center justify-center shadow-xs">
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
                  <span className="text-xs font-bold text-primary tracking-wider uppercase">CodeBreakers</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <h1 className="text-base sm:text-lg font-bold truncate max-w-[180px] sm:max-w-md">{quiz.title}</h1>
                </div>
                <p className="text-xs text-muted-foreground">{user.name} - Set {selectedSet}</p>
              </div>
            </div>

            {/* Right: Quiz Duration & Remaining Timer + Controls */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Quiz Duration Section with Live Countdown */}
              <div className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg border-2 ${
                isTimeLow ? 'border-destructive bg-destructive/10' : 'border-primary/40 bg-primary/10'
              }`}>
                <div className="flex flex-col items-end text-right">
                  <span className="text-[10px] font-semibold text-muted-foreground leading-none">
                    Duration: {quiz.duration}m
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Timer className={`h-4 w-4 ${isTimeLow ? 'text-destructive animate-pulse' : 'text-primary'}`} />
                    <span className={`text-base sm:text-lg font-bold font-mono leading-none ${isTimeLow ? 'text-destructive' : 'text-primary'}`}>
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
                  {tabSwitches === 1 && 'Warning 1/3'}
                  {tabSwitches === 2 && 'Warning 2/3'}
                  {tabSwitches >= 3 && 'BLOCKED'}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={isFullscreen ? exitFullscreen : enterFullscreen}
                className="cursor-pointer"
              >
                {isFullscreen ? (
                  <><EyeOff className="h-4 w-4 mr-2" />Exit Fullscreen</>
                ) : (
                  <><Eye className="h-4 w-4 mr-2" />Enter Fullscreen</>
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
                <h2 className="text-2xl font-bold mb-4">Loading Questions...</h2>
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
                        <span className="text-muted-foreground">Question: </span>
                        <span className="font-semibold">{currentQuestionIndex + 1} of {questions.length}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Answered: </span>
                        <span className="font-semibold">{Object.keys(answers).length}/{questions.length}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Points per Question: </span>
                        <span className="font-semibold">{quiz.pointsPerQuestion}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Current Question */}
              {currentQuestion && (
                <Card className={answers[currentOrigIndex] !== undefined ? 'border-primary' : ''}>
                  <CardHeader>
                    <CardTitle className="text-xl">
                      Question {currentQuestionIndex + 1}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-lg font-medium leading-relaxed">{currentQuestion.question}</p>
                    
                    <div className="space-y-3">
                      {currentQuestion.options.map((option, oIndex) => (
                        <button
                          key={oIndex}
                          onClick={() => handleAnswerSelect(currentOrigIndex, oIndex)}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                            answers[currentOrigIndex] === oIndex
                              ? 'border-primary bg-primary/10'
                              : 'border-muted hover:border-muted-foreground/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              answers[currentOrigIndex] === oIndex
                                ? 'border-primary bg-primary'
                                : 'border-muted-foreground'
                            }`}>
                              {answers[currentOrigIndex] === oIndex && (
                                <div className="w-3 h-3 rounded-full bg-white" />
                              )}
                            </div>
                            <span className="flex-1">{option}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {answers[currentOrigIndex] !== undefined && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Badge variant="outline" className="border-green-600 text-green-600">
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
                        onClick={handleInitiateSubmit}
                        disabled={isSubmitting}
                        size="lg"
                        className="bg-green-600 hover:bg-green-700 cursor-pointer"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
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

            {/* Right Sidebar - Question Navigator */}
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
                    {questions.map((q, index) => {
                      const qOrigIndex = q.originalIndex ?? index;
                      const isAnswered = answers[qOrigIndex] !== undefined;
                      return (
                        <button
                          key={index}
                          onClick={() => handleJumpToQuestion(index)}
                          className={`
                            aspect-square rounded-lg border-2 font-semibold text-sm transition-all
                            ${currentQuestionIndex === index
                              ? 'border-primary bg-primary text-primary-foreground cursor-pointer'
                              : isAnswered
                              ? 'border-green-600 bg-green-600/10 text-green-600 cursor-pointer'
                              : 'border-muted hover:border-muted-foreground/50 cursor-pointer'
                            }
                          `}
                        >
                          {index + 1}
                        </button>
                      );
                    })}
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
                      onClick={handleInitiateSubmit}
                      disabled={isSubmitting}
                      className="w-full bg-green-600 hover:bg-green-700 cursor-pointer"
                      size="sm"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                    </Button>
                    {Object.keys(answers).length !== questions.length && (
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        {questions.length - Object.keys(answers).length} remaining
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Submit Confirmation Modal (Shadcn AlertDialog) */}
      <AlertDialog open={showSubmitConfirmDialog} onOpenChange={setShowSubmitConfirmDialog}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-primary font-semibold">
              <BookOpen className="h-5 w-5" />
              <span>Confirm Quiz Submission</span>
            </div>
            <AlertDialogTitle className="text-lg">
              {Object.keys(answers).length < questions.length
                ? "Unanswered Questions Remaining"
                : "Ready to Submit Your Quiz?"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2 text-sm text-foreground/80">
                <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-lg text-center font-medium">
                  <div className="p-2 bg-background rounded-md">
                    <span className="text-xs text-muted-foreground block">Answered</span>
                    <span className="text-lg font-bold text-green-600">
                      {Object.keys(answers).length}
                    </span>
                  </div>
                  <div className="p-2 bg-background rounded-md">
                    <span className="text-xs text-muted-foreground block">Unanswered</span>
                    <span className={`text-lg font-bold ${questions.length - Object.keys(answers).length > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                      {Math.max(0, questions.length - Object.keys(answers).length)}
                    </span>
                  </div>
                </div>

                {Object.keys(answers).length < questions.length ? (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      You have attempted <strong>{Object.keys(answers).length}</strong> out of <strong>{questions.length}</strong> questions. Are you sure you want to submit now?
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    You have answered all {questions.length} questions. You cannot modify your answers once submitted.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={isSubmitting} className="cursor-pointer">
              Continue Quiz
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowSubmitConfirmDialog(false);
                handleSubmitQuiz(false);
              }}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white cursor-pointer"
            >
              {isSubmitting ? "Submitting..." : "Yes, Submit Quiz"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
