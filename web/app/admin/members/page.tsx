import { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { getAllMembers, getMembersStats } from "./actions";
import MembersTable from "./_components/members-table";
import MembersStats from "./_components/members-stats";

export const metadata: Metadata = {
  title: "Members | Admin Panel",
  description: "Manage registered members and their details.",
};

export default async function MembersPage() {
  const [membersResult, statsResult] = await Promise.all([
    getAllMembers(),
    getMembersStats(),
  ]);

  if (membersResult.status === "error") {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6 w-full">
        <PageHeader
          title="Members"
          description="Manage registered members and their details."
          showBackButton={false}
        />
        <div className="p-4 border border-destructive rounded-lg bg-destructive/10">
          <p className="text-destructive">Error: {membersResult.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 w-full">
      <PageHeader
        title="Members"
        description="Manage registered members and their details. View member information, registration details, and manage member status."
        showBackButton={false}
      />
      
      <div className="space-y-4 sm:space-y-6">
        {/* Statistics Overview */}
        {statsResult.status === "success" && (
          <MembersStats stats={statsResult.data} />
        )}
        
        {/* Members Table */}
        <MembersTable members={membersResult.data} />
      </div>
    </div>
  );
}
