"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { revalidatePath } from "next/cache";
import { emitSocketEvent } from "@/lib/socket-server";

export interface EventPointData {
  id: string;
  eventNumber: number;
  title: string;
  description: string | null;
  eventDate: Date;
  points: number;
  createdAt: Date;
}

export async function getAllEventPoints() {
  await requireAdmin();
  
  try {
    const events = await prisma.eventPoint.findMany({
      orderBy: {
        eventNumber: 'desc',
      },
    });

    return {
      status: "success" as const,
      data: events,
    };
  } catch (error) {
    console.error("Error fetching event points:", error);
    return {
      status: "error" as const,
      message: "Failed to fetch event points",
    };
  }
}

export async function createEventPoint(data: {
  eventNumber?: number;
  title: string;
  description?: string;
  eventDate: Date;
  points: number;
  createdBy: string;
}) {
  await requireAdmin();
  
  try {
    let finalEventNumber = data.eventNumber;

    if (!finalEventNumber || finalEventNumber <= 0) {
      const latest = await prisma.eventPoint.findFirst({
        orderBy: { eventNumber: "desc" },
        select: { eventNumber: true },
      });
      finalEventNumber = (latest?.eventNumber || 0) + 1;
    } else {
      // Check if event number already exists
      const existingEvent = await prisma.eventPoint.findUnique({
        where: { eventNumber: finalEventNumber },
      });

      if (existingEvent) {
        return {
          status: "error" as const,
          message: `Event #${finalEventNumber} already exists`,
        };
      }
    }

    const event = await prisma.eventPoint.create({
      data: {
        eventNumber: finalEventNumber,
        title: data.title,
        description: data.description || null,
        eventDate: data.eventDate,
        points: data.points,
        createdBy: data.createdBy,
      },
    });

    revalidatePath("/admin/points");

    return {
      status: "success" as const,
      message: "Event created successfully",
      data: event,
    };
  } catch (error) {
    console.error("Error creating event:", error);
    return {
      status: "error" as const,
      message: "Failed to create event",
    };
  }
}

export async function getEventPointById(id: string) {
  await requireAdmin();
  
  try {
    const event = await prisma.eventPoint.findUnique({
      where: { id },
    });

    if (!event) {
      return {
        status: "error" as const,
        message: "Event not found",
      };
    }

    return {
      status: "success" as const,
      data: event,
    };
  } catch (error) {
    console.error("Error fetching event:", error);
    return {
      status: "error" as const,
      message: "Failed to fetch event",
    };
  }
}

export async function getEventPointByNumber(eventNumber: number) {
  await requireAdmin();
  
  try {
    const event = await prisma.eventPoint.findUnique({
      where: { eventNumber },
    });

    if (!event) {
      return {
        status: "error" as const,
        message: "Event not found",
      };
    }

    return {
      status: "success" as const,
      data: event,
    };
  } catch (error) {
    console.error("Error fetching event:", error);
    return {
      status: "error" as const,
      message: "Failed to fetch event",
    };
  }
}

export async function updateEventPoint(
  id: string,
  data: {
    eventNumber: number;
    title: string;
    description?: string;
    eventDate: Date;
    points: number;
  }
) {
  await requireAdmin();
  
  try {
    // Check if event number already exists for a different event
    const existingEvent = await prisma.eventPoint.findUnique({
      where: { eventNumber: data.eventNumber },
    });

    if (existingEvent && existingEvent.id !== id) {
      return {
        status: "error" as const,
        message: "Event number already exists",
      };
    }

    const event = await prisma.eventPoint.update({
      where: { id },
      data: {
        eventNumber: data.eventNumber,
        title: data.title,
        description: data.description || null,
        eventDate: data.eventDate,
        points: data.points,
      },
    });

    revalidatePath("/admin/points");
    revalidatePath(`/admin/points/events/${data.eventNumber}`);

    return {
      status: "success" as const,
      message: "Event updated successfully",
      data: event,
    };
  } catch (error) {
    console.error("Error updating event:", error);
    return {
      status: "error" as const,
      message: "Failed to update event",
    };
  }
}

export async function deleteEventPoint(id: string) {
  await requireAdmin();
  
  try {
    await prisma.eventPoint.delete({
      where: { id },
    });

    revalidatePath("/admin/points");

    return {
      status: "success" as const,
      message: "Event deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting event:", error);
    return {
      status: "error" as const,
      message: "Failed to delete event",
    };
  }
}

export interface MemberForEvent {
  id: string;
  name: string;
  username: string | null;
  registration: string | null;
  branch: string | null;
  admissionYear: string | null;
}

export async function getAllMembers() {
  await requireAdmin();
  
  try {
    const members = await prisma.user.findMany({
      where: {
        profileComplete: true,
        role: { not: "admin" },
      },
      select: {
        id: true,
        name: true,
        username: true,
        registration: true,
        branch: true,
        admissionYear: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      status: "success" as const,
      data: members,
    };
  } catch (error) {
    console.error("Error fetching members:", error);
    return {
      status: "error" as const,
      message: "Failed to fetch members",
    };
  }
}

export async function getEventParticipations(eventId: string) {
  await requireAdmin();
  
  try {
    const participations = await prisma.eventParticipation.findMany({
      where: { eventId },
    });

    const participationMap: Record<string, {
      status: string;
      pointsAwarded: number;
      feedback: string | null;
      participatedAt: Date | null;
      evaluatedAt: Date | null;
    }> = {};
    
    participations.forEach((part: any) => {
      participationMap[part.userId] = {
        status: part.status,
        pointsAwarded: part.pointsAwarded,
        feedback: part.feedback,
        participatedAt: part.participatedAt,
        evaluatedAt: part.evaluatedAt,
      };
    });

    return {
      status: "success" as const,
      data: participationMap,
    };
  } catch (error) {
    console.error("Error fetching event participations:", error);
    return {
      status: "error" as const,
      message: "Failed to fetch participations",
    };
  }
}

export async function evaluateParticipation(
  eventId: string,
  userId: string,
  status: string,
  pointsAwarded: number,
  feedback: string | null,
  evaluatedBy: string
) {
  await requireAdmin();
  
  try {
    const participation = await prisma.eventParticipation.upsert({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
      update: {
        status,
        pointsAwarded,
        feedback,
        evaluatedBy,
        evaluatedAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        eventId,
        userId,
        status,
        pointsAwarded,
        feedback,
        evaluatedBy,
        evaluatedAt: new Date(),
      },
    });

    // Realtime broadcast via Socket.IO
    try {
      const event = await prisma.eventPoint.findUnique({
        where: { id: eventId },
        select: { id: true, title: true, eventNumber: true },
      });
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, cbUserId: true },
      });

      if (event && user) {
        const realtimePayload = {
          type: "event-evaluated",
          eventId: event.id,
          eventTitle: event.title,
          eventNumber: event.eventNumber,
          userId: user.id,
          userName: user.name,
          cbUserId: user.cbUserId,
          points: pointsAwarded,
          status,
          timestamp: new Date().toISOString(),
          message: `Your participation in Event #${event.eventNumber} (${event.title}) has been ${status}${pointsAwarded > 0 ? ` (+${pointsAwarded} points)` : ""}!`,
        };

        await emitSocketEvent(`user-${userId}`, "event-evaluated", realtimePayload);
        await emitSocketEvent("leaderboard", "leaderboard-updated", realtimePayload);
      }
    } catch (broadcastErr) {
      console.warn("Could not broadcast event participation socket event:", broadcastErr);
    }

    revalidatePath(`/admin/points`);
    revalidatePath("/leaderboard");
    revalidatePath("/dashboard");

    return {
      status: "success" as const,
      message: `Participation ${status}${pointsAwarded > 0 ? ` (+${pointsAwarded} points)` : ""}`,
      data: participation,
    };
  } catch (error) {
    console.error("Error evaluating participation:", error);
    return {
      status: "error" as const,
      message: "Failed to evaluate participation",
    };
  }
}
