import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // Remove GitHub username from user
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        githubUsername: null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "GitHub account unlinked successfully",
    });
  } catch (error) {
    console.error("Error unlinking GitHub account:", error);
    return NextResponse.json(
      { success: false, message: "Failed to unlink GitHub account" },
      { status: 500 }
    );
  }
}
