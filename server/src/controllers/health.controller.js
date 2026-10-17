/**
 * Health check controller
 * Provides service health status, timestamp, and uptime
 */
export const getHealth = (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    service: 'gitstory-api',
  });
};
