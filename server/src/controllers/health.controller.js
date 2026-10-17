import { checkDbConnection } from '../db/pool.js';
import { checkRedisConnection } from '../cache/redis.js';

/**
 * Health check controller
 * Provides service health status, timestamp, uptime, database, and cache connectivity.
 */
export const getHealth = async (req, res) => {
  const isDbUp = await checkDbConnection();
  const isRedisUp = await checkRedisConnection();

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    service: 'gitstory-api',
    database: isDbUp ? 'connected' : 'disconnected',
    cache: isRedisUp ? 'connected' : 'disconnected',
  });
};

