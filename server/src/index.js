import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`[GitStory Server] Running on http://localhost:${PORT}`);
  console.log(`[GitStory Server] Health endpoint: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('[GitStory Server] SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('[GitStory Server] HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('[GitStory Server] SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('[GitStory Server] HTTP server closed');
  });
});

export default server;
