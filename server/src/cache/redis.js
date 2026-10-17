import { createClient } from 'redis';

let redisClient = null;
let isConnected = false;
let connectionAttempted = false;

const DEFAULT_TTL_SECONDS = parseInt(process.env.CACHE_TTL_SECONDS || '300', 10);

/**
 * Initializes and returns the Redis client singleton.
 * Returns null if REDIS_URL is not configured or connection fails.
 */
export function getRedisClient() {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl || !redisUrl.trim()) {
    return null;
  }

  try {
    redisClient = createClient({
      url: redisUrl.trim(),
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            return false; // Stop auto-reconnecting after 3 attempts
          }
          return Math.min(retries * 500, 2000);
        },
        connectTimeout: 3000,
      },
    });

    redisClient.on('error', (err) => {
      console.warn(`[Redis Cache Warning] ${err.message}`);
      isConnected = false;
    });

    redisClient.on('ready', () => {
      isConnected = true;
      console.log('[Redis Cache] Connected and ready.');
    });

    redisClient.on('end', () => {
      isConnected = false;
    });

    // Attempt initial connect asynchronously
    if (!connectionAttempted) {
      connectionAttempted = true;
      redisClient.connect().catch((err) => {
        console.warn(`[Redis Connection Warning] Could not connect to Redis: ${err.message}`);
        isConnected = false;
      });
    }

    return redisClient;
  } catch (err) {
    console.warn(`[Redis Initialization Warning] ${err.message}`);
    return null;
  }
}

/**
 * Safe helper to build structured cache keys.
 * e.g. "gitstory:repo:expressjs/express:metadata"
 */
export function buildCacheKey(namespace, ...parts) {
  const sanitizedParts = parts.map((p) => String(p || '').toLowerCase().trim());
  return `gitstory:${namespace}:${sanitizedParts.join(':')}`;
}

/**
 * Retrieves cached item by key.
 * Returns null on cache miss or when Redis is offline.
 * 
 * @param {string} key
 * @returns {Promise<any|null>}
 */
export async function getCache(key) {
  const client = getRedisClient();
  if (!client || !isConnected) return null;

  try {
    const raw = await client.get(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[Redis getCache Warning] ${err.message}`);
    return null;
  }
}

/**
 * Stores item in cache with configurable TTL.
 * 
 * @param {string} key
 * @param {any} value
 * @param {number} ttlSeconds - Expiration time in seconds (defaults to CACHE_TTL_SECONDS or 300)
 * @returns {Promise<boolean>}
 */
export async function setCache(key, value, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const client = getRedisClient();
  if (!client || !isConnected) return false;

  try {
    const serialized = JSON.stringify(value);
    const ttl = Math.max(1, parseInt(ttlSeconds || DEFAULT_TTL_SECONDS, 10));
    await client.set(key, serialized, { EX: ttl });
    return true;
  } catch (err) {
    console.warn(`[Redis setCache Warning] ${err.message}`);
    return false;
  }
}

/**
 * Removes a key from the cache.
 * 
 * @param {string} key
 * @returns {Promise<boolean>}
 */
export async function deleteCache(key) {
  const client = getRedisClient();
  if (!client || !isConnected) return false;

  try {
    await client.del(key);
    return true;
  } catch (err) {
    console.warn(`[Redis deleteCache Warning] ${err.message}`);
    return false;
  }
}

/**
 * Checks Redis connectivity status.
 * 
 * @returns {Promise<boolean>}
 */
export async function checkRedisConnection() {
  const client = getRedisClient();
  if (!client || !isConnected) return false;

  try {
    const pong = await client.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}

/**
 * Closes the Redis connection gracefully during shutdown or test cleanup.
 */
export async function closeRedis() {
  if (redisClient) {
    try {
      if (isConnected) {
        await redisClient.quit();
      } else {
        await redisClient.disconnect();
      }
    } catch {
      // ignore close errors
    } finally {
      redisClient = null;
      isConnected = false;
      connectionAttempted = false;
    }
  }
}
