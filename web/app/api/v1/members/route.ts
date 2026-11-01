import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/services/user.service";
import { env } from "@/lib/env";
import arcjet, { slidingWindow } from "@/lib/arcjet";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Public & Mobile API v1 endpoint for fetching members directory
 * Supports:
 * - API Key (Bearer token) or User Session Authentication
 * - Rate limiting
 * - Filtering (branch, admissionYear, profileComplete, batchId)
 * - Points calculation & Activity summary (includePoints=true)
 * - Pagination (limit, offset)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Check API Key or Session
    const authHeader = request.headers.get("authorization");
    const apiKey = authHeader?.replace("Bearer ", "");
    let isAuthenticated = false;

    if (env.API_KEY && apiKey && apiKey === env.API_KEY) {
      isAuthenticated = true;
    } else {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      if (session?.user) {
        isAuthenticated = true;
      }
    }

    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Valid API key or session required" },
        { status: 401 }
      );
    }

    // 2. Rate limiting with Arcjet
    if (apiKey) {
      const aj = arcjet.withRule(
        slidingWindow({
          mode: "LIVE",
          interval: "1h",
          max: 100,
        })
      );

      const decision = await aj.protect(request, {
        fingerprint: apiKey,
      });

      if (decision.isDenied()) {
        return NextResponse.json(
          {
            success: false,
            error: "Too Many Requests",
            message: "Rate limit exceeded. Please try again later.",
          },
          { status: 429 }
        );
      }
    }

    // 3. Query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");
    const includePoints = searchParams.get("includePoints") === "true";
    const branch = searchParams.get("branch");
    const admissionYear = searchParams.get("admissionYear");
    const batchId = searchParams.get("batchId");
    const profileCompleteParam = searchParams.get("profileComplete");
    const profileComplete =
      profileCompleteParam !== null && profileCompleteParam !== undefined
        ? profileCompleteParam === "true"
        : null;

    const result = await UserService.getMembersDirectory({
      branch,
      admissionYear,
      batchId,
      profileComplete,
      includePoints,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: result.members,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("V1 Members API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
