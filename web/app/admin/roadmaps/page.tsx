import { Metadata } from "next";
import { getAdminRoadmaps } from "./actions";
import { AdminRoadmapsClient } from "./_components/admin-roadmaps-client";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Roadmaps Management | Admin Panel",
  description: "Create, edit, and publish interactive visual learning roadmaps with zero redeployments.",
};

export const dynamic = "force-dynamic";

export default async function AdminRoadmapsPage() {
  const result = await getAdminRoadmaps();
  const roadmaps = result.status === "success" ? result.data : [];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 w-full">
      <PageHeader
        title="Visual Roadmaps"
        description="Create and customize interactive node roadmaps. Changes take effect immediately without redeploying."
        showBackButton={false}
      />

      <AdminRoadmapsClient initialRoadmaps={roadmaps} />
    </div>
  );
}
