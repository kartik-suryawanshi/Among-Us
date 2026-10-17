import { checkDbConnection } from '../db/pool.js';

/**
 * Health check controller
 * Provides service health status, timestamp, uptime, and database connectivity.
 */
export const getHealth = async (req, res) => {
  const isDbUp = await checkDbConnection();

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    service: 'gitstory-api',
    database: isDbUp ? 'connected' : 'disconnected',
  });
};

