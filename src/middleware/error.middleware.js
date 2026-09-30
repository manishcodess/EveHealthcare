import { Prisma } from '@prisma/client';
import { env } from '../config/env.js';
import { HttpStatus, ErrorCode } from '../utils/constants.js';
import { AppError, NotFoundError } from '../utils/errors.js';
import { sendError } from '../utils/response.js';

/**
 * 404 Not Found handler for unmatched routes
 */
export const notFoundHandler = (req, res, next) => {
  next(new NotFoundError(`Resource not found: ${req.method} ${req.originalUrl}`));
};

/**
 * Centralized error-handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  // If response is already sent, delegate to default express handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle custom AppErrors
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.errorCode, err.details);
  }

  // Handle Prisma Database Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation (e.g. unique email or unique offering)
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'field';
      return sendError(
        res,
        `A record with this ${target} already exists`,
        HttpStatus.CONFLICT,
        ErrorCode.CONFLICT,
        { target: err.meta?.target }
      );
    }

    // Record to update not found
    if (err.code === 'P2025') {
      return sendError(
        res,
        err.meta?.cause || 'Requested record was not found',
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND
      );
    }

    // Foreign key constraint failed
    if (err.code === 'P2003') {
      return sendError(
        res,
        `Related record not found (Foreign key constraint violation)`,
        HttpStatus.BAD_REQUEST,
        ErrorCode.BAD_REQUEST,
        { field: err.meta?.field_name }
      );
    }
  }

  // Handle SyntaxError (JSON body parsing errors)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendError(
      res,
      'Malformed JSON payload in request body',
      HttpStatus.BAD_REQUEST,
      ErrorCode.BAD_REQUEST
    );
  }

  // Log unexpected errors
  console.error('💥 Unhandled Error:', err);

  // Generic 500 Internal Server Error (hide internal stack in non-development)
  const isDev = env.NODE_ENV === 'development';
  return sendError(
    res,
    isDev ? err.message : 'An unexpected internal server error occurred',
    HttpStatus.INTERNAL_SERVER_ERROR,
    ErrorCode.INTERNAL_SERVER_ERROR,
    isDev ? { stack: err.stack } : null
  );
};
