import { notFound } from "next/navigation";
import { getRoadmapBySlug } from "../actions";
import { RoadmapCanvas } from "@/components/roadmaps/roadmap-canvas";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface RoadmapCanvasPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: RoadmapCanvasPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getRoadmapBySlug(slug);

  if (result.status !== "success" || !result.data) {
    return { title: "Roadmap | CodeBreakers" };
  }

  return {
    title: `${result.data.title} Roadmap | CodeBreakers`,
    description: result.data.description,
  };
}

export default async function RoadmapCanvasPage({ params }: RoadmapCanvasPageProps) {
  const { slug } = await params;
  const result = await getRoadmapBySlug(slug);

  if (result.status !== "success" || !result.data) {
    notFound();
  }

  return (
    <div className="p-0 m-0 w-full h-[calc(100vh-var(--header-height,3.5rem))] flex flex-col flex-1 overflow-hidden">
      <RoadmapCanvas
        roadmap={result.data}
        initialProgress={result.data.userProgress}
      />
    </div>
  );
}


