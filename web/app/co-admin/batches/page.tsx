import { getBatches } from "@/app/admin/batches/actions";
import { BatchesClient } from "@/app/admin/batches/_components/batches-client";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = {
  title: "Batches (Add Students) | Co-Admin",
  description: "View batches and add/assign students to batches.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CoAdminBatchesPage() {
  const result = await getBatches();
  const batches = result.data || [];
  const stats = result.stats;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 w-full">
      <PageHeader
        title="Student Batches"
        description="View batches, check enrolled students, and assign new unassigned students to batches."
        showBackButton={false}
      />

      <BatchesClient initialBatches={batches} stats={stats} canManageBatches={false} />
    </div>
  );
}
