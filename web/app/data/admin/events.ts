import "server-only";

import { prisma } from "@/lib/db";
import { requireAdmin } from "./require-admin";

// Note: Event model has been deprecated in favor of EventPoint model
// This file is kept for reference but should not be used
// Use EventPoint-related functions in app/admin/points/events/actions.ts instead

export async function getAllEvents() {
    throw new Error("Event model is deprecated. Use EventPoint instead.");
}

export async function getEventBySlugId(slugId: string) {
    throw new Error("Event model is deprecated. Use EventPoint instead.");
}

export async function updateEvent(slugId: string, data: any) {
    throw new Error("Event model is deprecated. Use EventPoint instead.");
}