import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/services/notification.service";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasAdminOrCoAdminAccess } from "@/lib/member-roles";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || !hasAdminOrCoAdminAccess(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { userId, email, title, message, htmlEmail, type, room } = body;

    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: "Title and message are required" },
        { status: 400 }
      );
    }

    if (room) {
      await NotificationService.sendRealtimeNotification({
        room,
        title,
        message,
        type,
      });
    } else {
      await NotificationService.dispatchNotification({
        userId,
        email,
        title,
        message,
        htmlEmail,
        type,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Notification dispatched successfully",
    });
  } catch (error: any) {
    console.error("V1 dispatch notification error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to dispatch notification" },
      { status: 500 }
    );
  }
}
