import { getBatches } from "./actions";
import { BatchesClient } from "./_components/batches-client";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = {
  title: "Batches | Admin Panel",
  description: "Manage student cohorts and batches, assign members, and target activities.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminBatchesPage() {
  const result = await getBatches();
  const batches = result.data || [];
  const stats = result.stats;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 w-full">
      <PageHeader
        title="Batches"
        description="Organize students into batches. Assign tasks, attendance sessions, quizzes, and leaderboards to specific batches."
        showBackButton={false}
      />

      <BatchesClient initialBatches={batches} stats={stats} />
    </div>
  );
}
