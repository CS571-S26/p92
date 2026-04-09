/**
 * Redis client for server-side caching
 * 
 * Used in API routes and Server Components to cache data from microservices.
 * NOTE: This file should only be imported in server-side code.
 */

import Redis from 'ioredis';

// Redis URL from environment variables (validated at runtime)
const REDIS_URL = process.env.REDIS_URL;

// Singleton Redis client
let redis: Redis | null = null;

/**
 * Get the Redis client (singleton)
 */
export function getRedis(): Redis {
  if (!redis) {
    if (!REDIS_URL) {
      throw new Error("REDIS_URL environment variable is required");
    }
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    
    redis.on('error', (err) => {
      console.error('[Redis] Connection error:', err);
    });
    
    redis.on('connect', () => {
      console.log('[Redis] Connected successfully');
    });
  }
  return redis;
}

/**
 * Cache key patterns
 */
export const CACHE_KEYS = {
  STEAM_PROFILE: (steamId: string) => `cache:steam:profile:${steamId}`,
  STEAM_INVENTORY: (steamId: string, casesOnly: boolean) => 
    `cache:steam:inventory:${steamId}:${casesOnly ? 'cases' : 'all'}`,
} as const;

/**
 * Default TTL values (in seconds)
 */
export const CACHE_TTL = {
  STEAM_PROFILE: 300,    // 5 minutes
  STEAM_INVENTORY: 60,   // 1 minute
} as const;

/**
 * Get cached value or fetch and cache
 */
export async function getOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  const redis = getRedis();
  
  try {
    // Try to get from cache
    const cached = await redis.get(key);
    if (cached) {
      console.log(`[Redis] Cache hit: ${key}`);
      return JSON.parse(cached) as T;
    }
  } catch (error) {
    console.error(`[Redis] Cache get error for ${key}:`, error);
    // Continue to fetch fresh data
  }
  
  // Fetch fresh data
  console.log(`[Redis] Cache miss: ${key}`);
  const data = await fetcher();
  
  // Store in cache
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(data));
    console.log(`[Redis] Cached: ${key} (TTL: ${ttlSeconds}s)`);
  } catch (error) {
    console.error(`[Redis] Cache set error for ${key}:`, error);
  }
  
  return data;
}
