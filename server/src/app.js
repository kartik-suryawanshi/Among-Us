import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.routes.js';
import repositoryRoutes from './routes/repository.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

// Allowed origins configuration
const clientOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin || clientOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
  })
);

app.use(express.json());

// Base health routes (accessible at /api/health and /health)
app.use('/api/health', healthRoutes);
app.use('/health', healthRoutes);

// Repository endpoints (supporting both frontend client and spec aliases)
app.use('/api/repositories', repositoryRoutes);
app.use('/api/repos', repositoryRoutes);

// Catch-all 404 handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

export default app;
