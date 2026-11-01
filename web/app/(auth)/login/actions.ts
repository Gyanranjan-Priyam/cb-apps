"use server";

import { prisma } from "@/lib/db";

export type LoginPermissionResult =
  | { allowed: true; user: { id: string; email: string; name: string; role: string | null } }
  | { allowed: false; reason: "not_found" | "banned" | "invalid_email"; message: string };

export async function checkLoginPermission(email: string): Promise<LoginPermissionResult> {
  if (!email || !email.trim()) {
    return {
      allowed: false,
      reason: "invalid_email",
      message: "Please enter a valid email address.",
    };
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
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
      return {
        allowed: false,
        reason: "not_found",
        message:
          "Unauthorized Access: Your email is not registered as a member. Only members added by an admin can log in. If you are a member, please contact the administrator.",
      };
    }

    if (user.banned) {
      return {
        allowed: false,
        reason: "banned",
        message: `Account Banned: ${
          user.banReason || "Your account access has been restricted by an administrator."
        }`,
      };
    }

    return {
      allowed: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  } catch (error) {
    console.error("Error checking login permission:", error);
    return {
      allowed: false,
      reason: "not_found",
      message: "An error occurred while verifying your member status. Please try again.",
    };
  }
}
