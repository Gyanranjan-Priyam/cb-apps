import { UserRepository } from "@/repositories/user.repository";
import { getCache, setCache, deleteCache } from "@/lib/redis";
import { Prisma } from "@prisma/client";

export class UserService {
  /**
   * Check if a username is available
   */
  static async checkUsernameAvailability(username: string, currentUserId?: string) {
    const cleanUsername = username.trim().toLowerCase();

    // Validation rules
    const isValidFormat = /^[a-z0-9_]{3,20}$/.test(cleanUsername);
    if (!isValidFormat) {
      return {
        available: false,
        reason: "Username must be 3-20 characters long and can only contain letters, numbers, and underscores.",
      };
    }

    const reservedUsernames = [
      "admin",
      "administrator",
      "root",
      "system",
      "mod",
      "moderator",
      "codebreaker",
      "codebreakers",
      "official",
      "gcek",
      "api",
      "auth",
      "user",
      "null",
      "undefined",
    ];

    if (reservedUsernames.includes(cleanUsername)) {
      return {
        available: false,
        reason: "This username is reserved and cannot be chosen.",
      };
    }

    const existing = await UserRepository.findByUsername(cleanUsername);
    if (existing && existing.id !== currentUserId) {
      return {
        available: false,
        reason: "Username is already taken.",
      };
    }

    return { available: true, username: cleanUsername };
  }

  /**
   * Get complete user profile
   */
  static async getUserProfile(userId: string) {
    const user = await UserRepository.findById(userId);
    if (!user) return null;

    // Attach user points
    const pointsMap = await UserRepository.getMembersPointsData([userId]);
    const userPoints = pointsMap.get(userId) || {
      points: { total: 0, attendance: 0, tasks: 0, events: 0, quizzes: 0 },
      activity: { sessionsAttended: 0, tasksCompleted: 0, eventsParticipated: 0, quizzesTaken: 0 },
    };

    return {
      ...user,
      ...userPoints,
    };
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(userId: string, data: Prisma.UserUpdateInput) {
    // If username is changing, validate availability
    if (data.username && typeof data.username === "string") {
      const availability = await this.checkUsernameAvailability(data.username, userId);
      if (!availability.available) {
        throw new Error(availability.reason || "Invalid username");
      }
      data.username = data.username.trim().toLowerCase();
    }

    const updated = await UserRepository.update(userId, data);
    await deleteCache(`user:${userId}`);
    return updated;
  }

  /**
   * Get members directory with filters, pagination, and points
   */
  static async getMembersDirectory(params: {
    branch?: string | null;
    admissionYear?: string | null;
    profileComplete?: boolean | null;
    batchId?: string | null;
    includePoints?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const cacheKey = `members:${JSON.stringify(params)}`;
    const cached = await getCache<any>(cacheKey);
    if (cached) return cached;

    const { members, totalCount, limit, offset } = await UserRepository.findMembers(params);

    if (params.includePoints && members.length > 0) {
      const userIds = members.map((m) => m.id);
      const pointsMap = await UserRepository.getMembersPointsData(userIds);

      const membersWithPoints = members.map((m) => {
        const stats = pointsMap.get(m.id) || {
          points: { total: 0, attendance: 0, tasks: 0, events: 0, quizzes: 0 },
          activity: { sessionsAttended: 0, tasksCompleted: 0, eventsParticipated: 0, quizzesTaken: 0 },
        };
        return {
          ...m,
          ...stats,
        };
      });

      const response = {
        members: membersWithPoints,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      };

      await setCache(cacheKey, response, 120); // 2 minutes cache
      return response;
    }

    const response = {
      members,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    };

    await setCache(cacheKey, response, 120);
    return response;
  }

  /**
   * Link GitHub Account
   */
  static async linkGithubAccount(userId: string, githubUsername: string) {
    const updated = await UserRepository.update(userId, {
      githubUsername: githubUsername.trim(),
    });
    await deleteCache(`user:${userId}`);
    return updated;
  }

  /**
   * Unlink GitHub Account
   */
  static async unlinkGithubAccount(userId: string) {
    const updated = await UserRepository.update(userId, {
      githubUsername: null,
    });
    await deleteCache(`user:${userId}`);
    return updated;
  }
}
