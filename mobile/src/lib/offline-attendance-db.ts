import { SafeStorage } from "./storage-adapter";
import { RealAttendanceSession, RealAttendanceSessionDetail, RealAttendanceStudent } from "./admin-api";

const CACHE_KEYS = {
  SESSIONS: "cb_offline_attendance_sessions",
  SESSION_DETAIL_PREFIX: "cb_offline_session_detail_",
  STUDENT_DIRECTORY: "cb_offline_students_directory",
  PENDING_SYNC_QUEUE: "cb_offline_attendance_pending_queue",
};

export interface PendingAttendanceRecord {
  id: string; // unique client id
  sessionId: string;
  userId: string;
  studentName: string;
  studentEmail?: string;
  rollNumber?: string | null;
  registration?: string | null;
  status: "present" | "absent";
  points: number;
  markedAt: string;
  method: "qr-scan" | "manual";
  synced: boolean;
}

export interface OfflineScanResult {
  success: boolean;
  isOffline: boolean;
  alreadyMarked?: boolean;
  batchMismatch?: boolean;
  message?: string;
  error?: string;
  user?: {
    id?: string;
    name: string;
    email: string;
    branch?: string | null;
    rollNumber?: string | null;
    registration?: string | null;
    markedAt?: string | null;
  };
}

/**
 * Save sessions list to offline store
 */
export async function cacheSessionsList(sessions: RealAttendanceSession[]): Promise<void> {
  try {
    await SafeStorage.setItem(CACHE_KEYS.SESSIONS, JSON.stringify(sessions));
  } catch (err) {
    console.warn("Failed to cache sessions list offline:", err);
  }
}

/**
 * Get cached sessions list
 */
export async function getCachedSessionsList(): Promise<RealAttendanceSession[]> {
  try {
    const raw = await SafeStorage.getItem(CACHE_KEYS.SESSIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save full session detail and index all students into offline directory
 */
export async function cacheSessionDetail(detail: RealAttendanceSessionDetail): Promise<void> {
  try {
    // 1. Save session detail
    await SafeStorage.setItem(
      `${CACHE_KEYS.SESSION_DETAIL_PREFIX}${detail.id}`,
      JSON.stringify(detail)
    );

    // 2. Index students into global directory for instant offline lookup by ID, roll, reg, email
    const directoryRaw = await SafeStorage.getItem(CACHE_KEYS.STUDENT_DIRECTORY);
    const directory: Record<string, RealAttendanceStudent> = directoryRaw ? JSON.parse(directoryRaw) : {};

    detail.students.forEach((student) => {
      if (student.id) directory[student.id.toLowerCase()] = student;
      if (student.email) directory[student.email.toLowerCase()] = student;
      if (student.rollNumber) directory[student.rollNumber.toLowerCase()] = student;
      if (student.registration) directory[student.registration.toLowerCase()] = student;
    });

    await SafeStorage.setItem(CACHE_KEYS.STUDENT_DIRECTORY, JSON.stringify(directory));
  } catch (err) {
    console.warn("Failed to cache session detail offline:", err);
  }
}

/**
 * Get cached session detail
 */
export async function getCachedSessionDetail(sessionId: string): Promise<RealAttendanceSessionDetail | null> {
  try {
    const raw = await SafeStorage.getItem(`${CACHE_KEYS.SESSION_DETAIL_PREFIX}${sessionId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}


/**
 * Look up student offline by any identifier (id, qr url, roll, reg, email)
 */
export async function lookupStudentOffline(identifier: string): Promise<RealAttendanceStudent | null> {
  try {
    let clean = identifier.trim();
    if (clean.includes("/member/")) {
      clean = clean.split("/member/")[1].split("?")[0].trim();
    } else if (clean.startsWith("{") && clean.endsWith("}")) {
      try {
        const parsed = JSON.parse(clean);
        clean = parsed.userId || parsed.id || parsed.cbUserId || parsed.roll || clean;
      } catch {
        // use clean
      }
    }

    const directoryRaw = await SafeStorage.getItem(CACHE_KEYS.STUDENT_DIRECTORY);
    if (!directoryRaw) return null;

    const directory: Record<string, RealAttendanceStudent> = JSON.parse(directoryRaw);
    return directory[clean.toLowerCase()] || null;
  } catch {
    return null;
  }
}

/**
 * Record an offline scan: checks batch mismatch, checks already marked, updates local state & queue
 */
export async function recordOfflineScan(
  sessionId: string,
  identifier: string
): Promise<OfflineScanResult> {
  try {
    const session = await getCachedSessionDetail(sessionId);
    const student = await lookupStudentOffline(identifier);

    if (!student) {
      return {
        success: false,
        isOffline: true,
        error: `No offline student record found for "${identifier}". Pre-load session online first.`,
      };
    }

    // 1. Check Batch Mismatch if session has targeted batches
    if (session && session.targetBatchIds && session.targetBatchIds.length > 0) {
      const isEligible = student.batchId && session.targetBatchIds.includes(student.batchId);
      if (!isEligible) {
        return {
          success: false,
          isOffline: true,
          batchMismatch: true,
          error: `Student ${student.name} does not belong to this session's assigned batch.`,
          user: {
            id: student.id,
            name: student.name,
            email: student.email,
            branch: student.branch,
            rollNumber: student.rollNumber,
          },
        };
      }
    }

    // 2. Check if already marked in local queue or session
    const queue = await getPendingSyncQueue();
    const alreadyInQueue = queue.some(
      (item) => item.sessionId === sessionId && item.userId === student.id && item.status === "present"
    );
    const alreadyInSession = student.status === "present";

    const isAlreadyMarked = alreadyInQueue || alreadyInSession;

    const currentTime = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    if (isAlreadyMarked) {
      return {
        success: true,
        isOffline: true,
        alreadyMarked: true,
        message: `Attendance for ${student.name} was already recorded offline.`,
        user: {
          id: student.id,
          name: student.name,
          email: student.email,
          branch: student.branch,
          rollNumber: student.rollNumber,
          markedAt: currentTime,
        },
      };
    }

    // 3. Add to Pending Sync Queue
    const newRecord: PendingAttendanceRecord = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      sessionId,
      userId: student.id,
      studentName: student.name,
      studentEmail: student.email,
      rollNumber: student.rollNumber,
      registration: student.registration,
      status: "present",
      points: 50,
      markedAt: new Date().toISOString(),
      method: "qr-scan",
      synced: false,
    };

    // Replace or add in queue
    const updatedQueue = queue.filter(
      (item) => !(item.sessionId === sessionId && item.userId === student.id)
    );
    updatedQueue.push(newRecord);
    await SafeStorage.setItem(CACHE_KEYS.PENDING_SYNC_QUEUE, JSON.stringify(updatedQueue));

    // 4. Update cached session detail student presence
    if (session) {
      const updatedStudents = session.students.map((s) =>
        s.id === student.id
          ? { ...s, status: "present" as const, markedAt: currentTime, method: "qr-scan" }
          : s
      );
      const presentCount = updatedStudents.filter((s) => s.status === "present").length;
      await cacheSessionDetail({
        ...session,
        students: updatedStudents,
        presentCount,
        absentCount: Math.max(0, session.totalEligible - presentCount),
      });
    }

    return {
      success: true,
      isOffline: true,
      alreadyMarked: false,
      message: `Offline attendance recorded for ${student.name}. Will sync when online.`,
      user: {
        id: student.id,
        name: student.name,
        email: student.email,
        branch: student.branch,
        rollNumber: student.rollNumber,
        markedAt: currentTime,
      },
    };
  } catch (err) {
    return {
      success: false,
      isOffline: true,
      error: err instanceof Error ? err.message : "Failed to record offline attendance.",
    };
  }
}

/**
 * Toggle student attendance manually offline
 */
export async function toggleOfflineStudentAttendance(
  sessionId: string,
  userId: string,
  status: "present" | "absent"
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getCachedSessionDetail(sessionId);
    if (!session) return { success: false, error: "Session not cached offline." };

    const student = session.students.find((s) => s.id === userId);
    if (!student) return { success: false, error: "Student not found in session." };

    const queue = await getPendingSyncQueue();
    const updatedQueue = queue.filter(
      (item) => !(item.sessionId === sessionId && item.userId === userId)
    );

    updatedQueue.push({
      id: `offline_manual_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      sessionId,
      userId,
      studentName: student.name,
      studentEmail: student.email,
      rollNumber: student.rollNumber,
      registration: student.registration,
      status,
      points: status === "present" ? 50 : 0,
      markedAt: new Date().toISOString(),
      method: "manual",
      synced: false,
    });

    await SafeStorage.setItem(CACHE_KEYS.PENDING_SYNC_QUEUE, JSON.stringify(updatedQueue));

    // Update cached session
    const updatedStudents = session.students.map((s) =>
      s.id === userId
        ? {
            ...s,
            status,
            markedAt: status === "present" ? new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) : null,
            method: "manual",
          }
        : s
    );
    const presentCount = updatedStudents.filter((s) => s.status === "present").length;

    await cacheSessionDetail({
      ...session,
      students: updatedStudents,
      presentCount,
      absentCount: Math.max(0, session.totalEligible - presentCount),
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Offline toggle failed." };
  }
}

/**
 * Get all pending offline attendance records
 */
export async function getPendingSyncQueue(sessionId?: string): Promise<PendingAttendanceRecord[]> {
  try {
    const raw = await SafeStorage.getItem(CACHE_KEYS.PENDING_SYNC_QUEUE);
    const queue: PendingAttendanceRecord[] = raw ? JSON.parse(raw) : [];
    if (sessionId) {
      return queue.filter((item) => item.sessionId === sessionId);
    }
    return queue;
  } catch {
    return [];
  }
}

/**
 * Get count of pending unsynced records
 */
export async function getPendingSyncCount(sessionId?: string): Promise<number> {
  const queue = await getPendingSyncQueue(sessionId);
  return queue.length;
}

/**
 * Clear synced records from the pending queue after successful server sync
 */
export async function clearSyncedQueueRecords(recordIds?: string[]): Promise<void> {
  try {
    if (!recordIds || recordIds.length === 0) {
      // Clear entire pending queue
      await SafeStorage.removeItem(CACHE_KEYS.PENDING_SYNC_QUEUE);
    } else {
      const queue = await getPendingSyncQueue();
      const idSet = new Set(recordIds);
      const remaining = queue.filter((item) => !idSet.has(item.id));
      await SafeStorage.setItem(CACHE_KEYS.PENDING_SYNC_QUEUE, JSON.stringify(remaining));
    }
  } catch (err) {
    console.warn("Failed to clear synced queue records:", err);
  }
}

/**
 * Clear all offline attendance cache and queues
 */
export async function clearAllOfflineAttendanceData(): Promise<void> {
  try {
    const allKeys = await SafeStorage.getAllKeys();
    const attendanceKeys = allKeys.filter(
      (k) =>
        k.startsWith("cb_offline_attendance") ||
        k.startsWith(CACHE_KEYS.SESSION_DETAIL_PREFIX) ||
        k.startsWith(CACHE_KEYS.STUDENT_DIRECTORY)
    );
    if (attendanceKeys.length > 0) {
      await Promise.all(attendanceKeys.map((k) => SafeStorage.removeItem(k)));
    }
  } catch (err) {
    console.warn("Failed to clear offline attendance data:", err);
  }
}


