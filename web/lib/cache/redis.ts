import Redis from "ioredis";

// Global cache storage for in-memory fallback when standalone Redis server is not provided
const inMemoryCache = new Map<string, { value: any; expiresAt: number }>();

let redisClient: Redis | null = null;

function getRedisInstance(): Redis | null {
  if (typeof window !== "undefined") return null;

  if (redisClient) return redisClient;

  const redisUrl =
    process.env.REDIS_URL ||
    process.env.UPSTASH_REDIS_URL ||
    process.env.REDIS_CACHE_URL;

  if (redisUrl) {
    try {
      redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 2,
        connectTimeout: 4000,
        lazyConnect: true,
        retryStrategy: (times) => {
          if (times > 3) return null;
          return Math.min(times * 100, 1000);
        },
      });

      redisClient.on("error", (err) => {
        console.warn("[Redis Cache Warning]:", err?.message || err);
      });
    } catch (e) {
      console.warn("[Redis Init Error, using In-Memory Fallback]:", e);
      redisClient = null;
    }
  }

  return redisClient;
}

/**
 * Get cached item from Redis or In-Memory cache
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const client = getRedisInstance();

  if (client) {
    try {
      if (client.status !== "ready" && client.status !== "connecting") {
        await client.connect();
      }
      const data = await client.get(key);
      if (data) {
        return JSON.parse(data) as T;
      }
    } catch (err) {
      // Fallback to in-memory on error
    }
  }

  // In-Memory Fallback
  const cached = inMemoryCache.get(key);
  if (cached) {
    if (Date.now() > cached.expiresAt) {
      inMemoryCache.delete(key);
      return null;
    }
    return cached.value as T;
  }

  return null;
}

/**
 * Set item in Redis and In-Memory cache with TTL (in seconds)
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number = 3600
): Promise<void> {
  const serialized = JSON.stringify(value);

  // Store in In-Memory Cache
  inMemoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });

  const client = getRedisInstance();
  if (client) {
    try {
      if (client.status !== "ready" && client.status !== "connecting") {
        await client.connect();
      }
      await client.setex(key, ttlSeconds, serialized);
    } catch (err) {
      // In-memory cache is already updated
    }
  }
}

/**
 * Delete cache key or pattern
 */
export async function deleteCache(keyPattern: string): Promise<void> {
  // Delete from in-memory cache
  for (const k of inMemoryCache.keys()) {
    if (k === keyPattern || k.startsWith(keyPattern.replace("*", ""))) {
      inMemoryCache.delete(k);
    }
  }

  const client = getRedisInstance();
  if (client) {
    try {
      if (client.status !== "ready" && client.status !== "connecting") {
        await client.connect();
      }

      if (keyPattern.includes("*")) {
        const keys = await client.keys(keyPattern);
        if (keys.length > 0) {
          await client.del(...keys);
        }
      } else {
        await client.del(keyPattern);
      }
    } catch (err) {
      // Fallback handled
    }
  }
}

/**
 * High-performance fetch wrapper with SWR cache
 */
export async function cachedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = 3600
): Promise<T> {
  const cached = await getCache<T>(key);
  if (cached !== null && cached !== undefined) {
    return cached;
  }

  const fresh = await fetchFn();
  if (fresh !== null && fresh !== undefined) {
    await setCache<T>(key, fresh, ttlSeconds);
  }

  return fresh;
}
