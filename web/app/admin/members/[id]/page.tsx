import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { getMemberBySlugId, getMemberStats } from "../actions";
import MemberDetails from "./_components/member-details";
import MemberSidebar from "./_components/member-sidebar";

export const metadata: Metadata = {
  title: "Member Details | Admin Panel",
  description: "View detailed information about a member.",
};

interface MemberDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function MemberDetailPage({ params }: MemberDetailPageProps) {
  const { id } = await params;
  const result = await getMemberBySlugId(id);

  if (result.status === "error" || !result.data) {
    notFound();
  }

  const member = result.data;
  
  // Fetch member statistics
  const statsResult = await getMemberStats(member.id);
  const stats = statsResult.status === "success" ? statsResult.data : null;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl">
      <PageHeader
        title={member.name}
        description={`Member details for ${member.email}`}
        showBackButton={false}
      />
      
      <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Member Details */}
        <div className="lg:col-span-8 space-y-6">
          <MemberDetails member={member} />
        </div>
        
        {/* Right Column - Sticky Sidebar */}
        <div className="lg:col-span-4">
          <MemberSidebar member={member} stats={stats} />
        </div>
      </div>
    </div>
  );
}
