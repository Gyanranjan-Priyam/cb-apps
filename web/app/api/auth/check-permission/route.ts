import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body?.email?.trim()?.toLowerCase();

    if (!email) {
      return NextResponse.json(
        { allowed: false, reason: "invalid_email", message: "Please provide a valid email." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        banned: true,
        banReason: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          allowed: false,
          reason: "not_found",
          message:
            "Unauthorized Access: Your email is not registered as a member. Only members added by an admin can log in. If you are a member, please contact the administrator.",
        },
        { status: 403 }
      );
    }

    if (user.banned) {
      return NextResponse.json(
        {
          allowed: false,
          reason: "banned",
          message: `Account Banned: ${
            user.banReason || "Your account access has been restricted by an administrator."
          }`,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      allowed: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("check-permission error:", error);
    return NextResponse.json(
      { allowed: false, reason: "server_error", message: error?.message || "Error verifying permission." },
      { status: 500 }
    );
  }
}
