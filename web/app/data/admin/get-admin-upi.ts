import { prisma } from "@/lib/db";

/**
 * Get the UPI ID from the admin user profile
 * @returns Promise<{ upiId: string | null; success: boolean; error?: string }>
 */
export async function getAdminUpiId(): Promise<{ 
  upiId: string | null; 
  success: boolean; 
  error?: string 
}> {
  try {
    // Find the first admin user with a UPI ID
    const adminUser = await prisma.user.findFirst({
      where: {
        role: 'admin',
        upiId: {
          not: null
        }
      },
      select: {
        upiId: true,
        name: true,
        email: true
      }
    });

    if (!adminUser) {
      // If no admin with UPI ID found, get any admin
      const anyAdmin = await prisma.user.findFirst({
        where: {
          role: 'admin'
        },
        select: {
          upiId: true,
          name: true,
          email: true
        }
      });

      if (!anyAdmin) {
        return {
          upiId: null,
          success: false,
          error: "No admin user found"
        };
      }

      return {
        upiId: anyAdmin.upiId,
        success: true,
        error: anyAdmin.upiId ? undefined : "Admin has not configured UPI ID"
      };
    }

    return {
      upiId: adminUser.upiId,
      success: true
    };

  } catch (error) {
    console.error("Error fetching admin UPI ID:", error);
    return {
      upiId: null,
      success: false,
      error: "Failed to fetch admin UPI ID"
    };
  }
}

/**
 * Get default UPI ID fallback if admin UPI is not configured
 */
export function getDefaultUpiId(): string {
  return process.env.DEFAULT_UPI_ID || "grpriyam2005@sbi";
}