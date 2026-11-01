"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isSystemAdminRole, isCoAdminRole, hasAdminOrCoAdminAccess } from "@/lib/member-roles";
import { parseUserAgent, type ParsedDeviceInfo } from "@/lib/user-agent";

// Validation schema for profile updates
const profileUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().email("Please enter a valid email address"),
  mobileNumber: z.string().optional().refine((val) => {
    if (!val) return true;
    return /^\+?[\d\s\-\(\)]+$/.test(val) && val.replace(/\D/g, '').length >= 10;
  }, "Please enter a valid mobile number"),
  whatsappNumber: z.string().optional().refine((val) => {
    if (!val) return true;
    return /^\+?[\d\s\-\(\)]+$/.test(val) && val.replace(/\D/g, '').length >= 10;
  }, "Please enter a valid WhatsApp number"),
  upiId: z.string().optional().refine((val) => {
    if (!val) return true;
    // Basic UPI ID validation: should contain @ and be in format like user@bank
    return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(val);
  }, "Please enter a valid UPI ID (e.g., user@paytm, user@ybl)"),
  username: z.string().optional(),
  firstName: z.string().optional(),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  aadhaarNumber: z.string().optional(),
  registration: z.string().optional(),
  rollNumber: z.string().optional(),
  branch: z.string().optional(),
  admissionYear: z.string().optional(),
  collegeName: z.string().optional(),
  collegeAddress: z.string().optional(),
  address: z.string().optional(),
  postOffice: z.string().optional(),
  policeStation: z.string().optional(),
  block: z.string().optional(),
  pinCode: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
});

export interface ProfileUpdateData {
  name: string;
  email: string;
  mobileNumber?: string;
  whatsappNumber?: string;
  upiId?: string;
  username?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  aadhaarNumber?: string;
  registration?: string;
  rollNumber?: string;
  branch?: string;
  admissionYear?: string;
  collegeName?: string;
  collegeAddress?: string;
  address?: string;
  postOffice?: string;
  policeStation?: string;
  block?: string;
  pinCode?: string;
  state?: string;
  district?: string;
}

export async function getCurrentUserProfile() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return {
        status: "error" as const,
        message: "Authentication required",
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        mobileNumber: true,
        whatsappNumber: true,
        profileImageKey: true,
        image: true,
        upiId: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        username: true,
        firstName: true,
        middleName: true,
        lastName: true,
        aadhaarNumber: true,
        registration: true,
        rollNumber: true,
        branch: true,
        admissionYear: true,
        collegeName: true,
        collegeAddress: true,
        address: true,
        postOffice: true,
        policeStation: true,
        block: true,
        pinCode: true,
        state: true,
        district: true,
        githubUsername: true,
        profileComplete: true,
        socialLinks: true,
        customLinks: true,
      },
    });

    if (!user) {
      return {
        status: "error" as const,
        message: "User not found",
      };
    }

    return {
      status: "success" as const,
      data: user,
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return {
      status: "error" as const,
      message: "Failed to fetch profile",
    };
  }
}

export async function updateAdminSocialAndCustomLinks(data: {
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    leetcode?: string;
    codeforces?: string;
    portfolio?: string;
  };
  customLinks: Array<{ id: string; title: string; url: string }>;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return {
        status: "error" as const,
        message: "Authentication required",
      };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        socialLinks: data.socialLinks,
        customLinks: data.customLinks,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/admin/settings");
    revalidatePath("/admin/members");
    revalidatePath("/member");

    return {
      status: "success" as const,
      message: "Social and custom links updated successfully",
    };
  } catch (error) {
    console.error("Error updating admin social links:", error);
    return {
      status: "error" as const,
      message: "Failed to update social links",
    };
  }
}

export async function updateUserProfile(data: ProfileUpdateData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return {
        status: "error" as const,
        message: "Authentication required",
      };
    }

    // Validate input data
    const validation = profileUpdateSchema.safeParse(data);
    if (!validation.success) {
      return {
        status: "error" as const,
        message: "Invalid data provided",
        errors: validation.error.format(),
      };
    }

    const validatedData = validation.data;

    const isEmailChanging = validatedData.email.toLowerCase() !== session.user.email.toLowerCase();

    // Check if email is being changed and if it's already taken by another user
    if (isEmailChanging) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: validatedData.email.toLowerCase(),
          id: { not: session.user.id },
        },
      });

      if (existingUser) {
        return {
          status: "error" as const,
          message: "Email address is already taken by another user",
        };
      }
    }

    // Check if username is being changed and if it's already taken by another user
    if (validatedData.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: validatedData.username,
          id: { not: session.user.id },
        },
      });

      if (existingUser) {
        return {
          status: "error" as const,
          message: "Username is already taken by another user",
        };
      }
    }

    // Update user profile (keep existing email if email is changing until verified)
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: validatedData.name,
        email: isEmailChanging ? session.user.email : validatedData.email,
        mobileNumber: validatedData.mobileNumber || null,
        whatsappNumber: validatedData.whatsappNumber || null,
        upiId: validatedData.upiId || null,
        username: validatedData.username || null,
        firstName: validatedData.firstName || null,
        middleName: validatedData.middleName || null,
        lastName: validatedData.lastName || null,
        aadhaarNumber: validatedData.aadhaarNumber || null,
        registration: validatedData.registration || null,
        rollNumber: validatedData.rollNumber || null,
        branch: validatedData.branch || null,
        admissionYear: validatedData.admissionYear || null,
        collegeName: validatedData.collegeName || null,
        collegeAddress: validatedData.collegeAddress || null,
        address: validatedData.address || null,
        postOffice: validatedData.postOffice || null,
        policeStation: validatedData.policeStation || null,
        block: validatedData.block || null,
        pinCode: validatedData.pinCode || null,
        state: validatedData.state || null,
        district: validatedData.district || null,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobileNumber: true,
        whatsappNumber: true,
        profileImageKey: true,
        upiId: true,
        updatedAt: true,
        username: true,
        firstName: true,
        middleName: true,
        lastName: true,
        aadhaarNumber: true,
        registration: true,
        rollNumber: true,
        branch: true,
        admissionYear: true,
        collegeName: true,
        collegeAddress: true,
        address: true,
        postOffice: true,
        policeStation: true,
        block: true,
        pinCode: true,
        state: true,
        district: true,
      },
    });

    // Revalidate all paths where admin data is displayed
    revalidatePath("/admin", "layout");
    revalidatePath("/admin/settings");

    if (isEmailChanging) {
      // Send OTP to the new email address
      const { requestEmailChangeOTP } = await import("@/lib/email-change-service");
      const otpResult = await requestEmailChangeOTP(validatedData.email);

      if (otpResult.status === "error") {
        return {
          status: "error" as const,
          message: `Profile saved, but failed to send verification code to ${validatedData.email}: ${otpResult.message}`,
        };
      }

      return {
        status: "requires_email_verification" as const,
        pendingEmail: validatedData.email.toLowerCase(),
        message: `Profile details saved. A 6-digit verification code has been sent to ${validatedData.email} to confirm the email update.`,
        data: updatedUser,
      };
    }

    return {
      status: "success" as const,
      message: "Profile updated successfully",
      data: updatedUser,
    };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return {
      status: "error" as const,
      message: "Failed to update profile. Please try again.",
    };
  }
}

export async function updateProfileImage(profileImageKey: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return {
        status: "error" as const,
        message: "Authentication required",
      };
    }

    // Update user's profile image
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        profileImageKey: profileImageKey,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        profileImageKey: true,
        updatedAt: true,
      },
    });

    // Revalidate all paths where admin image is displayed
    revalidatePath("/admin", "layout");
    revalidatePath("/admin/settings");
    revalidatePath("/", "layout"); // Revalidate root layout to update sidebar

    return {
      status: "success" as const,
      message: "Profile image updated successfully",
      data: updatedUser,
    };
  } catch (error) {
    console.error("Error updating profile image:", error);
    return {
      status: "error" as const,
      message: "Failed to update profile image. Please try again.",
    };
  }
}

export async function removeProfileImage() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return {
        status: "error" as const,
        message: "Authentication required",
      };
    }

    // Remove user's profile image
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        profileImageKey: null,
        updatedAt: new Date(),
      },
    });

    // Revalidate all paths where admin image is displayed
    revalidatePath("/admin", "layout");
    revalidatePath("/admin/settings");
    revalidatePath("/", "layout"); // Revalidate root layout to update sidebar

    return {
      status: "success" as const,
      message: "Profile image removed successfully",
    };
  } catch (error) {
    console.error("Error removing profile image:", error);
    return {
      status: "error" as const,
      message: "Failed to remove profile image. Please try again.",
    };
  }
}

export async function getRegistrationSetting() {
  try {
    // Try to find the setting first
    let setting = await prisma.systemSettings.findUnique({
      where: { key: "registration_enabled" },
    });

    // If it doesn't exist, create it with default value
    if (!setting) {
      setting = await prisma.systemSettings.create({
        data: {
          key: "registration_enabled",
          value: "true",
          description: "Controls whether user registration is enabled or disabled",
        },
      });
    }

    return {
      status: "success" as const,
      data: setting.value === "true",
    };
  } catch (error) {
    console.error("Error fetching registration setting:", error);
    return {
      status: "error" as const,
      message: "Failed to fetch registration setting",
      data: true, // Default to enabled if error
    };
  }
}

export async function updateRegistrationSetting(enabled: boolean) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return {
        status: "error" as const,
        message: "Authentication required",
      };
    }

    // Check if user has admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!isSystemAdminRole(user?.role)) {
      return {
        status: "error" as const,
        message: "Admin access required",
      };
    }

    // Upsert the registration setting
    await prisma.systemSettings.upsert({
      where: { key: "registration_enabled" },
      update: {
        value: enabled.toString(),
        updatedAt: new Date(),
      },
      create: {
        key: "registration_enabled",
        value: enabled.toString(),
        description: "Controls whether user registration is enabled or disabled",
      },
    });

    // Revalidate relevant pages
    revalidatePath("/admin/settings");
    revalidatePath("/register");

    return {
      status: "success" as const,
      message: `Registration ${enabled ? "enabled" : "disabled"} successfully`,
    };
  } catch (error) {
    console.error("Error updating registration setting:", error);
    return {
      status: "error" as const,
      message: "Failed to update registration setting. Please try again.",
    };
  }
}

export async function getExternalQuizSetting() {
  try {
    let setting = await prisma.systemSettings.findUnique({
      where: { key: "external_quiz_enabled" },
    });

    if (!setting) {
      setting = await prisma.systemSettings.create({
        data: {
          key: "external_quiz_enabled",
          value: "false",
          description: "Controls whether the external quiz system, kiosk registration, and real-time socket services are active",
        },
      });
    }

    return {
      status: "success" as const,
      data: setting.value === "true",
    };
  } catch (error) {
    console.error("Error fetching external quiz setting:", error);
    return {
      status: "error" as const,
      message: "Failed to fetch external quiz setting",
      data: false,
    };
  }
}

export async function updateExternalQuizSetting(enabled: boolean) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return {
        status: "error" as const,
        message: "Authentication required",
      };
    }

    // Check if user has admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!isSystemAdminRole(user?.role)) {
      return {
        status: "error" as const,
        message: "Admin access required",
      };
    }

    // Upsert the external quiz setting
    await prisma.systemSettings.upsert({
      where: { key: "external_quiz_enabled" },
      update: {
        value: enabled.toString(),
        updatedAt: new Date(),
      },
      create: {
        key: "external_quiz_enabled",
        value: enabled.toString(),
        description: "Controls whether the external quiz system, kiosk registration, and real-time socket services are active",
      },
    });

    // Broadcast change to all connected clients & kiosks via Socket.IO
    try {
      const { emitSocketEvent } = await import("@/lib/socket-server");
      emitSocketEvent("quiz-external-global", "external-quiz-status", { enabled });
    } catch (e) {
      console.error("Error broadcasting external quiz status event:", e);
    }

    // Revalidate relevant pages
    revalidatePath("/admin/settings");
    revalidatePath("/admin/system-settings");
    revalidatePath("/quiz/system-register");
    revalidatePath("/system-register");
    revalidatePath("/admin/quizzes");

    return {
      status: "success" as const,
      message: `External Quiz System ${enabled ? "activated" : "deactivated"} successfully`,
    };
  } catch (error) {
    console.error("Error updating external quiz setting:", error);
    return {
      status: "error" as const,
      message: "Failed to update external quiz setting. Please try again.",
    };
  }
}


export async function getGitHubOrgSetting() {
  try {
    const setting = await prisma.systemSettings.findUnique({
      where: { key: 'github_organization' },
    });

    return {
      status: 'success' as const,
      data: setting?.value || '',
    };
  } catch (error) {
    console.error('Error fetching GitHub org setting:', error);
    return {
      status: 'error' as const,
      message: 'Failed to fetch GitHub organization setting',
    };
  }
}

export async function updateGitHubOrgSetting(organizationName: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || !isSystemAdminRole(session.user.role)) {
      return {
        status: 'error' as const,
        message: 'Unauthorized: Admin access required',
      };
    }

    await prisma.systemSettings.upsert({
      where: { key: 'github_organization' },
      update: {
        value: organizationName,
        updatedAt: new Date(),
      },
      create: {
        key: 'github_organization',
        value: organizationName,
        description: 'GitHub organization name for fetching repositories',
      },
    });

    revalidatePath('/admin/settings');
    revalidatePath('/admin/projects/all-projects');

    return {
      status: 'success' as const,
      message: 'GitHub organization updated successfully',
    };
  } catch (error) {
    console.error('Error updating GitHub org setting:', error);
    return {
      status: 'error' as const,
      message: 'Failed to update GitHub organization setting',
    };
  }
}

export async function getGoogleDriveStatusAction() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const { GoogleDriveService } = await import("@/lib/google-drive-service");
    const status = await GoogleDriveService.getConnectionStatus(session?.user?.id);

    return {
      status: 'success' as const,
      data: status,
    };
  } catch (error) {
    console.error('Error getting Google Drive status:', error);
    return {
      status: 'error' as const,
      message: 'Failed to get Google Drive status',
      data: { isConnected: false },
    };
  }
}

export interface AdminSessionItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userImage: string | null;
  userRole: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceInfo: ParsedDeviceInfo;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  isCurrentSession: boolean;
  isInactive: boolean;
  daysInactive: number;
}

export interface AdminSessionsData {
  sessions: AdminSessionItem[];
  stats: {
    totalSessions: number;
    totalAdminSessions: number;
    totalCoAdminSessions: number;
    totalUniqueUsers: number;
    inactiveSessionsCount: number;
  };
  policy: {
    inactiveDays: number;
  };
}

export async function getAdminAndCoAdminSessionsAction() {
  try {
    const callerSession = await auth.api.getSession({
      headers: await headers(),
    });

    if (!callerSession?.user || !isSystemAdminRole(callerSession.user.role)) {
      return {
        status: "error" as const,
        message: "Unauthorized: Full Admin access required",
      };
    }

    // Read inactive days policy from SystemSettings (default 7 days)
    const policySetting = await prisma.systemSettings.findUnique({
      where: { key: "admin_session_inactive_days" },
    });
    const inactiveDays = policySetting ? parseInt(policySetting.value, 10) || 7 : 7;

    // Fetch all users with admin or co-admin roles
    const elevatedUsers = await prisma.user.findMany({
      where: {
        role: { not: null },
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    });

    const adminOrCoAdminUsers = elevatedUsers.filter((u) => hasAdminOrCoAdminAccess(u.role));
    const adminUserIds = adminOrCoAdminUsers.map((u) => u.id);

    if (adminUserIds.length === 0) {
      return {
        status: "success" as const,
        data: {
          sessions: [],
          stats: {
            totalSessions: 0,
            totalAdminSessions: 0,
            totalCoAdminSessions: 0,
            totalUniqueUsers: 0,
            inactiveSessionsCount: 0,
          },
          policy: { inactiveDays },
        },
      };
    }

    // Fetch active sessions for these users
    const now = new Date();
    const rawSessions = await prisma.session.findMany({
      where: {
        userId: { in: adminUserIds },
        expiresAt: { gt: now },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const currentSessionToken = callerSession.session.token;
    const currentSessionId = callerSession.session.id;

    let totalAdminSessions = 0;
    let totalCoAdminSessions = 0;
    let inactiveSessionsCount = 0;
    const uniqueUsersSet = new Set<string>();

    const sessions: AdminSessionItem[] = rawSessions.map((s) => {
      uniqueUsersSet.add(s.userId);
      const isCaller = s.id === currentSessionId || s.token === currentSessionToken;
      const isAdmin = isSystemAdminRole(s.user.role);
      const isCoAdmin = isCoAdminRole(s.user.role);

      if (isAdmin) totalAdminSessions++;
      else if (isCoAdmin) totalCoAdminSessions++;

      const lastActiveTime = s.updatedAt ? s.updatedAt.getTime() : s.createdAt.getTime();
      const diffMs = Math.max(0, Date.now() - lastActiveTime);
      const daysInactive = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const isInactive = daysInactive >= inactiveDays;

      if (isInactive) {
        inactiveSessionsCount++;
      }

      return {
        id: s.id,
        userId: s.userId,
        userName: s.user.name || "Administrator",
        userEmail: s.user.email,
        userImage: s.user.image,
        userRole: isAdmin ? "Admin" : isCoAdmin ? "Co-Admin" : "Staff",
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        deviceInfo: parseUserAgent(s.userAgent),
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        expiresAt: s.expiresAt.toISOString(),
        isCurrentSession: isCaller,
        isInactive,
        daysInactive,
      };
    });

    return {
      status: "success" as const,
      data: {
        sessions,
        stats: {
          totalSessions: sessions.length,
          totalAdminSessions,
          totalCoAdminSessions,
          totalUniqueUsers: uniqueUsersSet.size,
          inactiveSessionsCount,
        },
        policy: {
          inactiveDays,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching admin sessions:", error);
    return {
      status: "error" as const,
      message: "Failed to load active admin sessions",
    };
  }
}

export async function revokeSessionAction(sessionId: string) {
  try {
    const callerSession = await auth.api.getSession({
      headers: await headers(),
    });

    if (!callerSession?.user || !isSystemAdminRole(callerSession.user.role)) {
      return {
        status: "error" as const,
        message: "Unauthorized: Full Admin access required",
      };
    }

    if (!sessionId || !sessionId.trim()) {
      return {
        status: "error" as const,
        message: "Session ID is required",
      };
    }

    // Verify session exists
    const target = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!target) {
      return {
        status: "error" as const,
        message: "Session not found or already logged out",
      };
    }

    // Delete session from DB
    await prisma.session.delete({
      where: { id: sessionId },
    });

    revalidatePath("/admin/settings");
    revalidatePath("/admin/system-settings");

    return {
      status: "success" as const,
      message: `Device session for ${target.user.name || target.user.email} successfully logged out.`,
    };
  } catch (error) {
    console.error("Error revoking session:", error);
    return {
      status: "error" as const,
      message: "Failed to log out session",
    };
  }
}

export async function revokeAllOtherSessionsAction(targetUserId: string) {
  try {
    const callerSession = await auth.api.getSession({
      headers: await headers(),
    });

    if (!callerSession?.user || !isSystemAdminRole(callerSession.user.role)) {
      return {
        status: "error" as const,
        message: "Unauthorized: Full Admin access required",
      };
    }

    const currentSessionId = callerSession.session.id;

    const result = await prisma.session.deleteMany({
      where: {
        userId: targetUserId,
        id: { not: currentSessionId },
      },
    });

    revalidatePath("/admin/settings");
    revalidatePath("/admin/system-settings");

    return {
      status: "success" as const,
      message: `Terminated ${result.count} other active device sessions.`,
    };
  } catch (error) {
    console.error("Error revoking other sessions:", error);
    return {
      status: "error" as const,
      message: "Failed to revoke other sessions",
    };
  }
}

export async function saveAdminSessionPolicyAction(inactiveDays: number) {
  try {
    const callerSession = await auth.api.getSession({
      headers: await headers(),
    });

    if (!callerSession?.user || !isSystemAdminRole(callerSession.user.role)) {
      return {
        status: "error" as const,
        message: "Unauthorized: Full Admin access required",
      };
    }

    const days = Math.max(1, Math.min(90, inactiveDays));

    await prisma.systemSettings.upsert({
      where: { key: "admin_session_inactive_days" },
      update: {
        value: days.toString(),
        updatedAt: new Date(),
      },
      create: {
        key: "admin_session_inactive_days",
        value: days.toString(),
        description: "Days of inactivity after which Admin and Co-Admin sessions are eligible for auto-cleanup",
      },
    });

    revalidatePath("/admin/settings");
    revalidatePath("/admin/system-settings");

    return {
      status: "success" as const,
      message: `Inactive session auto-cleanup policy updated to ${days} days.`,
      data: { inactiveDays: days },
    };
  } catch (error) {
    console.error("Error saving admin session policy:", error);
    return {
      status: "error" as const,
      message: "Failed to save session policy",
    };
  }
}

export async function cleanupInactiveAdminSessionsAction(customDays?: number) {
  try {
    const callerSession = await auth.api.getSession({
      headers: await headers(),
    });

    if (!callerSession?.user || !isSystemAdminRole(callerSession.user.role)) {
      return {
        status: "error" as const,
        message: "Unauthorized: Full Admin access required",
      };
    }

    let inactiveDays = customDays;
    if (!inactiveDays) {
      const policySetting = await prisma.systemSettings.findUnique({
        where: { key: "admin_session_inactive_days" },
      });
      inactiveDays = policySetting ? parseInt(policySetting.value, 10) || 7 : 7;
    }

    const cutoffDate = new Date(Date.now() - inactiveDays * 24 * 60 * 60 * 1000);
    const now = new Date();
    const currentSessionId = callerSession.session.id;

    // Delete expired sessions OR sessions where updatedAt is older than cutoff (protecting caller's current session)
    const result = await prisma.session.deleteMany({
      where: {
        id: { not: currentSessionId },
        OR: [
          { expiresAt: { lte: now } },
          { updatedAt: { lte: cutoffDate } },
        ],
      },
    });

    revalidatePath("/admin/settings");
    revalidatePath("/admin/system-settings");

    return {
      status: "success" as const,
      message: `Cleaned up ${result.count} stale or inactive sessions (older than ${inactiveDays} days).`,
      count: result.count,
    };
  } catch (error) {
    console.error("Error cleaning up inactive sessions:", error);
    return {
      status: "error" as const,
      message: "Failed to cleanup inactive sessions",
    };
  }
}