import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/data/admin/require-admin";
import {
  getOverallLeaderboard,
  getMonthlyLeaderboard,
} from "@/app/(public)/dashboard/leaderboard/actions";
import { AdminLeaderboardView } from "./_components/admin-leaderboard-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard & Student Progress | Admin",
  description:
    "Track student progress, rankings, and point distributions across batches in CodeBreakers.",
};

export const dynamic = "force-dynamic";

export default async function AdminLeaderboardPage() {
  // Ensure system admin access
  await requireAdmin();

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // Parallelize overall leaderboard, monthly leaderboard, and batch list queries
  const [overallResult, monthlyResult, batches] = await Promise.all([
    getOverallLeaderboard("all"),
    getMonthlyLeaderboard(currentYear, currentMonth, "all"),
    prisma.batch.findMany({
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  const overallData =
    overallResult.status === "success" ? overallResult.data : [];
  const monthlyData =
    monthlyResult.status === "success" ? monthlyResult.data : [];

  return (
    <AdminLeaderboardView
      initialOverallData={overallData}
      initialMonthlyData={monthlyData}
      batches={batches}
      currentYear={currentYear}
      currentMonth={currentMonth}
    />
  );
}
