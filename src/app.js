import cors from 'cors';
import express from 'express';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import apiRouter from './routes/index.js';
import { sendSuccess } from './utils/response.js';

const app = express();

// Security and utility middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  return sendSuccess(res, {
    status: 'UP',
    service: 'EVE Healthcare Diagnostic Booking Service',
    stage: 'Stage 1 (Foundation & Core Booking)',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api', apiRouter);

// 404 Not Found handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

export default app;
