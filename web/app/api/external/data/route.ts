import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import arcjet, { slidingWindow } from "@/lib/arcjet";

/**
 * External Comprehensive Data API Endpoint
 * 
 * This endpoint provides access to all database information for external applications.
 * 
 * Authentication: Requires API_KEY in Authorization header
 * Usage: Authorization: Bearer YOUR_API_KEY
 * 
 * Rate Limit: 50 requests per hour per IP
 * 
 * Query Parameters:
 * - resource: Specify which resource to fetch (required)
 *   Available resources: users, attendance, tasks, events, quizzes, 
 *   projects, reviews, resources, support, all
 * - limit: Number of records to fetch (default: 100, max: 1000)
 * - offset: Number of records to skip for pagination (default: 0)
 * - includeRelations: Include related data (default: false)
 * 
 * Additional Filters (based on resource):
 * For users: branch, admissionYear, profileComplete, role
 * For quizzes: isActive
 * For tasks: status
 * For support: status, priority
 * 
 * Examples:
 * GET /api/external/data?resource=users&limit=50&branch=CSE
 * GET /api/external/data?resource=all (fetches everything with pagination)
 * GET /api/external/data?resource=quizzes&isActive=true
 */

export async function GET(request: NextRequest) {
  try {
    // API Key Authentication
    const authHeader = request.headers.get("authorization");
    const apiKey = authHeader?.replace("Bearer ", "");

    if (!env.API_KEY || !apiKey || apiKey !== env.API_KEY) {
      return NextResponse.json(
        { 
          error: "Unauthorized", 
          message: "Invalid or missing API key",
          code: "AUTH_FAILED"
        },
        { status: 401 }
      );
    }

    // Apply rate limiting - 50 requests per hour
    const aj = arcjet.withRule(
      slidingWindow({
        mode: "LIVE",
        interval: "1h",
        max: 50,
      })
    );

    const decision = await aj.protect(request, {
      fingerprint: apiKey,
    });

    if (decision.isDenied()) {
      return NextResponse.json(
        {
          error: "Too Many Requests",
          message: "Rate limit exceeded. Please try again later.",
          code: "RATE_LIMIT_EXCEEDED",
        },
        { status: 429 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const resource = searchParams.get("resource");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 1000);
    const offset = parseInt(searchParams.get("offset") || "0");
    const includeRelations = searchParams.get("includeRelations") === "true";

    if (!resource) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Resource parameter is required",
          code: "MISSING_RESOURCE",
          availableResources: [
            "users", "attendance", "tasks", "events",
            "quizzes", "projects", "reviews", "resources", "support", "all"
          ]
        },
        { status: 400 }
      );
    }

    let data: any = {};
    let totalCount = 0;

    // Fetch data based on requested resource
    switch (resource.toLowerCase()) {
      case "users":
        data = await fetchUsers(searchParams, limit, offset, includeRelations);
        totalCount = await prisma.user.count({
          where: buildUserFilter(searchParams)
        });
        break;

      case "attendance":
        data = await fetchAttendance(searchParams, limit, offset, includeRelations);
        totalCount = await prisma.attendanceSession.count();
        break;

      case "tasks":
        data = await fetchTasks(searchParams, limit, offset, includeRelations);
        totalCount = await prisma.task.count();
        break;

      case "events":
        data = await fetchEvents(searchParams, limit, offset, includeRelations);
        totalCount = await prisma.eventPoint.count();
        break;

      case "quizzes":
        data = await fetchQuizzes(searchParams, limit, offset, includeRelations);
        totalCount = await prisma.quiz.count({
          where: buildQuizFilter(searchParams)
        });
        break;

      case "projects":
        data = await fetchProjects(searchParams, limit, offset, includeRelations);
        totalCount = await prisma.publishedProject.count();
        break;

      case "reviews":
        data = await fetchProjectReviews(searchParams, limit, offset, includeRelations);
        totalCount = await prisma.projectReview.count({
          where: buildReviewFilter(searchParams)
        });
        break;

      case "all":
        data = await fetchAllData(limit, offset, includeRelations);
        totalCount = -1; // Not applicable for 'all'
        break;

      default:
        return NextResponse.json(
          {
            error: "Bad Request",
            message: `Invalid resource: ${resource}`,
            code: "INVALID_RESOURCE",
            availableResources: [
              "users", "attendance", "tasks", "events",
              "quizzes", "projects", "reviews", "resources", "all"
            ]
          },
          { status: 400 }
        );
    }

    // Build response metadata
    const hasMore = totalCount > 0 ? (offset + limit) < totalCount : false;
    const currentPage = Math.floor(offset / limit) + 1;
    const totalPages = totalCount > 0 ? Math.ceil(totalCount / limit) : 1;

    return NextResponse.json({
      success: true,
      resource,
      data,
      metadata: {
        limit,
        offset,
        totalCount: totalCount >= 0 ? totalCount : undefined,
        returnedCount: Array.isArray(data) ? data.length : Object.keys(data).reduce((acc, key) => acc + (Array.isArray(data[key]) ? data[key].length : 0), 0),
        hasMore,
        currentPage,
        totalPages: totalCount >= 0 ? totalPages : undefined,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error: any) {
    console.error("External Data API Error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An error occurred while fetching data",
        code: "INTERNAL_ERROR",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// ==================== FETCH FUNCTIONS ====================

async function fetchUsers(searchParams: URLSearchParams, limit: number, offset: number, includeRelations: boolean) {
  const where = buildUserFilter(searchParams);

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      firstName: true,
      middleName: true,
      lastName: true,
      mobileNumber: true,
      whatsappNumber: true,
      image: true,
      profileImageKey: true,
      state: true,
      district: true,
      collegeName: true,
      collegeAddress: true,
      registration: true,
      rollNumber: true,
      branch: true,
      admissionYear: true,
      address: true,
      postOffice: true,
      policeStation: true,
      block: true,
      pinCode: true,
      profileComplete: true,
      githubUsername: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      ...(includeRelations && {
        publishedProjects: {
          select: {
            id: true,
            title: true,
            description: true,
            techStack: true,
            projectUrl: true,
            createdAt: true,
          }
        },
        projectReviews: {
          select: {
            id: true,
            repoName: true,
            reviewType: true,
            status: true,
            createdAt: true,
          }
        },
      }),
    },
    take: limit,
    skip: offset,
    orderBy: { createdAt: 'desc' }
  });

  return users;
}

async function fetchAttendance(searchParams: URLSearchParams, limit: number, offset: number, includeRelations: boolean) {
  const sessions = await prisma.attendanceSession.findMany({
    select: {
      id: true,
      sessionNumber: true,
      title: true,
      date: true,
      day: true,
      createdAt: true,
      createdBy: true,
      ...(includeRelations && {
        attendances: {
          select: {
            id: true,
            userId: true,
            status: true,
            points: true,
            markedAt: true,
            markedBy: true,
          }
        }
      }),
    },
    take: limit,
    skip: offset,
    orderBy: { sessionNumber: 'desc' }
  });

  return sessions;
}

async function fetchTasks(searchParams: URLSearchParams, limit: number, offset: number, includeRelations: boolean) {
  const tasks = await prisma.task.findMany({
    select: {
      id: true,
      taskNumber: true,
      title: true,
      description: true,
      startDate: true,
      dueDate: true,
      points: true,
      createdAt: true,
      createdBy: true,
      ...(includeRelations && {
        submissions: {
          select: {
            id: true,
            userId: true,
            status: true,
            projectUrl: true,
            submittedAt: true,
            evaluatedAt: true,
            pointsAwarded: true,
            feedback: true,
          }
        }
      }),
    },
    take: limit,
    skip: offset,
    orderBy: { taskNumber: 'desc' }
  });

  return tasks;
}

async function fetchEvents(searchParams: URLSearchParams, limit: number, offset: number, includeRelations: boolean) {
  const events = await prisma.eventPoint.findMany({
    select: {
      id: true,
      eventNumber: true,
      title: true,
      description: true,
      eventDate: true,
      points: true,
      createdAt: true,
      createdBy: true,
      ...(includeRelations && {
        participations: {
          select: {
            id: true,
            userId: true,
            status: true,
            participatedAt: true,
            evaluatedAt: true,
            pointsAwarded: true,
            feedback: true,
          }
        }
      }),
    },
    take: limit,
    skip: offset,
    orderBy: { eventNumber: 'desc' }
  });

  return events;
}

async function fetchQuizzes(searchParams: URLSearchParams, limit: number, offset: number, includeRelations: boolean) {
  const where = buildQuizFilter(searchParams);

  const quizzes = await prisma.quiz.findMany({
    where,
    select: {
      id: true,
      quizId: true,
      title: true,
      description: true,
      sets: true,
      duration: true,
      pointsPerQuestion: true,
      startDateTime: true,
      endDateTime: true,
      isActive: true,
      createdAt: true,
      createdBy: true,
      ...(includeRelations && {
        attempts: {
          select: {
            id: true,
            userId: true,
            setNumber: true,
            score: true,
            totalQuestions: true,
            correctAnswers: true,
            pointsEarned: true,
            startedAt: true,
            completedAt: true,
          }
        },
        setAssignments: {
          select: {
            userId: true,
            assignedSet: true,
            assignedAt: true,
          }
        }
      }),
    },
    take: limit,
    skip: offset,
    orderBy: { createdAt: 'desc' }
  });

  return quizzes;
}

async function fetchProjects(searchParams: URLSearchParams, limit: number, offset: number, includeRelations: boolean) {
  const projects = await prisma.publishedProject.findMany({
    select: {
      id: true,
      githubRepoId: true,
      title: true,
      description: true,
      techStack: true,
      projectUrl: true,
      thumbnailKey: true,
      publishedById: true,
      createdAt: true,
      updatedAt: true,
      ...(includeRelations && {
        publishedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          }
        }
      }),
    },
    take: limit,
    skip: offset,
    orderBy: { createdAt: 'desc' }
  });

  return projects;
}

async function fetchProjectReviews(searchParams: URLSearchParams, limit: number, offset: number, includeRelations: boolean) {
  const where = buildReviewFilter(searchParams);

  const reviews = await prisma.projectReview.findMany({
    where,
    select: {
      id: true,
      userId: true,
      repoName: true,
      repoUrl: true,
      description: true,
      reviewType: true,
      explanation: true,
      liveUrl: true,
      whatsappNumber: true,
      status: true,
      adminResponse: true,
      createdAt: true,
      updatedAt: true,
      ...(includeRelations && {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          }
        }
      }),
    },
    take: limit,
    skip: offset,
    orderBy: { createdAt: 'desc' }
  });

  return reviews;
}

async function fetchAllData(limit: number, offset: number, includeRelations: boolean) {
  // For 'all', we'll fetch a summary of each resource with limited data
  const [
    users,
    attendanceSessions,
    tasks,
    events,
    quizzes,
    projects,
    reviews,
    systemSettings,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.attendanceSession.count(),
    prisma.task.count(),
    prisma.eventPoint.count(),
    prisma.quiz.count(),
    prisma.publishedProject.count(),
    prisma.projectReview.count(),
    prisma.systemSettings.findMany({
      select: {
        key: true,
        value: true,
        description: true,
        updatedAt: true,
      }
    }),
  ]);

  return {
    summary: {
      totalUsers: users,
      totalAttendanceSessions: attendanceSessions,
      totalTasks: tasks,
      totalEvents: events,
      totalQuizzes: quizzes,
      totalPublishedProjects: projects,
      totalProjectReviews: reviews,
    },
    systemSettings,
    message: "To fetch detailed data, use specific resource endpoints like ?resource=users or ?resource=quizzes"
  };
}

// ==================== FILTER BUILDERS ====================

function buildUserFilter(searchParams: URLSearchParams) {
  const where: any = { banned: { not: true } };

  const branch = searchParams.get("branch");
  const admissionYear = searchParams.get("admissionYear");
  const profileComplete = searchParams.get("profileComplete");
  const role = searchParams.get("role");

  if (branch) where.branch = branch;
  if (admissionYear) where.admissionYear = admissionYear;
  if (profileComplete !== null) where.profileComplete = profileComplete === "true";
  if (role) where.role = role;

  return where;
}

function buildQuizFilter(searchParams: URLSearchParams) {
  const where: any = {};

  const isActive = searchParams.get("isActive");
  if (isActive !== null) where.isActive = isActive === "true";

  return where;
}

function buildReviewFilter(searchParams: URLSearchParams) {
  const where: any = {};

  const status = searchParams.get("status");
  const reviewType = searchParams.get("reviewType");

  if (status) where.status = status;
  if (reviewType) where.reviewType = reviewType;

  return where;
}
