/**
 * Optional Redis cache (e.g. Render Redis). If REDIS_URL is set, TMDB responses are cached.
 * Otherwise get returns null and set is a no-op.
 */

import { getConfig } from "./config.js";

interface RedisLike {
  get(key: string): Promise<string | null>;
  setex(key: string, ttl: number, value: string): Promise<string>;
  on(event: string, fn: (err: Error) => void): void;
}

let client: RedisLike | null = null;
let clientPromise: Promise<RedisLike | null> | null = null;

async function getClient(): Promise<RedisLike | null> {
  if (client !== null) return client;
  if (clientPromise !== null) return clientPromise;
  const url = getConfig().redisUrl;
  if (!url) return null;
  clientPromise = (async () => {
    try {
      const { default: Redis } = await import("ioredis");
      const RedisCtor = Redis as unknown as new (u: string, o?: object) => RedisLike;
      const c = new RedisCtor(url, { maxRetriesPerRequest: 2 });
      const { logger } = await import("./logger.js");
      c.on("error", (err: Error) => logger.warn("[cache] Redis error: " + err.message));
      client = c;
      return c;
    } catch (e) {
      const { logger } = await import("./logger.js");
      logger.warn("[cache] Redis connect failed:", e as Error);
      return null;
    } finally {
      clientPromise = null;
    }
  })();
  return clientPromise;
}

/** Get cached JSON value; returns null if missing or cache disabled */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = await getClient();
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    if (raw == null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Set cached value with TTL in seconds */
export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const redis = await getClient();
  if (!redis) return;
  try {
    const raw = JSON.stringify(value);
    await redis.setex(key, ttlSeconds, raw);
  } catch {
    // ignore
  }
}
