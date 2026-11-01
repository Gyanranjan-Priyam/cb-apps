"use client";

import type { RoadmapData, UserProgressData } from "./types";

const DB_NAME = "CodeBreakers_Roadmaps_DB";
const DB_VERSION = 1;
const STORE_ROADMAPS = "roadmaps";
const STORE_PROGRESS = "user_progress";

function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB not supported"));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_ROADMAPS)) {
        db.createObjectStore(STORE_ROADMAPS, { keyPath: "slug" });
      }
      if (!db.objectStoreNames.contains(STORE_PROGRESS)) {
        db.createObjectStore(STORE_PROGRESS, { keyPath: "roadmapId" });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Save single roadmap to LocalDB (IndexedDB & LocalStorage fallback)
 */
export async function saveRoadmapToLocalDB(roadmap: RoadmapData): Promise<void> {
  if (typeof window === "undefined") return;

  const slug = roadmap.slug || roadmap.id;
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(STORE_ROADMAPS, "readwrite");
    const store = tx.objectStore(STORE_ROADMAPS);
    store.put({ ...roadmap, slug, cachedAt: Date.now() });
  } catch {
    // Fallback to localStorage
    try {
      localStorage.setItem(`rm_cache_${slug}`, JSON.stringify({ ...roadmap, cachedAt: Date.now() }));
    } catch {}
  }
}

/**
 * Get single roadmap from LocalDB
 */
export async function getRoadmapFromLocalDB(slug: string): Promise<RoadmapData | null> {
  if (typeof window === "undefined") return null;

  try {
    const db = await openIndexedDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_ROADMAPS, "readonly");
      const store = tx.objectStore(STORE_ROADMAPS);
      const req = store.get(slug);

      req.onsuccess = () => {
        if (req.result) {
          resolve(req.result as RoadmapData);
        } else {
          // Try localStorage fallback
          const local = localStorage.getItem(`rm_cache_${slug}`);
          resolve(local ? JSON.parse(local) : null);
        }
      };

      req.onerror = () => {
        const local = localStorage.getItem(`rm_cache_${slug}`);
        resolve(local ? JSON.parse(local) : null);
      };
    });
  } catch {
    try {
      const local = localStorage.getItem(`rm_cache_${slug}`);
      return local ? JSON.parse(local) : null;
    } catch {
      return null;
    }
  }
}

/**
 * Save user progress locally in LocalDB
 */
export async function saveProgressToLocalDB(progress: UserProgressData): Promise<void> {
  if (typeof window === "undefined" || !progress.roadmapId) return;

  try {
    const db = await openIndexedDB();
    const tx = db.transaction(STORE_PROGRESS, "readwrite");
    const store = tx.objectStore(STORE_PROGRESS);
    store.put({ ...progress, cachedAt: Date.now() });
  } catch {
    try {
      localStorage.setItem(`rm_prog_${progress.roadmapId}`, JSON.stringify(progress));
    } catch {}
  }
}

/**
 * Get user progress from LocalDB
 */
export async function getProgressFromLocalDB(roadmapId: string): Promise<UserProgressData | null> {
  if (typeof window === "undefined" || !roadmapId) return null;

  try {
    const db = await openIndexedDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_PROGRESS, "readonly");
      const store = tx.objectStore(STORE_PROGRESS);
      const req = store.get(roadmapId);

      req.onsuccess = () => {
        if (req.result) {
          resolve(req.result as UserProgressData);
        } else {
          const local = localStorage.getItem(`rm_prog_${roadmapId}`);
          resolve(local ? JSON.parse(local) : null);
        }
      };

      req.onerror = () => {
        const local = localStorage.getItem(`rm_prog_${roadmapId}`);
        resolve(local ? JSON.parse(local) : null);
      };
    });
  } catch {
    try {
      const local = localStorage.getItem(`rm_prog_${roadmapId}`);
      return local ? JSON.parse(local) : null;
    } catch {
      return null;
    }
  }
}
