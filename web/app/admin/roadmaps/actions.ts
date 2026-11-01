/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { DEFAULT_ROADMAPS } from "@/lib/roadmaps/data/default-tracks";
import { parseMermaidToRoadmap } from "@/lib/roadmaps/mermaid-parser";
import { isSystemAdminRole, hasAdminOrCoAdminAccess } from "@/lib/member-roles";

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || !hasAdminOrCoAdminAccess((session.user as any).role)) {
    throw new Error("Unauthorized: Admin or Co-Admin privileges required");
  }

  return session.user;
}

/**
 * Get all roadmaps for admin panel
 */
export async function getAdminRoadmaps() {
  try {
    await requireAdmin();

    const roadmaps = await prisma.roadmap.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { userProgress: true },
        },
      },
    });

    const parsed = roadmaps.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      description: r.description,
      category: r.category,
      badgeText: r.badgeText,
      iconName: r.iconName,
      nodesCount: JSON.parse(r.nodesJson || "[]").length,
      edgesCount: JSON.parse(r.edgesJson || "[]").length,
      isPublished: r.isPublished,
      version: r.version,
      membersEnrolled: r._count.userProgress,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    return { status: "success" as const, data: parsed };
  } catch (err: any) {
    console.error("Admin fetch roadmaps error:", err);
    return { status: "error" as const, message: err.message || "Failed to fetch roadmaps" };
  }
}

/**
 * Get single roadmap details for admin studio
 */
export async function getAdminRoadmapById(id: string) {
  try {
    await requireAdmin();

    const roadmap = await prisma.roadmap.findUnique({
      where: { id },
    });

    if (!roadmap) {
      return { status: "error" as const, message: "Roadmap not found" };
    }

    return {
      status: "success" as const,
      data: {
        id: roadmap.id,
        slug: roadmap.slug,
        title: roadmap.title,
        description: roadmap.description,
        category: roadmap.category as any,
        badgeText: roadmap.badgeText || undefined,
        iconName: roadmap.iconName || undefined,
        nodes: JSON.parse(roadmap.nodesJson || "[]"),
        edges: JSON.parse(roadmap.edgesJson || "[]"),
        isPublished: roadmap.isPublished,
        version: roadmap.version,
      },
    };
  } catch (err: any) {
    return { status: "error" as const, message: err.message };
  }
}

/**
 * Save / Update roadmap graph nodes, edges & metadata
 * ZERO REDEPLOY NEEDED - Live in < 1 second!
 */
export async function updateAdminRoadmap(
  id: string,
  data: {
    title: string;
    description: string;
    category: string;
    badgeText?: string;
    iconName?: string;
    nodes: any[];
    edges: any[];
    isPublished?: boolean;
  }
) {
  try {
    await requireAdmin();

    const updated = await prisma.roadmap.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        badgeText: data.badgeText,
        iconName: data.iconName,
        nodesJson: JSON.stringify(data.nodes),
        edgesJson: JSON.stringify(data.edges),
        isPublished: data.isPublished !== undefined ? data.isPublished : true,
        version: { increment: 1 },
      },
    });

    const { invalidateRoadmapCache } = await import("@/app/(public)/dashboard/roadmaps/actions");
    await invalidateRoadmapCache(updated.slug);

    revalidatePath("/dashboard/roadmaps");
    revalidatePath(`/dashboard/roadmaps/${updated.slug}`);
    revalidatePath("/admin/roadmaps");
    revalidatePath(`/admin/roadmaps/${id}`);

    return {
      status: "success" as const,
      message: "Roadmap updated and live for all members!",
      data: updated,
    };
  } catch (err: any) {
    console.error("Update roadmap error:", err);
    return { status: "error" as const, message: err.message };
  }
}

/**
 * Create a new roadmap
 */
export async function createAdminRoadmap(data: {
  title: string;
  slug: string;
  description: string;
  category: string;
  badgeText?: string;
  iconName?: string;
  templateId?: string;
  mermaidCode?: string;
}) {
  try {
    const admin = await requireAdmin();

    let nodes: any[] = [];
    let edges: any[] = [];

    if (data.mermaidCode && data.mermaidCode.trim()) {
      const parsed = parseMermaidToRoadmap(data.mermaidCode);
      nodes = parsed.nodes;
      edges = parsed.edges;
    } else if (data.templateId) {
      const tmpl = DEFAULT_ROADMAPS.find((r) => r.id === data.templateId);
      if (tmpl) {
        nodes = tmpl.nodes;
        edges = tmpl.edges;
      }
    }

    const created = await prisma.roadmap.create({
      data: {
        title: data.title,
        slug: data.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        description: data.description,
        category: data.category,
        badgeText: data.badgeText || "New Track",
        iconName: data.iconName || "Compass",
        nodesJson: JSON.stringify(nodes),
        edgesJson: JSON.stringify(edges),
        isPublished: true,
        createdBy: admin.id,
      },
    });

    const { invalidateRoadmapCache } = await import("@/app/(public)/dashboard/roadmaps/actions");
    await invalidateRoadmapCache(created.slug);

    revalidatePath("/dashboard/roadmaps");
    revalidatePath("/admin/roadmaps");

    return { status: "success" as const, data: created };
  } catch (err: any) {
    return { status: "error" as const, message: err.message };
  }
}

/**
 * Delete a roadmap
 */
export async function deleteAdminRoadmap(id: string) {
  try {
    await requireAdmin();

    const deleted = await prisma.roadmap.delete({
      where: { id },
    });

    const { invalidateRoadmapCache } = await import("@/app/(public)/dashboard/roadmaps/actions");
    await invalidateRoadmapCache(deleted.slug);

    revalidatePath("/dashboard/roadmaps");
    revalidatePath("/admin/roadmaps");

    return { status: "success" as const, message: "Roadmap deleted" };
  } catch (err: any) {
    return { status: "error" as const, message: err.message };
  }
}
