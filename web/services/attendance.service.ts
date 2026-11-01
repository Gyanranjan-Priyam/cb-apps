import { AttendanceRepository } from "@/repositories/attendance.repository";
import { UserRepository } from "@/repositories/user.repository";
import { emitSocketEvent, emitSocketEventToRooms } from "@/lib/socket";

export class AttendanceService {
  /**
   * Helper to parse and extract student identifier from scanned QR text/json/url
   */
  static extractStudentIdentifier(qrContent: string): string | null {
    if (!qrContent) return null;
    const trimmed = qrContent.trim();

    // 1. Check if it is JSON
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        const candidate =
          parsed.cbUserId ||
          parsed.userId ||
          parsed.id ||
          parsed.rollNumber ||
          parsed.registration ||
          parsed.email;
        if (candidate) return String(candidate).trim();
      } catch {
        // Not valid JSON, continue with text check
      }
    }

    // 2. Check if it is a Codebreakers URL
    if (trimmed.includes("/profile/") || trimmed.includes("/member/")) {
      const parts = trimmed.split("/");
      const lastPart = parts[parts.length - 1]?.split("?")[0];
      if (lastPart) return lastPart.trim();
    }

    // 3. Fallback to raw string
    return trimmed;
  }

  /**
   * Process delegated scan or admin scan
   */
  static async processScan(params: {
    code?: string;
    sessionId?: string;
    qrContent: string;
    scannerName?: string;
    markedBy?: string;
    method?: string;
  }) {
    const { code, qrContent, scannerName } = params;
    let targetSessionId = params.sessionId;
    let normalizedCode = code?.trim().toUpperCase();

    // If a delegation code is provided, validate it
    if (normalizedCode) {
      const setting = await AttendanceRepository.getDelegationCodeSetting(normalizedCode);
      if (!setting) {
        return { success: false, status: 401, error: "Invalid attendance code" };
      }

      const codeData = JSON.parse(setting.value);
      if (codeData.expiresAt && new Date(codeData.expiresAt) < new Date()) {
        return { success: false, status: 401, error: "This attendance code has expired" };
      }
      if (!codeData.active) {
        return { success: false, status: 401, error: "This attendance code has been deactivated" };
      }

      targetSessionId = codeData.sessionId;
    }

    if (!targetSessionId) {
      return { success: false, status: 400, error: "Attendance session ID is required" };
    }

    const session = await AttendanceRepository.findSessionById(targetSessionId);
    if (!session) {
      return { success: false, status: 404, error: "Attendance session not found" };
    }

    const identifier = this.extractStudentIdentifier(qrContent);
    if (!identifier) {
      return { success: false, status: 400, error: "Could not read student identifier from QR code" };
    }

    // Search user
    const users = await UserRepository.searchUsers(identifier, 5);
    const user =
      users.find(
        (u) =>
          u.id === identifier ||
          u.cbUserId?.toLowerCase() === identifier.toLowerCase() ||
          u.email.toLowerCase() === identifier.toLowerCase() ||
          u.username?.toLowerCase() === identifier.toLowerCase() ||
          u.rollNumber?.toLowerCase() === identifier.toLowerCase()
      ) || users[0];

    if (!user) {
      return {
        success: false,
        status: 404,
        error: `Member not found for scanned ID: "${identifier}"`,
        identifier,
      };
    }

    // Target batch eligibility check
    if (session.targetBatchIds && session.targetBatchIds.length > 0) {
      if (!user.batch?.id || !session.targetBatchIds.includes(user.batch.id)) {
        return {
          success: false,
          status: 403,
          error: `Session restricted: ${user.name} is not in the assigned batch for this session.`,
        };
      }
    }

    // Check if already marked present
    const existing = await AttendanceRepository.findUserAttendance(session.id, user.id);
    const markedByString = params.markedBy || (normalizedCode ? `delegate-${normalizedCode}` : "scanner");
    const scanMethod = params.method || (normalizedCode ? "delegate-qr-scan" : "qr-scan");

    if (existing && existing.status === "present") {
      const alreadyPayload = {
        type: "delegate-scan",
        sessionId: session.id,
        sessionTitle: session.title,
        sessionNumber: session.sessionNumber,
        userId: user.id,
        userName: user.name,
        cbUserId: user.cbUserId,
        branch: user.branch,
        profileImageKey: user.profileImageKey,
        image: user.image,
        points: existing.points || 10,
        status: "present",
        alreadyMarked: true,
        scannerName: scannerName || "Scanner",
        delegateCode: normalizedCode,
        timestamp: new Date().toISOString(),
        message: `${user.name} is already marked Present`,
      };

      if (normalizedCode) {
        await emitSocketEvent(`attendance-delegate-${normalizedCode}`, "delegate-scan", alreadyPayload);
      }

      return {
        success: true,
        alreadyMarked: true,
        message: `${user.name} (${user.cbUserId || user.rollNumber || "Member"}) is already marked Present.`,
        user,
      };
    }

    // Record attendance
    const attendance = await AttendanceRepository.markAttendance({
      sessionId: session.id,
      userId: user.id,
      status: "present",
      points: 10,
      markedBy: markedByString,
      method: scanMethod,
    });

    const scanPayload = {
      type: "delegate-scan",
      sessionId: session.id,
      sessionTitle: session.title,
      sessionNumber: session.sessionNumber,
      userId: user.id,
      userName: user.name,
      cbUserId: user.cbUserId,
      branch: user.branch,
      rollNumber: user.rollNumber,
      profileImageKey: user.profileImageKey,
      image: user.image,
      points: 10,
      status: "present",
      alreadyMarked: false,
      scannerName: scannerName || "Scanner",
      delegateCode: normalizedCode,
      timestamp: new Date().toISOString(),
      message: `Marked Present: ${user.name} (+10 pts)`,
    };

    // Emit realtime events
    if (normalizedCode) {
      await emitSocketEvent(`attendance-delegate-${normalizedCode}`, "delegate-scan", scanPayload);
    }
    await emitSocketEvent(`attendance-session-${session.id}`, "attendance-updated", scanPayload);

    const userRooms = Array.from(
      new Set([
        `user-${user.id}`,
        `user:${user.id}`,
        ...(user.cbUserId ? [`user-${user.cbUserId}`, `user:${user.cbUserId}`] : []),
      ])
    );
    await emitSocketEventToRooms(userRooms, "attendance-marked", {
      ...scanPayload,
      type: "attendance-marked",
      message: `Your attendance for "${session.title}" (Session #${session.sessionNumber}) has been marked Present (+10 points)!`,
    });

    await emitSocketEvent("leaderboard", "leaderboard-updated", scanPayload);

    return {
      success: true,
      alreadyMarked: false,
      message: `Marked Present: ${user.name} (+10 pts)`,
      user,
      attendance,
    };
  }

  /**
   * Create a new session
   */
  static async createSession(data: {
    sessionNumber: number;
    title: string;
    date: string | Date;
    day: string;
    targetBatchIds?: string[];
    createdBy: string;
  }) {
    return AttendanceRepository.createSession({
      sessionNumber: data.sessionNumber,
      title: data.title,
      date: new Date(data.date),
      day: data.day,
      targetBatchIds: data.targetBatchIds,
      createdBy: data.createdBy,
    });
  }

  /**
   * List all sessions
   */
  static async listSessions(limit: number = 100, offset: number = 0) {
    return AttendanceRepository.listSessions(limit, offset);
  }

  /**
   * Get session records
   */
  static async getSessionRecords(sessionId: string) {
    return AttendanceRepository.getSessionRecords(sessionId);
  }
}
