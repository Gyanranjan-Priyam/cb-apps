import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, Layers } from "lucide-react";
import { getOverallLeaderboard, getMonthlyLeaderboard } from "./actions";
import OverallLeaderboard from "./_components/overall-leaderboard";
import MonthlyLeaderboard from "./_components/monthly-leaderboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "View top performers and your ranking based on points earned",
};

// Disable caching for this page to ensure leaderboard updates immediately
export const dynamic = "force-dynamic";

interface LeaderboardPageProps {
  searchParams?: Promise<{ batch?: string }>;
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const requestedBatch = resolvedParams?.batch;

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // Run overall and monthly leaderboard queries in parallel
  const [overallResult, monthlyResult] = await Promise.all([
    getOverallLeaderboard(requestedBatch),
    getMonthlyLeaderboard(currentYear, currentMonth, requestedBatch),
  ]);

  const overallData = overallResult.status === "success" ? overallResult.data : [];
  const studentBatch = overallResult.studentBatch;
  const monthlyData = monthlyResult.status === "success" ? monthlyResult.data : [];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Leaderboard
          </h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Track top performers based on points earned
          </p>
        </div>

        {studentBatch && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge
              variant="outline"
              className="px-3 py-1 text-xs gap-1.5 bg-primary/5 text-primary border-primary/20 font-medium"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Cohort: {studentBatch.name} ({studentBatch.code})</span>
            </Badge>
          </div>
        )}
      </div>

      <Tabs defaultValue="overall" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overall" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Overall Leaderboard</span>
            <span className="sm:hidden">Overall</span>
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Monthly Leaderboard</span>
            <span className="sm:hidden">Monthly</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overall" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Overall Top Performers</CardTitle>
              <CardDescription>
                {studentBatch
                  ? `All-time leaderboard ranking for ${studentBatch.name}`
                  : "All-time leaderboard based on total points"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OverallLeaderboard data={overallData} batchId={studentBatch?.id || requestedBatch} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Top Performers</CardTitle>
              <CardDescription>
                {studentBatch
                  ? `Leaderboard for selected month (${studentBatch.name})`
                  : "Leaderboard for selected month based on points earned"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlyLeaderboard 
                initialData={monthlyData}
                currentYear={currentYear}
                currentMonth={currentMonth}
                batchId={studentBatch?.id || requestedBatch}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}