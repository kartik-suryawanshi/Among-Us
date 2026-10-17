import 'dotenv/config';
import app from './app.js';
import { runMigrations } from './db/migrations.js';
import { closePool } from './db/pool.js';

const PORT = process.env.PORT || 4000;

// Run database migrations if database is configured
runMigrations().catch((err) => {
  console.warn('[PostgreSQL Migration Warning]', err.message);
});

const server = app.listen(PORT, () => {
  console.log(`[GitStory Server] Running on http://localhost:${PORT}`);
  console.log(`[GitStory Server] Health endpoint: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('[GitStory Server] SIGTERM signal received: closing HTTP server');
  await closePool();
  server.close(() => {
    console.log('[GitStory Server] HTTP server closed');
  });
});

process.on('SIGINT', async () => {
  console.log('[GitStory Server] SIGINT signal received: closing HTTP server');
  await closePool();
  server.close(() => {
    console.log('[GitStory Server] HTTP server closed');
  });
});

export default server;
