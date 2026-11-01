import { prisma } from "@/lib/db";

export async function isRegistrationEnabled(): Promise<boolean> {
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
          description:
            "Controls whether user registration is enabled or disabled",
        },
      });
    }

    return setting.value === "true";
  } catch (error) {
    console.error("Error checking registration status:", error);
    // Default to enabled if there's an error
    return true;
  }
}

export async function isExternalQuizEnabled(): Promise<boolean> {
  try {
    let setting = await prisma.systemSettings.findUnique({
      where: { key: "external_quiz_enabled" },
    });

    if (!setting) {
      setting = await prisma.systemSettings.create({
        data: {
          key: "external_quiz_enabled",
          value: "false",
          description:
            "Controls whether the external quiz system, kiosk registration, and real-time socket services are active",
        },
      });
    }

    return setting.value === "true";
  } catch (error) {
    console.error("Error checking external quiz system status:", error);
    return false;
  }
}

export async function getSystemSetting(
  key: string,
  defaultValue?: string,
): Promise<string | null> {
  try {
    const setting = await prisma.systemSettings.findUnique({
      where: { key },
    });

    return setting?.value || defaultValue || null;
  } catch (error) {
    console.error(`Error fetching system setting ${key}:`, error);
    return defaultValue || null;
  }
}

