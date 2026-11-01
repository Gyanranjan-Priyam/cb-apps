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
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { username, firstName, lastName } = await request.json();

    if (!username || username.length < 2) {
      return NextResponse.json(
        { available: false, suggestions: [] },
        { status: 400 }
      );
    }

    // Check if username is available
    const existingUser = await prisma.user.findFirst({
      where: {
        username: username,
        id: { not: session.user.id },
      },
    });

    if (!existingUser) {
      return NextResponse.json({
        available: true,
        suggestions: [],
      });
    }

    // Username is taken, generate suggestions
    const suggestions: string[] = [];
    const baseName = firstName?.toLowerCase() || username.toLowerCase();
    const fullName = lastName 
      ? `${firstName?.toLowerCase() || ''}${lastName.toLowerCase()}`
      : baseName;

    // Generate suggestion patterns
    const patterns = [
      `${baseName}${Math.floor(Math.random() * 9000) + 1000}`,
      `${fullName}`,
      `${baseName}_${new Date().getFullYear() % 100}`,
      `${baseName}_${lastName?.toLowerCase()?.slice(0, 3) || Math.floor(Math.random() * 900) + 100}`,
      `${firstName?.toLowerCase() || baseName}_${Math.floor(Math.random() * 900) + 100}`,
    ];

    // Check each pattern and add if available
    for (const pattern of patterns) {
      if (suggestions.length >= 4) break;
      
      const exists = await prisma.user.findFirst({
        where: {
          username: pattern,
        },
      });

      if (!exists && !suggestions.includes(pattern)) {
        suggestions.push(pattern);
      }
    }

    // If we still need more suggestions, generate random ones
    while (suggestions.length < 4) {
      const randomSuggestion = `${baseName}${Math.floor(Math.random() * 9000) + 1000}`;
      const exists = await prisma.user.findFirst({
        where: {
          username: randomSuggestion,
        },
      });

      if (!exists && !suggestions.includes(randomSuggestion)) {
        suggestions.push(randomSuggestion);
      }
    }

    return NextResponse.json({
      available: false,
      suggestions: suggestions.slice(0, 4),
    });
  } catch (error) {
    console.error("Error checking username:", error);
    return NextResponse.json(
      { error: "Failed to check username availability" },
      { status: 500 }
    );
  }
}
