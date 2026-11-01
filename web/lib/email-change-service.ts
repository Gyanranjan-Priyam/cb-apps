"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { sendVerificationEmail } from "@/lib/mailer";
import { randomUUID } from "crypto";

/**
 * Initiates an email change request by generating a 6-digit OTP
 * and sending it to the requested new email address.
 */
export async function requestEmailChangeOTP(newEmail: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return {
        status: "error" as const,
        message: "Authentication required. Please log in.",
      };
    }

    const trimmedEmail = newEmail.trim().toLowerCase();

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return {
        status: "error" as const,
        message: "Please enter a valid email address.",
      };
    }

    if (trimmedEmail === session.user.email.toLowerCase()) {
      return {
        status: "error" as const,
        message: "The new email address is the same as your current email.",
      };
    }

    // Check if the new email is already registered to another account
    const existingUser = await prisma.user.findFirst({
      where: {
        email: trimmedEmail,
        id: { not: session.user.id },
      },
    });

    if (existingUser) {
      return {
        status: "error" as const,
        message: "This email address is already in use by another account.",
      };
    }

    // Generate a secure 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const identifier = `email-change:${session.user.id}:${trimmedEmail}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Remove any previous pending verification requests for this user & target email
    await prisma.verification.deleteMany({
      where: { identifier },
    });

    // Save new verification OTP
    await prisma.verification.create({
      data: {
        id: randomUUID(),
        identifier,
        value: otp,
        expiresAt,
      },
    });

    // Send verification email using the branded template
    await sendVerificationEmail({
      to: trimmedEmail,
      otp,
    });

    return {
      status: "success" as const,
      message: `Verification code sent to ${trimmedEmail}`,
    };
  } catch (error) {
    console.error("Error requesting email change OTP:", error);
    return {
      status: "error" as const,
      message: "Failed to send verification email. Please try again.",
    };
  }
}

/**
 * Verifies the 6-digit OTP and atomically replaces the old email with the new email.
 * After verification, the user will log in with this new email.
 */
export async function verifyEmailChangeOTP(newEmail: string, otp: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return {
        status: "error" as const,
        message: "Authentication required. Please log in.",
      };
    }

    const trimmedEmail = newEmail.trim().toLowerCase();
    const trimmedOtp = otp.trim();

    if (!trimmedOtp || trimmedOtp.length !== 6) {
      return {
        status: "error" as const,
        message: "Please enter the 6-digit verification code.",
      };
    }

    const identifier = `email-change:${session.user.id}:${trimmedEmail}`;

    // Find active verification record
    const record = await prisma.verification.findFirst({
      where: {
        identifier,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      return {
        status: "error" as const,
        message:
          "The verification code has expired or is invalid. Please request a new one.",
      };
    }

    if (record.value !== trimmedOtp) {
      return {
        status: "error" as const,
        message: "Incorrect verification code. Please check and try again.",
      };
    }

    // Ensure email wasn't taken during the OTP waiting period
    const existingUser = await prisma.user.findFirst({
      where: {
        email: trimmedEmail,
        id: { not: session.user.id },
      },
    });

    if (existingUser) {
      return {
        status: "error" as const,
        message:
          "This email address was claimed by another account. Please use a different email.",
      };
    }

    // Atomically update user email and clean up verification record
    await prisma.$transaction(async (tx) => {
      // 1. Update user email and verified status
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          email: trimmedEmail,
          emailVerified: true,
          updatedAt: new Date(),
        },
      });

      // 2. Delete used verification record
      await tx.verification.delete({
        where: { id: record.id },
      });
    });

    // Revalidate paths across admin and public dashboards
    revalidatePath("/admin/settings");
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard", "layout");
    revalidatePath("/", "layout");

    return {
      status: "success" as const,
      message:
        "Email address updated successfully! You can now log in with your new email.",
      newEmail: trimmedEmail,
    };
  } catch (error) {
    console.error("Error verifying email change OTP:", error);
    return {
      status: "error" as const,
      message: "Failed to verify code. Please try again.",
    };
  }
}
