import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const [events, total] = await Promise.all([
      prisma.eventPoint.findMany({
        orderBy: { eventDate: "desc" },
        include: {
          _count: {
            select: { participations: true },
          },
        },
        take: limit,
        skip: offset,
      }),
      prisma.eventPoint.count(),
    ]);

    return NextResponse.json({
      success: true,
      events,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error: any) {
    console.error("V1 Events GET error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { eventNumber, title, description, eventDate, points } = body;

    if (!title || !eventDate) {
      return NextResponse.json(
        { success: false, error: "Title and eventDate are required" },
        { status: 400 }
      );
    }

    // Determine event number if not passed
    let finalEventNum = eventNumber;
    if (!finalEventNum) {
      const lastEvent = await prisma.eventPoint.findFirst({
        orderBy: { eventNumber: "desc" },
      });
      finalEventNum = (lastEvent?.eventNumber || 0) + 1;
    }

    const newEvent = await prisma.eventPoint.create({
      data: {
        eventNumber: finalEventNum,
        title,
        description: description || null,
        eventDate: new Date(eventDate),
        points: Number(points) || 0,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json({ success: true, event: newEvent }, { status: 201 });
  } catch (error: any) {
    console.error("V1 Events POST error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create event" },
      { status: 500 }
    );
  }
}
