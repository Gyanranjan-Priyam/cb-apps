"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export async function getUserAttendanceHistory() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  try {
    const attendances = await prisma.attendance.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        session: {
          select: {
            sessionNumber: true,
            title: true,
            date: true,
            day: true,
          },
        },
      },
      orderBy: {
        markedAt: "desc",
      },
    });

    const stats = {
      total: attendances.length,
      present: attendances.filter((a) => a.status === "present").length,
      totalPoints: attendances.reduce((sum, a) => sum + a.points, 0),
    };

    return {
      success: true,
      attendances,
      stats,
    };
  } catch (error) {
    console.error("Error fetching attendance history:", error);
    return {
      success: false,
      error: "Failed to fetch attendance history",
    };
  }
}

export async function getUserProfileForAttendancePass() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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
        batch: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    return {
      success: true,
      user,
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return {
      success: false,
      error: "Failed to fetch user profile",
    };
  }
}
