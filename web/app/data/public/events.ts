import "server-only";

import { prisma } from "@/lib/db";

// Note: Event model has been deprecated in favor of EventPoint model
// This file is kept for reference but should not be used
// Use EventPoint-related functions instead

export async function getPublicEventBySlugId(slugId: string) {
    throw new Error("Event model is deprecated. Use EventPoint instead.");
}

export async function getPublicEventById(id: string) {
    throw new Error("Event model is deprecated. Use EventPoint instead.");
}

export async function getAllPublicEvents() {
    throw new Error("Event model is deprecated. Use EventPoint instead.");
}