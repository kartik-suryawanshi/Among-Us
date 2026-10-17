"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const health_js_1 = require("./routes/health.js");
const repositories_js_1 = require("./routes/repositories.js");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
// Restrict CORS to configured frontend origin
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or same-origin)
        if (!origin || origin === CLIENT_ORIGIN || origin === 'http://localhost:5173' || origin === 'http://127.0.0.1:5173') {
            callback(null, true);
        }
        else {
            callback(new Error(`CORS blocked for origin: ${origin}`));
        }
    },
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
}));
app.use(express_1.default.json());
// API Routes
app.use('/api/health', health_js_1.healthRouter);
app.use('/api/repositories', repositories_js_1.repositoriesRouter);
// 404 handler for undefined API routes
app.use('/api/*', (_req, res) => {
    res.status(404).json({
        error: 'API endpoint not found',
        statusCode: 404,
    });
});
// Centralized error handling middleware
app.use((err, _req, res, _next) => {
    const message = err instanceof Error ? err.message : 'Internal server error occurred';
    console.error('[ServerError]', err);
    res.status(500).json({
        error: message,
        statusCode: 500,
    });
});
app.listen(PORT, () => {
    console.log(`GitStory Backend running on http://localhost:${PORT}`);
    console.log(`Allowed client origin: ${CLIENT_ORIGIN}`);
});
