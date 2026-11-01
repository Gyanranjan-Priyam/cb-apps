import { Metadata } from "next";
import { getAdminRoadmaps } from "@/app/admin/roadmaps/actions";
import { AdminRoadmapsClient } from "@/app/admin/roadmaps/_components/admin-roadmaps-client";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Roadmaps Management | Co-Admin",
  description: "Create, edit, and publish interactive visual learning roadmaps",
};

export const dynamic = "force-dynamic";

export default async function CoAdminRoadmapsPage() {
  const result = await getAdminRoadmaps();
  const roadmaps = result.status === "success" ? result.data : [];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 w-full">
      <PageHeader
        title="Visual Roadmaps"
        description="Create and customize interactive node roadmaps with full access."
        showBackButton={false}
      />

      <AdminRoadmapsClient initialRoadmaps={roadmaps} baseUrl="/co-admin/roadmaps" />
    </div>
  );
}
