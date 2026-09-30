import { env } from '../config/env.js';

/**
 * Structured request and audit logger middleware
 */
export const requestLogger = (req, res, next) => {
  if (env.NODE_ENV === 'test') {
    return next();
  }

  const start = Date.now();
  const { method, originalUrl, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    // Base log details
    const logInfo = {
      timestamp: new Date().toISOString(),
      method,
      path: originalUrl,
      status: statusCode,
      durationMs: duration,
      ip: ip || req.socket.remoteAddress,
    };

    // Specific audit context for webhook events (without sensitive data)
    if (originalUrl.includes('/webhook') && req.body) {
      logInfo.webhook = {
        eventId: req.body.eventId,
        bookingId: req.body.bookingId,
        incomingStatus: req.body.status,
      };
    }

    const statusSymbol = statusCode >= 400 ? '⚠️' : '✅';
    console.log(`${statusSymbol} [${logInfo.timestamp}] ${method} ${originalUrl} ${statusCode} - ${duration}ms`);
  });

  next();
};
