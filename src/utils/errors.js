import { HttpStatus, ErrorCode } from './constants.js';

export class AppError extends Error {
  constructor(message, statusCode = HttpStatus.INTERNAL_SERVER_ERROR, errorCode = ErrorCode.INTERNAL_SERVER_ERROR, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', details = null) {
    super(message, HttpStatus.BAD_REQUEST, ErrorCode.BAD_REQUEST, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = null) {
    super(message, HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access', details = null) {
    super(message, HttpStatus.UNAUTHORIZED, ErrorCode.AUTHENTICATION_ERROR, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden resource', details = null) {
    super(message, HttpStatus.FORBIDDEN, ErrorCode.AUTHORIZATION_ERROR, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details = null) {
    super(message, HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists', details = null) {
    super(message, HttpStatus.CONFLICT, ErrorCode.CONFLICT, details);
  }
}
