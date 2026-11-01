"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, Play, CheckCircle2, Calendar, Lock, Timer, ShieldBan } from "lucide-react";
import { getQuizzesData } from "./actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function QuizzesPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [userAttempts, setUserAttempts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showBlockedDialog, setShowBlockedDialog] = useState(false);

  // Check for ban status changes on visibility change or window focus
  useEffect(() => {
    if (!user) return;

    const checkBanStatus = async () => {
      try {
        const result = await getQuizzesData();
        if (result.status === "success") {
          const wasBanned = user.banned;
          const isNowBanned = result.data.user.banned;
          
          if (wasBanned !== isNowBanned) {
            setUser(result.data.user);
            setQuizzes(result.data.quizzes);
            setUserAttempts(result.data.attempts);
            
            if (isNowBanned) {
              setShowBlockedDialog(true);
              toast.error("You have been blocked from accessing quizzes");
            } else {
              setShowBlockedDialog(false);
              toast.success("You have been unblocked! You can now access quizzes.");
              router.refresh();
            }
          }
        }
      } catch (error) {
        console.error("Error checking ban status:", error);
      }
    };

    window.addEventListener("focus", checkBanStatus);
    document.addEventListener("visibilitychange", checkBanStatus);

    return () => {
      window.removeEventListener("focus", checkBanStatus);
      document.removeEventListener("visibilitychange", checkBanStatus);
    };
  }, [user, router]);

  // Update current time every second for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getQuizzesData();
        
        if (result.status === "error") {
          if (result.message === "Not authenticated") {
            router.push("/login");
            return;
          }
          setError(result.message);
        } else {
          setUser(result.data.user);
          setQuizzes(result.data.quizzes);
          setUserAttempts(result.data.attempts);
          
          // Check if user is banned
          if (result.data.user.banned) {
            setShowBlockedDialog(true);
          }
        }
      } catch (err) {
        setError("An error occurred while loading quizzes");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const getTimeRemaining = (targetDate: Date) => {
    const diff = targetDate.getTime() - currentTime.getTime();
    if (diff <= 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Available Quizzes
          </h1>
          <p className="text-muted-foreground mt-2">
            Test your knowledge and earn points
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading quizzes...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Available Quizzes
          </h1>
          <p className="text-muted-foreground mt-2">
            Test your knowledge and earn points
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Create a map of quiz attempts for quick lookup
  const attemptMap = new Map(
    userAttempts.map((a: any) => [`${a.quizId}`, a])
  );

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Available Quizzes
        </h1>
        <p className="text-muted-foreground mt-2">
          Test your knowledge and earn points
        </p>
      </div>

      {quizzes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No active quizzes available at the moment</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {quizzes.map((quiz) => {
            const hasAttempted = attemptMap.has(quiz.id);
            const isAvailable = quiz.availabilityStatus === 'available';
            const isNotStarted = quiz.availabilityStatus === 'not_started';
            const isExpired = quiz.availabilityStatus === 'expired';
            
            let timeInfo = null;
            if (isNotStarted && quiz.startDateTime) {
              const timeUntilStart = getTimeRemaining(new Date(quiz.startDateTime));
              if (timeUntilStart) {
                timeInfo = { label: "Starts in", value: timeUntilStart, color: "text-blue-600" };
              }
            } else if (isAvailable && quiz.endDateTime) {
              const timeUntilEnd = getTimeRemaining(new Date(quiz.endDateTime));
              if (timeUntilEnd) {
                timeInfo = { label: "Ends in", value: timeUntilEnd, color: "text-orange-600" };
              }
            }
            
            return (
              <Card 
                key={quiz.id} 
                className={`hover:shadow-md transition-shadow ${
                  !isAvailable && !hasAttempted ? 'opacity-75 border-muted' : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {/* Left Section - Quiz Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-semibold">{quiz.title}</h3>
                            {hasAttempted && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Attempted
                              </Badge>
                            )}
                            {isNotStarted && !hasAttempted && (
                              <Badge variant="outline" className="flex items-center gap-1 border-blue-500 text-blue-600">
                                <Lock className="h-3 w-3" />
                                Not Started
                              </Badge>
                            )}
                            {isExpired && !hasAttempted && (
                              <Badge variant="outline" className="flex items-center gap-1 border-red-500 text-red-600">
                                <Lock className="h-3 w-3" />
                                Expired
                              </Badge>
                            )}
                            {isAvailable && !hasAttempted && (
                              <Badge variant="default" className="flex items-center gap-1 bg-green-600">
                                <Play className="h-3 w-3" />
                                Available Now
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {quiz.description}
                          </p>
                        </div>
                      </div>

                      {/* Quiz Details */}
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{quiz.duration} min</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span>{quiz.sets} set{quiz.sets > 1 ? 's' : ''}</span>
                        </div>
                        <Badge variant="outline">{quiz.pointsPerQuestion} pts/question</Badge>
                        <Badge variant="outline">{quiz._count.attempts} attempts</Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          {quiz.quizId}
                        </span>
                      </div>

                      {/* Date/Time Info with Countdown */}
                      {(quiz.startDateTime || quiz.endDateTime || timeInfo) && (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            {quiz.startDateTime && (
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3 w-3" />
                                <span>Starts: {new Date(quiz.startDateTime).toLocaleString()}</span>
                              </div>
                            )}
                            {quiz.endDateTime && (
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3 w-3" />
                                <span>Ends: {new Date(quiz.endDateTime).toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                          {timeInfo && (
                            <div className={`flex items-center gap-1.5 text-sm font-medium ${timeInfo.color}`}>
                              <Timer className="h-4 w-4" />
                              <span>{timeInfo.label}: {timeInfo.value}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right Section - Action Button */}
                    <div className="w-full sm:w-auto">
                      {!isAvailable && !hasAttempted ? (
                        <Button disabled className="w-full sm:w-auto min-w-[140px]">
                          <Lock className="h-4 w-4 mr-2" />
                          {isNotStarted && 'Not Started Yet'}
                          {isExpired && 'Quiz Expired'}
                        </Button>
                      ) : hasAttempted ? (
                        <Button 
                          onClick={() => {
                            const attempt = attemptMap.get(quiz.id);
                            router.push(`/dashboard/activities/quizzes/results/${attempt.id}`);
                          }}
                          variant="outline"
                          className="w-full cursor-pointer sm:w-auto min-w-[140px]"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2 cursor-pointer" />
                          View Results
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => {
                            // Check if user is banned before opening quiz
                            if (user?.banned) {
                              setShowBlockedDialog(true);
                              return;
                            }
                            const identifier = (user as any).registration || (user as any).username || user.id;
                            const url = `/quiz/${quiz.quizId}/${identifier}`;
                            window.open(
                              url,
                              'QuizWindow',
                              'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes'
                            );
                          }}
                          className="w-full sm:w-auto min-w-[140px] cursor-pointer bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start Quiz
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Blocked User Dialog */}
      <AlertDialog open={showBlockedDialog} onOpenChange={setShowBlockedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <ShieldBan className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-xl">
              Access Blocked
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-3">
              <p className="text-base">
                You have been blocked from accessing quizzes.
              </p>
              {user?.banReason && (
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <p className="text-sm font-medium text-destructive mb-1">Reason:</p>
                  <p className="text-sm text-foreground">{user.banReason}</p>
                </div>
              )}
              {user?.banExpires && (
                <p className="text-sm">
                  Ban expires: {new Date(user.banExpires).toLocaleString()}
                </p>
              )}
              <p className="text-sm pt-2">
                Please contact the CodeBreakers coordinators for assistance.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBlockedDialog(false)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}