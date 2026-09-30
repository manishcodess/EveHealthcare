import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { requestLogger } from './middleware/logger.middleware.js';
import apiRouter from './routes/index.js';
import paymentRoutes from './routes/payment.routes.js';
import { sendSuccess } from './utils/response.js';

const app = express();

// Security, parsing and logging middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(requestLogger);

// OpenAPI / Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Health check endpoint
app.get('/health', (req, res) => {
  return sendSuccess(res, {
    status: 'UP',
    service: 'EVE Healthcare Diagnostic Booking Service',
    stage: 'Stage 2 (Payments, Webhooks & Idempotency)',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    docs: '/api-docs',
  });
});

// Route aliases for /payments and /payments/webhook
app.use('/payments', paymentRoutes);

// Base API Routes
app.use('/api', apiRouter);

// 404 Not Found handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

export default app;
