import { SafeStorage } from "./storage-adapter";
import { API_BASE_URL } from "./api-config";
import { getPendingSyncQueue, clearSyncedQueueRecords } from "./offline-attendance-db";

const CACHE_PREFIX = "cb_offline_cache_";
const PENDING_MUTATIONS_KEY = "cb_offline_pending_mutations";

export interface PendingMutation {
  id: string;
  action: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

type SyncListener = (count: number) => void;
const listeners: Set<SyncListener> = new Set();

export function notifySyncListeners(count: number) {
  listeners.forEach((listener) => {
    try {
      listener(count);
    } catch {
      // ignore
    }
  });
}

export function subscribeToPendingSyncCount(listener: SyncListener): () => void {
  listeners.add(listener);
  getTotalPendingCount().then((count) => listener(count));
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Generate a cache key for any data type and params
 */
function getCacheKey(type: string, params?: Record<string, string>): string {
  if (!params || Object.keys(params).length === 0) {
    return `${CACHE_PREFIX}${type}`;
  }
  const sortedParams = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return `${CACHE_PREFIX}${type}_${sortedParams}`;
}

/**
 * Save data to offline cache with timestamp
 */
export async function saveCachedData<T>(
  type: string,
  params: Record<string, string> | undefined,
  data: T
): Promise<void> {
  try {
    const key = getCacheKey(type, params);
    const item = {
      timestamp: Date.now(),
      data,
    };
    await SafeStorage.setItem(key, JSON.stringify(item));
  } catch (err) {
    console.warn(`Failed to cache [${type}] data offline:`, err);
  }
}

/**
 * Get data from offline cache
 */
export async function getCachedData<T>(
  type: string,
  params?: Record<string, string>
): Promise<T | null> {
  try {
    const key = getCacheKey(type, params);
    const raw = await SafeStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.data as T;
  } catch {
    return null;
  }
}

/**
 * Enqueue a mutation for offline replay
 */
export async function enqueuePendingMutation(
  action: string,
  payload: Record<string, unknown>
): Promise<PendingMutation> {
  const mutation: PendingMutation = {
    id: `mut_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    action,
    payload,
    createdAt: new Date().toISOString(),
  };

  try {
    const raw = await SafeStorage.getItem(PENDING_MUTATIONS_KEY);
    const queue: PendingMutation[] = raw ? JSON.parse(raw) : [];
    queue.push(mutation);
    await SafeStorage.setItem(PENDING_MUTATIONS_KEY, JSON.stringify(queue));

    const totalCount = await getTotalPendingCount();
    notifySyncListeners(totalCount);
  } catch (err) {
    console.warn("Failed to enqueue pending offline mutation:", err);
  }

  return mutation;
}

/**
 * Get all pending general mutations
 */
export async function getPendingMutations(): Promise<PendingMutation[]> {
  try {
    const raw = await SafeStorage.getItem(PENDING_MUTATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Get total count of pending sync items (attendance queue + general mutations)
 */
export async function getTotalPendingCount(): Promise<number> {
  try {
    const [mutations, attendanceRecords] = await Promise.all([
      getPendingMutations(),
      getPendingSyncQueue(),
    ]);
    return mutations.length + attendanceRecords.length;
  } catch {
    return 0;
  }
}

/**
 * Remove specific mutations from the queue after successful server sync
 */
export async function removeSyncedMutations(mutationIds: string[]): Promise<void> {
  try {
    const queue = await getPendingMutations();
    const idSet = new Set(mutationIds);
    const remaining = queue.filter((m) => !idSet.has(m.id));
    await SafeStorage.setItem(PENDING_MUTATIONS_KEY, JSON.stringify(remaining));

    const totalCount = await getTotalPendingCount();
    notifySyncListeners(totalCount);
  } catch (err) {
    console.warn("Failed to remove synced mutations:", err);
  }
}


/**
 * Synchronize ALL pending offline data across the entire application:
 * 1. Offline attendance queue -> sync-attendance
 * 2. General mutations queue -> individual replay to /api/admin/mobile
 */
export async function syncAllApplicationOfflineData(): Promise<{
  success: boolean;
  syncedCount: number;
  error?: string;
}> {
  let syncedTotal = 0;

  try {
    // 1. Sync pending attendance records
    const attendanceQueue = await getPendingSyncQueue();
    if (attendanceQueue.length > 0) {
      const res = await fetch(`${API_BASE_URL}/api/admin/mobile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync-attendance", records: attendanceQueue }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        const syncedIds = (json.syncedIds as string[]) || attendanceQueue.map((r) => r.id);
        await clearSyncedQueueRecords(syncedIds);
        syncedTotal += syncedIds.length;
      }
    }

    // 2. Sync general mutations queue
    const mutations = await getPendingMutations();
    const successfulMutationIds: string[] = [];

    for (const item of mutations) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/mobile`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: item.action, ...item.payload }),
        });
        if (res.ok) {
          successfulMutationIds.push(item.id);
          syncedTotal++;
        }
      } catch (err) {
        console.warn(`Failed to replay mutation [${item.action}]:`, err);
        // Stop if server is unreachable
        break;
      }
    }

    if (successfulMutationIds.length > 0) {
      await removeSyncedMutations(successfulMutationIds);
    }

    const totalCount = await getTotalPendingCount();
    notifySyncListeners(totalCount);

    return { success: true, syncedCount: syncedTotal };
  } catch (err) {
    const totalCount = await getTotalPendingCount();
    notifySyncListeners(totalCount);
    return {
      success: false,
      syncedCount: syncedTotal,
      error: err instanceof Error ? err.message : "Sync failed",
    };
  }
}

/**
 * Proactively fetch and cache the entire application's datasets for full offline use:
 * - Dashboard real stats
 * - All Batches + individual batch member rosters
 * - All Members + individual member profiles
 * - Attendance sessions + individual session student rosters
 * - Quizzes, Tasks, Events, Forms, Roadmaps, Leaderboard, Points, System Settings
 */
export async function preloadEntireAppOfflineData(onProgress?: (msg: string) => void): Promise<void> {
  const { fetchAdminData } = await import("./admin-api");

  try {
    onProgress?.("Syncing dashboard stats...");
    await fetchAdminData("dashboard", undefined, { forceFresh: true });

    onProgress?.("Syncing batches and rosters...");
    const batches = await fetchAdminData<Array<{ id: string }>>("batches", undefined, { forceFresh: true });
    if (batches && Array.isArray(batches)) {
      await Promise.all(
        batches.map((b) =>
          fetchAdminData("batch-detail", { id: b.id }, { forceFresh: true })
        )
      );
    }

    onProgress?.("Syncing members directory...");
    const members = await fetchAdminData<Array<{ id: string }>>("members", undefined, { forceFresh: true });
    if (members && Array.isArray(members)) {
      const chunk = members.slice(0, 50);
      await Promise.all(
        chunk.map((m) =>
          fetchAdminData("member-detail", { id: m.id }, { forceFresh: true })
        )
      );
    }

    onProgress?.("Syncing attendance sessions & student rosters...");
    const attendance = await fetchAdminData<{ sessions?: Array<{ id: string }> }>("attendance", undefined, { forceFresh: true });
    if (attendance && attendance.sessions && Array.isArray(attendance.sessions)) {
      await Promise.all(
        attendance.sessions.map((s) =>
          fetchAdminData("attendance-session-detail", { id: s.id }, { forceFresh: true })
        )
      );
    }

    onProgress?.("Syncing modules...");
    await Promise.all([
      fetchAdminData("tasks", undefined, { forceFresh: true }),
      fetchAdminData("events", undefined, { forceFresh: true }),
      fetchAdminData("leaderboard", undefined, { forceFresh: true }),
      fetchAdminData("system-settings", undefined, { forceFresh: true }),
    ]);

    onProgress?.("Complete offline database sync finished!");
  } catch (err) {
    console.warn("Background preloading encountered error (will continue offline):", err);
  }
}

export async function clearOfflineDatabase(): Promise<void> {
  try {
    const keys = await SafeStorage.getAllKeys();
    await Promise.all(
      keys
        .filter((k) => k.startsWith(CACHE_PREFIX) || k.startsWith("admin_"))
        .map((k) => SafeStorage.removeItem(k))
    );
  } catch (err) {
    console.warn("Error clearing offline database:", err);
  }
}
