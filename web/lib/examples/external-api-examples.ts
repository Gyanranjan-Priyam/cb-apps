/**
 * Example usage of the External Data API Client
 *
 * This file demonstrates various ways to use the API client
 * for different use cases and scenarios.
 */

import {
  createExternalAPIClient,
  ExternalAPIError,
} from "@/lib/external-api-client";

// Initialize the client
const client = createExternalAPIClient({
  apiKey: process.env.EXTERNAL_API_KEY!,
  baseUrl: process.env.NEXT_PUBLIC_APP_URL!,
});

// ==================== Example 1: Fetch Users ====================

async function fetchCSEStudents() {
  try {
    const response = await client.users.list({
      branch: "CSE",
      profileComplete: true,
      limit: 50,
    });

    console.log(`Found ${response.metadata.totalCount} CSE students`);
    console.log(`Fetched ${response.data.length} students`);

    response.data.forEach((user) => {
      console.log(
        `${user.name} (${user.email}) - ${user.githubUsername || "No GitHub"}`,
      );
    });

    return response.data;
  } catch (error) {
    if (error instanceof ExternalAPIError) {
      if (error.isRateLimitError()) {
        console.error(
          "Rate limit exceeded. Retry after:",
          error.getRetryAfter(),
        );
      } else if (error.isAuthError()) {
        console.error("Authentication failed. Check your API key.");
      } else {
        console.error("API Error:", error.message);
      }
    } else {
      console.error("Unexpected error:", error);
    }
  }
}

// ==================== Example 2: Fetch Active Quizzes ====================

async function fetchActiveQuizzes() {
  try {
    const response = await client.quizzes.active(100);

    console.log(`Found ${response.data.length} active quizzes`);

    for (const quiz of response.data) {
      console.log(`
        Quiz: ${quiz.title}
        Duration: ${quiz.duration} minutes
        Points per question: ${quiz.pointsPerQuestion}
        Sets: ${quiz.sets}
        Start: ${quiz.startDateTime || "Not scheduled"}
      `);
    }

    return response.data;
  } catch (error) {
    handleAPIError(error);
  }
}

// ==================== Example 3: Fetch Quiz Results ====================

async function fetchQuizWithResults(includeResults = true) {
  try {
    const response = await client.quizzes.list({
      isActive: true,
      includeRelations: includeResults,
      limit: 10,
    });

    for (const quiz of response.data) {
      console.log(`\nQuiz: ${quiz.title}`);

      if (quiz.attempts) {
        console.log(`Total attempts: ${quiz.attempts.length}`);

        // Calculate statistics
        const scores = quiz.attempts
          .filter((a) => a.completedAt)
          .map((a) => a.score);

        if (scores.length > 0) {
          const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
          const maxScore = Math.max(...scores);
          const minScore = Math.min(...scores);

          console.log(`Average Score: ${avgScore.toFixed(2)}`);
          console.log(`Highest Score: ${maxScore}`);
          console.log(`Lowest Score: ${minScore}`);
        }
      }
    }

    return response.data;
  } catch (error) {
    handleAPIError(error);
  }
}

// ==================== Example 6: Pagination ====================

async function fetchAllUsers() {
  try {
    let allUsers = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const response = await client.users.list({
        limit,
        offset,
        profileComplete: true,
      });

      allUsers.push(...response.data);
      console.log(
        `Fetched ${allUsers.length} / ${response.metadata.totalCount} users`,
      );

      if (!response.metadata.hasMore) {
        break;
      }

      offset += limit;

      // Add small delay to respect rate limits
      await sleep(1000);
    }

    console.log(`Total users fetched: ${allUsers.length}`);
    return allUsers;
  } catch (error) {
    handleAPIError(error);
  }
}

// ==================== Example 7: Fetch Database Summary ====================

async function fetchDatabaseSummary() {
  try {
    const response = await client.all();
    const { summary, systemSettings } = response.data;

    console.log("\n=== Database Summary ===");
    console.log(`Users: ${summary.totalUsers}`);
    console.log(`Attendance Sessions: ${summary.totalAttendanceSessions}`);
    console.log(`Tasks: ${summary.totalTasks}`);
    console.log(`Events: ${summary.totalEvents}`);
    console.log(`Quizzes: ${summary.totalQuizzes}`);
    console.log(`Published Projects: ${summary.totalPublishedProjects}`);
    console.log(`Project Reviews: ${summary.totalProjectReviews}`);

    console.log("\n=== System Settings ===");
    systemSettings.forEach((setting) => {
      console.log(`${setting.key}: ${setting.value}`);
    });

    return response.data;
  } catch (error) {
    handleAPIError(error);
  }
}

// ==================== Example 8: Export Users to CSV ====================

async function exportUsersToCSV(branch?: string) {
  try {
    const response = await client.users.list({
      branch,
      profileComplete: true,
      limit: 1000,
    });

    // Create CSV header
    const headers = ["Name", "Email", "Branch", "Admission Year", "GitHub"];
    const csvRows = [headers.join(",")];

    // Add user data
    response.data.forEach((user) => {
      const row = [
        user.name,
        user.email,
        user.branch || "",
        user.admissionYear || "",
        user.githubUsername || "",
      ];
      csvRows.push(row.join(","));
    });

    const csv = csvRows.join("\n");

    // In Node.js, you could write to file:
    // fs.writeFileSync('users.csv', csv);

    console.log("CSV generated:", csv.split("\n").length - 1, "users");
    return csv;
  } catch (error) {
    handleAPIError(error);
  }
}

// ==================== Example 9: Generate Leaderboard ====================

async function generateTaskLeaderboard() {
  try {
    const response = await client.tasks.withSubmissions(1000);

    // Calculate points per user
    const userPoints = new Map<string, number>();

    response.data.forEach((task) => {
      task.submissions?.forEach((submission) => {
        if (submission.status === "approved") {
          const current = userPoints.get(submission.userId) || 0;
          userPoints.set(submission.userId, current + submission.pointsAwarded);
        }
      });
    });

    // Convert to array and sort
    const leaderboard = Array.from(userPoints.entries())
      .map(([userId, points]) => ({ userId, points }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 10); // Top 10

    console.log("\n=== Task Completion Leaderboard (Top 10) ===");
    leaderboard.forEach((entry, index) => {
      console.log(`${index + 1}. User ${entry.userId}: ${entry.points} points`);
    });

    return leaderboard;
  } catch (error) {
    handleAPIError(error);
  }
}

// ==================== Example 10: Real-time Dashboard Data ====================

async function fetchDashboardData() {
  try {
    // Fetch multiple resources in parallel
    const [summaryRes, activeQuizzesRes] =
      await Promise.all([
        client.all(),
        client.quizzes.active(5),
      ]);

    const dashboardData = {
      summary: summaryRes.data.summary,
      activeQuizzes: activeQuizzesRes.data,
      lastUpdated: new Date().toISOString(),
    };

    console.log("Dashboard data fetched successfully");
    return dashboardData;
  } catch (error) {
    handleAPIError(error);
  }
}

// ==================== Helper Functions ====================

function handleAPIError(error: unknown) {
  if (error instanceof ExternalAPIError) {
    console.error(`API Error [${error.code}]:`, error.message);

    if (error.isRateLimitError()) {
      console.error("Rate limit exceeded. Please wait before retrying.");
      console.error("Retry after:", error.getRetryAfter());
    } else if (error.isAuthError()) {
      console.error("Authentication failed. Please check your API key.");
    }

    if (error.details) {
      console.error("Error details:", error.details);
    }
  } else {
    console.error("Unexpected error:", error);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ==================== Export Examples ====================

export {
  fetchCSEStudents,
  fetchActiveQuizzes,
  fetchQuizWithResults,
  fetchAllUsers,
  fetchDatabaseSummary,
  exportUsersToCSV,
  generateTaskLeaderboard,
  fetchDashboardData,
};
