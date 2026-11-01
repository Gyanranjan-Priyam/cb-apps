import { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { getCoAdminMembers } from "@/app/admin/members/actions";
import { CoAdminMembersTable } from "./_components/co-admin-members-table";

export const metadata: Metadata = {
  title: "Members Directory | Co-Admin",
  description: "View registered members, batches, domains, and academic branches.",
};

export const dynamic = "force-dynamic";

export default async function CoAdminMembersPage() {
  const result = await getCoAdminMembers();
  const members = result.status === "success" ? result.data : [];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 w-full">
      <PageHeader
        title="Member Directory"
        description="View registered students, their assigned batch, specialized domain, user ID, email, and academic branch."
        showBackButton={false}
      />

      <CoAdminMembersTable members={members} />
    </div>
  );
}
