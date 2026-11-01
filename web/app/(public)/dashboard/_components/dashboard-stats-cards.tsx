"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {  Trophy, CheckSquare, BrainCircuit, Calendar, ArrowRight, Info } from "lucide-react";
import { DashboardStats } from "../actions";
import Link from "next/link";

interface DashboardStatsCardsProps {
  stats: DashboardStats;
}

interface StatDialogContent {
  title: string;
  description: string;
  details: string;
  actionLabel: string;
  actionHref: string;
  tips?: string[];
}

export function DashboardStatsCards({ stats }: DashboardStatsCardsProps) {
  const [selectedStat, setSelectedStat] = useState<StatDialogContent | null>(null);

  const getDialogContent = (title: string): StatDialogContent => {
    switch (title) {
      case "Total Points":
        return {
          title: "Your Points Overview",
          description: `You have earned ${stats.totalPoints} points in total from various activities.`,
          details: "Points are earned from:\n• Attending sessions and events\n• Completing tasks and assignments\n• Taking quizzes and achieving high scores\n• Participating in team activities\n\nYour points contribute to your leaderboard ranking and unlock achievements.",
          actionLabel: "View Leaderboard",
          actionHref: "/dashboard/leaderboard",
          tips: [
            "Complete pending tasks to earn more points",
            "Participate in events for bonus points",
            "Achieve high quiz scores for maximum rewards"
          ]
        };
      case "Pending Tasks":
        return {
          title: "Pending Tasks",
          description: `You have ${stats.pendingTasks} task${stats.pendingTasks !== 1 ? 's' : ''} waiting for submission.`,
          details: stats.pendingTasks > 0 
            ? "These tasks are currently available and have not been submitted yet. Complete them before the deadline to earn points and maintain your progress."
            : "Great job! You have completed all available tasks. Check back later for new assignments.",
          actionLabel: stats.pendingTasks > 0 ? "View Pending Tasks" : "Browse All Tasks",
          actionHref: "/dashboard/tasks",
          tips: stats.pendingTasks > 0 ? [
            "Check the due dates to prioritize tasks",
            "Read instructions carefully before submitting",
            "Submit your work before the deadline"
          ] : [
            "Keep checking for new task assignments",
            "Review past submissions for feedback"
          ]
        };
      case "Active Quizzes":
        return {
          title: "Active Quizzes",
          description: `${stats.activeQuizzes} quiz${stats.activeQuizzes !== 1 ? 'zes are' : ' is'} currently available for you to take.`,
          details: stats.activeQuizzes > 0
            ? "These quizzes are active and within their scheduled time window. Take them now to test your knowledge and earn points based on your performance."
            : "No quizzes are currently active. New quizzes will be available according to the schedule.",
          actionLabel: stats.activeQuizzes > 0 ? "Take a Quiz" : "View All Quizzes",
          actionHref: "/dashboard/activities/quizzes",
          tips: stats.activeQuizzes > 0 ? [
            "Quizzes may have time limits - be prepared",
            "Read questions carefully before answering",
            "Higher scores earn more points"
          ] : [
            "Check quiz schedules for upcoming opportunities",
            "Review past quiz results to improve"
          ]
        };
      case "Upcoming Events":
        return {
          title: "Upcoming Events",
          description: `${stats.upcomingEvents} event${stats.upcomingEvents !== 1 ? 's are' : ' is'} scheduled in the near future.`,
          details: stats.upcomingEvents > 0
            ? "These events are coming soon. Mark your calendar and prepare to participate. Attending events helps you earn points and stay engaged with the community."
            : "No upcoming events are currently scheduled. New events will be announced soon.",
          actionLabel: "View Events Calendar",
          actionHref: "/dashboard/events",
          tips: stats.upcomingEvents > 0 ? [
            "Check event details and requirements",
            "Set reminders for event dates",
            "Prepare any materials needed in advance"
          ] : [
            "Stay tuned for event announcements",
            "Review past events for insights"
          ]
        };
      default:
        return {
          title: title,
          description: "Detailed information about this statistic.",
          details: "This metric helps you track your progress and engagement.",
          actionLabel: "Learn More",
          actionHref: "/dashboard",
          tips: []
        };
    }
  };

  const cards = [
    {
      title: "Total Points",
      value: stats.totalPoints,
      icon: Trophy,
      description: "Earned from all activities",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
    },
    {
      title: "Pending Tasks",
      value: stats.pendingTasks,
      icon: CheckSquare,
      description: "Tasks waiting for submission",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      title: "Active Quizzes",
      value: stats.activeQuizzes,
      icon: BrainCircuit,
      description: "Quizzes currently available",
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
    },
    {
      title: "Upcoming Events",
      value: stats.upcomingEvents,
      icon: Calendar,
      description: "Events scheduled soon",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
  ];

  return (
    <>
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <Card 
            key={index} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedStat(getDialogContent(card.title))}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground truncate">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedStat} onOpenChange={() => setSelectedStat(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              {selectedStat?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedStat?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm whitespace-pre-line leading-relaxed">
                {selectedStat?.details}
              </p>
            </div>

            {selectedStat?.tips && selectedStat.tips.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <span className="text-primary">💡</span> Quick Tips
                </h4>
                <ul className="space-y-1.5">
                  {selectedStat.tips.map((tip, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button className="w-full" asChild>
              <Link href={selectedStat?.actionHref || "/dashboard"}>
                {selectedStat?.actionLabel}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}