"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { requireCoAdmin } from "@/app/data/admin/require-co-admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { emitRealtimeEvent } from "@/lib/supabase-server";

export interface BatchItem {
  id: string;
  name: string;
  code: string;
  description: string | null;
  admissionYear: string | null;
  isActive: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BatchMemberItem {
  id: string;
  name: string;
  email: string;
  cbUserId: string | null;
  registration: string | null;
  rollNumber: string | null;
  branch: string | null;
  admissionYear: string | null;
  role: string | null;
  image: string | null;
}

const batchSchema = z.object({
  name: z.string().min(2, "Batch name must be at least 2 characters").max(60),
  code: z.string().min(2, "Batch code must be at least 2 characters").max(30),
  description: z.string().max(255).optional().nullable(),
  admissionYear: z.string().max(20).optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function getBatches(): Promise<{
  success: boolean;
  data?: BatchItem[];
  stats?: {
    totalBatches: number;
    activeBatches: number;
    totalAssignedMembers: number;
    totalUnassignedMembers: number;
  };
  error?: string;
}> {
  try {
    await requireCoAdmin();

    const [batches, totalUsersWithBatch, totalUsersWithoutBatch] = await Promise.all([
      prisma.batch.findMany({
        include: {
          _count: {
            select: { members: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({
        where: { batchId: { not: null } },
      }),
      prisma.user.count({
        where: { batchId: null },
      }),
    ]);

    const formatted: BatchItem[] = batches.map((b) => ({
      id: b.id,
      name: b.name,
      code: b.code,
      description: b.description,
      admissionYear: b.admissionYear,
      isActive: b.isActive,
      memberCount: b._count.members,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    }));

    return {
      success: true,
      data: formatted,
      stats: {
        totalBatches: batches.length,
        activeBatches: batches.filter((b) => b.isActive).length,
        totalAssignedMembers: totalUsersWithBatch,
        totalUnassignedMembers: totalUsersWithoutBatch,
      },
    };
  } catch (error) {
    console.error("Error fetching batches:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load batches.",
    };
  }
}

export async function getActiveBatchesList(): Promise<{
  id: string;
  name: string;
  code: string;
  memberCount: number;
}[]> {
  try {
    const batches = await prisma.batch.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { members: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return batches.map((b) => ({
      id: b.id,
      name: b.name,
      code: b.code,
      memberCount: b._count.members,
    }));
  } catch (error) {
    console.error("Error fetching active batches list:", error);
    return [];
  }
}

export async function createBatch(rawData: z.infer<typeof batchSchema>): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    await requireAdmin();
    const validated = batchSchema.parse(rawData);

    // Check duplicate name or code
    const existing = await prisma.batch.findFirst({
      where: {
        OR: [
          { name: { equals: validated.name.trim(), mode: "insensitive" } },
          { code: { equals: validated.code.trim(), mode: "insensitive" } },
        ],
      },
    });

    if (existing) {
      if (existing.name.toLowerCase() === validated.name.trim().toLowerCase()) {
        return { success: false, error: "A batch with this name already exists." };
      }
      return { success: false, error: "A batch with this code already exists." };
    }

    await prisma.batch.create({
      data: {
        name: validated.name.trim(),
        code: validated.code.trim().toUpperCase(),
        description: validated.description?.trim() || null,
        admissionYear: validated.admissionYear?.trim() || null,
        isActive: validated.isActive ?? true,
      },
    });

    revalidatePath("/admin/batches");
    revalidatePath("/admin/members");
    void emitRealtimeEvent("admin-batches", "batch_change", { action: "createBatch" });
    return { success: true, message: `Batch "${validated.name}" created successfully!` };
  } catch (error) {
    console.error("Error creating batch:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create batch.",
    };
  }
}

export async function updateBatch(
  batchId: string,
  rawData: Partial<z.infer<typeof batchSchema>>
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    await requireAdmin();

    const existing = await prisma.batch.findUnique({
      where: { id: batchId },
    });

    if (!existing) {
      return { success: false, error: "Batch not found." };
    }

    if (rawData.name || rawData.code) {
      const duplicate = await prisma.batch.findFirst({
        where: {
          id: { not: batchId },
          OR: [
            rawData.name ? { name: { equals: rawData.name.trim(), mode: "insensitive" } } : {},
            rawData.code ? { code: { equals: rawData.code.trim(), mode: "insensitive" } } : {},
          ],
        },
      });

      if (duplicate) {
        return { success: false, error: "Another batch already has this name or code." };
      }
    }

    await prisma.batch.update({
      where: { id: batchId },
      data: {
        ...(rawData.name ? { name: rawData.name.trim() } : {}),
        ...(rawData.code ? { code: rawData.code.trim().toUpperCase() } : {}),
        ...(rawData.description !== undefined ? { description: rawData.description?.trim() || null } : {}),
        ...(rawData.admissionYear !== undefined ? { admissionYear: rawData.admissionYear?.trim() || null } : {}),
        ...(rawData.isActive !== undefined ? { isActive: rawData.isActive } : {}),
      },
    });

    revalidatePath("/admin/batches");
    revalidatePath("/admin/members");
    void emitRealtimeEvent("admin-batches", "batch_change", { action: "updateBatch", batchId });
    return { success: true, message: "Batch updated successfully!" };
  } catch (error) {
    console.error("Error updating batch:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update batch.",
    };
  }
}

export async function deleteBatch(batchId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    await requireAdmin();

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        _count: { select: { members: true } },
      },
    });

    if (!batch) {
      return { success: false, error: "Batch not found." };
    }

    // Set batchId to null for all members in this batch first
    await prisma.user.updateMany({
      where: { batchId },
      data: { batchId: null },
    });

    await prisma.batch.delete({
      where: { id: batchId },
    });

    revalidatePath("/admin/batches");
    revalidatePath("/admin/members");
    void emitRealtimeEvent("admin-batches", "batch_change", { action: "deleteBatch", batchId });
    void emitRealtimeEvent("admin-members", "member_change", { action: "unassignBatch", batchId });
    return {
      success: true,
      message: `Batch "${batch.name}" deleted. ${batch._count.members} member(s) unassigned.`,
    };
  } catch (error) {
    console.error("Error deleting batch:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete batch.",
    };
  }
}

export async function getBatchMembers(batchId: string): Promise<{
  success: boolean;
  data?: BatchMemberItem[];
  error?: string;
}> {
  try {
    await requireCoAdmin();

    const members = await prisma.user.findMany({
      where: { batchId },
      select: {
        id: true,
        name: true,
        email: true,
        cbUserId: true,
        registration: true,
        rollNumber: true,
        branch: true,
        admissionYear: true,
        role: true,
        image: true,
      },
      orderBy: { name: "asc" },
    });

    return { success: true, data: members };
  } catch (error) {
    console.error("Error fetching batch members:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch batch members.",
    };
  }
}

export async function getUnassignedMembers(): Promise<{
  success: boolean;
  data?: BatchMemberItem[];
  error?: string;
}> {
  try {
    await requireCoAdmin();

    const members = await prisma.user.findMany({
      where: {
        OR: [
          { batchId: null },
          { batchId: "" },
          { batchId: "none" },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        cbUserId: true,
        registration: true,
        rollNumber: true,
        branch: true,
        admissionYear: true,
        role: true,
        image: true,
      },
      orderBy: { name: "asc" },
    });

    return { success: true, data: members };
  } catch (error) {
    console.error("Error fetching unassigned members:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch unassigned members.",
    };
  }
}

export async function assignMembersToBatch(
  batchId: string,
  userIds: string[]
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    await requireCoAdmin();

    if (!userIds || userIds.length === 0) {
      return { success: false, error: "No members selected." };
    }

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      return { success: false, error: "Target batch not found." };
    }

    await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { batchId },
    });

    revalidatePath("/admin/batches");
    revalidatePath("/admin/members");
    void emitRealtimeEvent("admin-batches", "batch_change", { action: "assignMembers", batchId });
    void emitRealtimeEvent("admin-members", "member_change", { action: "assignBatch", batchId });
    return {
      success: true,
      message: `Assigned ${userIds.length} student(s) to "${batch.name}".`,
    };
  } catch (error) {
    console.error("Error assigning members to batch:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to assign members.",
    };
  }
}

export async function removeMembersFromBatch(userIds: string[]): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    await requireAdmin();

    if (!userIds || userIds.length === 0) {
      return { success: false, error: "No members selected." };
    }

    await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { batchId: null },
    });

    revalidatePath("/admin/batches");
    revalidatePath("/admin/members");
    void emitRealtimeEvent("admin-batches", "batch_change", { action: "removeMembers" });
    void emitRealtimeEvent("admin-members", "member_change", { action: "removeBatch" });
    return {
      success: true,
      message: `Removed ${userIds.length} student(s) from batch.`,
    };
  } catch (error) {
    console.error("Error removing members from batch:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove members.",
    };
  }
}
