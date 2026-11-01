"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { DEFAULT_ROADMAPS } from "@/lib/roadmaps/data/default-tracks";
import { cachedFetch, deleteCache, setCache } from "@/lib/cache/redis";
import type { RoadmapData, RoadmapStatus, UserProgressData } from "@/lib/roadmaps/types";

/**
 * Ensures all default roadmaps exist in database without overwriting admin updates
 */
export async function ensureDefaultRoadmaps() {
  try {
    const existing = await prisma.roadmap.findMany({
      select: { slug: true },
    });
    const existingSlugs = new Set(existing.map((r) => r.slug));
    const missingRoadmaps = DEFAULT_ROADMAPS.filter((r) => !existingSlugs.has(r.slug));

    if (missingRoadmaps.length > 0) {
      for (const r of missingRoadmaps) {
        await prisma.roadmap.create({
          data: {
            id: r.id,
            slug: r.slug,
            title: r.title,
            description: r.description,
            category: r.category,
            badgeText: r.badgeText || "Core Track",
            iconName: r.iconName || "Compass",
            nodesJson: JSON.stringify(r.nodes),
            edgesJson: JSON.stringify(r.edges),
            isPublished: true,
            version: 1,
          },
        });
      }
    }
  } catch (err) {
    console.error("Error ensuring default roadmaps:", err);
  }
}

/**
 * Invalidate roadmap caches
 */
export async function invalidateRoadmapCache(slug?: string) {
  if (slug) {
    await deleteCache(`roadmap:raw:${slug}`);
  }
  await deleteCache("roadmaps:published:all");
  await deleteCache("roadmaps:admin:all");
}

/**
 * Get all published roadmaps with member's progress (High Speed Redis Caching)
 */
export async function getPublishedRoadmaps(): Promise<{
  status: "success" | "error";
  data: Array<RoadmapData & { userProgress?: UserProgressData }>;
  message?: string;
}> {
  try {
    await ensureDefaultRoadmaps();

    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const userId = session?.user?.id;

    // Cache the base published roadmaps in Redis/Memory
    const baseRoadmaps = await cachedFetch<RoadmapData[]>(
      "roadmaps:published:all",
      async () => {
        const roadmaps = await prisma.roadmap.findMany({
          where: { isPublished: true },
          orderBy: { createdAt: "asc" },
        });

        return roadmaps.map((r) => ({
          id: r.id,
          slug: r.slug,
          title: r.title,
          description: r.description,
          category: r.category as any,
          badgeText: r.badgeText || undefined,
          iconName: r.iconName || undefined,
          nodes: JSON.parse(r.nodesJson || "[]"),
          edges: JSON.parse(r.edgesJson || "[]"),
          isPublished: r.isPublished,
          version: r.version,
        }));
      },
      3600 // 1 hour TTL
    );

    // Fetch user progress dynamically (fast indexed query)
    let userProgressList: any[] = [];
    if (userId) {
      userProgressList = await prisma.userRoadmapProgress.findMany({
        where: { userId },
      });
    }

    const progressMap = new Map<string, (typeof userProgressList)[0]>();
    userProgressList.forEach((p) => {
      progressMap.set(p.roadmapId, p);
    });

    const data = baseRoadmaps.map((r) => {
      const p = progressMap.get(r.id);
      return {
        ...r,
        userProgress: p
          ? {
              roadmapId: p.roadmapId,
              completedNodeIds: p.completedNodeIds,
              inProgressNodeIds: p.inProgressNodeIds,
              percentage: p.percentage,
              updatedAt: p.updatedAt.toISOString(),
            }
          : undefined,
      };
    });

    return {
      status: "success",
      data,
    };
  } catch (err: any) {
    console.error("Error fetching roadmaps:", err);
    return {
      status: "error",
      data: [],
      message: err?.message || "Failed to fetch roadmaps",
    };
  }
}

/**
 * Get a single roadmap by slug with user progress (High Speed Redis Caching)
 */
export async function getRoadmapBySlug(slug: string): Promise<{
  status: "success" | "error";
  data?: RoadmapData & { userProgress?: UserProgressData };
  message?: string;
}> {
  try {
    await ensureDefaultRoadmaps();

    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const userId = session?.user?.id;

    // Cache the parsed base roadmap in Redis/Memory
    const baseRoadmap = await cachedFetch<RoadmapData | null>(
      `roadmap:raw:${slug}`,
      async () => {
        const roadmap = await prisma.roadmap.findUnique({
          where: { slug },
        });

        if (!roadmap) return null;

        return {
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
        };
      },
      7200 // 2 hours TTL
    );

    if (!baseRoadmap) {
      return {
        status: "error",
        message: "Roadmap not found",
      };
    }

    let progress: UserProgressData | undefined = undefined;
    if (userId) {
      const p = await prisma.userRoadmapProgress.findUnique({
        where: {
          userId_roadmapId: {
            userId,
            roadmapId: baseRoadmap.id,
          },
        },
      });

      if (p) {
        progress = {
          roadmapId: p.roadmapId,
          completedNodeIds: p.completedNodeIds,
          inProgressNodeIds: p.inProgressNodeIds,
          percentage: p.percentage,
          updatedAt: p.updatedAt.toISOString(),
        };
      }
    }

    return {
      status: "success",
      data: {
        ...baseRoadmap,
        userProgress: progress,
      },
    };
  } catch (err: any) {
    console.error("Error fetching roadmap by slug:", err);
    return {
      status: "error",
      message: err?.message || "Failed to fetch roadmap",
    };
  }
}

/**
 * Update member's progress for a specific node in a roadmap
 */
export async function updateNodeProgress(
  roadmapId: string,
  nodeId: string,
  newStatus: RoadmapStatus
): Promise<{
  status: "success" | "error";
  data?: UserProgressData;
  message?: string;
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return {
        status: "error",
        message: "You must be signed in to save progress",
      };
    }

    const userId = session.user.id;

    const roadmap = await prisma.roadmap.findUnique({
      where: { id: roadmapId },
      select: { nodesJson: true },
    });

    if (!roadmap) {
      return {
        status: "error",
        message: "Roadmap not found",
      };
    }

    const allNodes: Array<{ id: string; data?: { isOptional?: boolean } }> = JSON.parse(
      roadmap.nodesJson || "[]"
    );
    const coreNodes = allNodes.filter((n) => !n.data?.isOptional);
    const totalCount = coreNodes.length > 0 ? coreNodes.length : allNodes.length;

    // Get existing progress
    const existing = await prisma.userRoadmapProgress.findUnique({
      where: {
        userId_roadmapId: {
          userId,
          roadmapId,
        },
      },
    });

    let completed = new Set<string>(existing?.completedNodeIds || []);
    let inProgress = new Set<string>(existing?.inProgressNodeIds || []);

    if (newStatus === "completed") {
      completed.add(nodeId);
      inProgress.delete(nodeId);
    } else if (newStatus === "in-progress") {
      inProgress.add(nodeId);
      completed.delete(nodeId);
    } else {
      completed.delete(nodeId);
      inProgress.delete(nodeId);
    }

    const completedArr = Array.from(completed);
    const inProgressArr = Array.from(inProgress);

    // Calculate percentage
    const completedCoreCount = completedArr.filter((id) =>
      coreNodes.some((n) => n.id === id)
    ).length;
    const percentage = Math.min(
      100,
      Math.round((completedCoreCount / (totalCount || 1)) * 100)
    );

    const saved = await prisma.userRoadmapProgress.upsert({
      where: {
        userId_roadmapId: {
          userId,
          roadmapId,
        },
      },
      update: {
        completedNodeIds: completedArr,
        inProgressNodeIds: inProgressArr,
        percentage,
      },
      create: {
        userId,
        roadmapId,
        completedNodeIds: completedArr,
        inProgressNodeIds: inProgressArr,
        percentage,
      },
    });

    return {
      status: "success",
      data: {
        roadmapId: saved.roadmapId,
        completedNodeIds: saved.completedNodeIds,
        inProgressNodeIds: saved.inProgressNodeIds,
        percentage: saved.percentage,
        updatedAt: saved.updatedAt.toISOString(),
      },
    };
  } catch (err: any) {
    console.error("Error updating node progress:", err);
    return {
      status: "error",
      message: err?.message || "Failed to update progress",
    };
  }
}

/**
 * Reset member's roadmap progress
 */
export async function resetRoadmapProgress(roadmapId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { status: "error", message: "Not authenticated" };
    }

    await prisma.userRoadmapProgress.deleteMany({
      where: {
        userId: session.user.id,
        roadmapId,
      },
    });

    return { status: "success" };
  } catch (err: any) {
    console.error("Error resetting roadmap progress:", err);
    return { status: "error", message: "Failed to reset progress" };
  }
}
