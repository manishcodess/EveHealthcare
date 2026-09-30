import { ValidationError } from '../utils/errors.js';

/**
 * Middleware factory to validate request body against a Zod schema
 * @param {import('zod').ZodSchema} schema
 */
export const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errorDetails = result.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    return next(new ValidationError('Validation failed for request body', errorDetails));
  }

  req.body = result.data;
  next();
};

/**
 * Middleware factory to validate request query parameters against a Zod schema
 * @param {import('zod').ZodSchema} schema
 */
export const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);

  if (!result.success) {
    const errorDetails = result.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    return next(new ValidationError('Validation failed for query parameters', errorDetails));
  }

  req.query = result.data;
  next();
};

/**
 * Middleware factory to validate request route params against a Zod schema
 * @param {import('zod').ZodSchema} schema
 */
export const validateParams = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.params);

  if (!result.success) {
    const errorDetails = result.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    return next(new ValidationError('Validation failed for route parameters', errorDetails));
  }

  req.params = result.data;
  next();
};
