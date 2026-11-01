import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { emitSocketEvent } from "@/lib/socket";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const event = await prisma.eventPoint.findFirst({
      where: {
        OR: [{ id }, !isNaN(Number(id)) ? { eventNumber: parseInt(id) } : {}],
      },
    });

    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
    }

    // Upsert participation
    const participation = await prisma.eventParticipation.upsert({
      where: {
        eventId_userId: {
          eventId: event.id,
          userId: session.user.id,
        },
      },
      update: {
        status: "participated",
        participatedAt: new Date(),
      },
      create: {
        eventId: event.id,
        userId: session.user.id,
        status: "participated",
        participatedAt: new Date(),
      },
    });

    await emitSocketEvent(`event-${event.id}`, "participation-updated", {
      eventId: event.id,
      userId: session.user.id,
      userName: session.user.name,
      status: "participated",
    });

    return NextResponse.json({
      success: true,
      message: "Participation recorded successfully",
      participation,
    });
  } catch (error: any) {
    console.error("V1 Event Participate error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to record participation" },
      { status: 500 }
    );
  }
}
