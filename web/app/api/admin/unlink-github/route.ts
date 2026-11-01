import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        githubUsername: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "GitHub account unlinked successfully",
    });
  } catch (error) {
    console.error("Error unlinking GitHub:", error);
    return NextResponse.json(
      { success: false, message: "Failed to unlink GitHub account" },
      { status: 500 }
    );
  }
}
