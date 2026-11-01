import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";

// In-Memory L1 Cache for instant synchronous-like speed
const memoryCache = new Map<string, string>();

const STORAGE_DIR = `${FileSystem.documentDirectory || ""}cb_offline_storage/`;

let isDirInitialized = false;

async function ensureStorageDir(): Promise<void> {
  if (Platform.OS === "web" || isDirInitialized) return;
  try {
    const dirInfo = await FileSystem.getInfoAsync(STORAGE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(STORAGE_DIR, { intermediates: true });
    }
    isDirInitialized = true;
  } catch {
    // ignore
  }
}

// Auto-warm RAM cache on startup
async function preloadStorage(): Promise<void> {
  try {
    if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith("cb_offline_")) {
          const val = window.localStorage.getItem(k);
          if (val) memoryCache.set(k, val);
        }
      }
    } else if (Platform.OS !== "web" && FileSystem.documentDirectory) {
      await ensureStorageDir();
      const files = await FileSystem.readDirectoryAsync(STORAGE_DIR);
      await Promise.all(
        files.map(async (fileName) => {
          if (fileName.endsWith(".json")) {
            const rawKey = fileName.replace(/\.json$/, "");
            const content = await FileSystem.readAsStringAsync(`${STORAGE_DIR}${fileName}`, {
              encoding: FileSystem.EncodingType.UTF8,
            });
            if (content) memoryCache.set(rawKey, content);
          }
        })
      );
    }
  } catch {
    // ignore
  }
}

// Start preloading immediately in background
void preloadStorage();

function sanitizeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9_-]/g, "_");
}


export const SafeStorage = {
  async getItem(key: string): Promise<string | null> {
    // 1. Check L1 memory cache first
    if (memoryCache.has(key)) {
      return memoryCache.get(key) || null;
    }

    // 2. Web localStorage
    if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
      try {
        const val = window.localStorage.getItem(key);
        if (val !== null) memoryCache.set(key, val);
        return val;
      } catch {
        // fallback to memory
      }
    }

    // 3. Native FileSystem
    if (Platform.OS !== "web" && FileSystem.documentDirectory) {
      try {
        await ensureStorageDir();
        const safeName = sanitizeKey(key);
        const fileUri = `${STORAGE_DIR}${safeName}.json`;
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (fileInfo.exists) {
          const content = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.UTF8,
          });
          if (content) {
            memoryCache.set(key, content);
            return content;
          }
        }
      } catch (err) {
        console.warn(`SafeStorage read error for key [${key}]:`, err);
      }
    }

    return memoryCache.get(key) || null;
  },

  async setItem(key: string, value: string): Promise<void> {
    memoryCache.set(key, value);

    // 1. Web localStorage
    if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch {
        // fallback
      }
    }

    // 2. Native FileSystem
    if (Platform.OS !== "web" && FileSystem.documentDirectory) {
      try {
        await ensureStorageDir();
        const safeName = sanitizeKey(key);
        const fileUri = `${STORAGE_DIR}${safeName}.json`;
        await FileSystem.writeAsStringAsync(fileUri, value, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      } catch (err) {
        console.warn(`SafeStorage write error for key [${key}]:`, err);
      }
    }
  },

  async removeItem(key: string): Promise<void> {
    memoryCache.delete(key);

    // 1. Web localStorage
    if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore
      }
    }

    // 2. Native FileSystem
    if (Platform.OS !== "web" && FileSystem.documentDirectory) {
      try {
        await ensureStorageDir();
        const safeName = sanitizeKey(key);
        const fileUri = `${STORAGE_DIR}${safeName}.json`;
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      } catch {
        // ignore
      }
    }
  },

  async getAllKeys(): Promise<string[]> {
    const keys = new Set<string>(memoryCache.keys());

    // 1. Web localStorage
    if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
      try {
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k) keys.add(k);
        }
      } catch {
        // ignore
      }
    }

    // 2. Native FileSystem
    if (Platform.OS !== "web" && FileSystem.documentDirectory) {
      try {
        await ensureStorageDir();
        const files = await FileSystem.readDirectoryAsync(STORAGE_DIR);
        files.forEach((f) => {
          if (f.endsWith(".json")) {
            keys.add(f.replace(/\.json$/, ""));
          }
        });
      } catch {
        // ignore
      }
    }

    return Array.from(keys);
  },
};
