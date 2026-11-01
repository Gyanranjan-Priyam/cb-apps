import { notFound } from "next/navigation";
import { getAdminRoadmapById, getAdminRoadmaps } from "@/app/admin/roadmaps/actions";
import { AdminStudioEditor } from "@/components/roadmaps/admin-studio-editor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Roadmap Visual Studio | Co-Admin",
};

export const dynamic = "force-dynamic";

interface CoAdminRoadmapStudioPageProps {
  params: Promise<{ roadmapId: string }>;
}

export default async function CoAdminRoadmapStudioPage({ params }: CoAdminRoadmapStudioPageProps) {
  const { roadmapId } = await params;
  const [result, allRoadmapsRes] = await Promise.all([
    getAdminRoadmapById(roadmapId),
    getAdminRoadmaps(),
  ]);

  if (result.status !== "success" || !result.data) {
    notFound();
  }

  const availableRoadmaps = (allRoadmapsRes.data || []).map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    category: r.category,
  }));

  return (
    <div className="w-full h-[calc(100vh-var(--header-height,3.5rem))] p-0 m-0 overflow-hidden flex flex-col flex-1">
      <AdminStudioEditor roadmap={result.data} availableRoadmaps={availableRoadmaps} />
    </div>
  );
}
