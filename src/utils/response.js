import { HttpStatus } from './constants.js';

/**
 * Sends a standard success response
 * @param {import('express').Response} res
 * @param {any} data
 * @param {number} [statusCode=200]
 * @param {string} [message]
 */
export const sendSuccess = (res, data, statusCode = HttpStatus.OK, message = null) => {
  const responseBody = {
    success: true,
    data,
  };

  if (message) {
    responseBody.message = message;
  }

  return res.status(statusCode).json(responseBody);
};

/**
 * Sends a 201 Created response
 * @param {import('express').Response} res
 * @param {any} data
 * @param {string} [message]
 */
export const sendCreated = (res, data, message = null) => {
  return sendSuccess(res, data, HttpStatus.CREATED, message);
};

/**
 * Sends a standard error response
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} [statusCode=500]
 * @param {string} [code='INTERNAL_SERVER_ERROR']
 * @param {any} [details=null]
 */
export const sendError = (res, message, statusCode = HttpStatus.INTERNAL_SERVER_ERROR, code = 'INTERNAL_SERVER_ERROR', details = null) => {
  const errorObj = {
    code,
    message,
  };

  if (details !== null && details !== undefined) {
    errorObj.details = details;
  }

  return res.status(statusCode).json({
    success: false,
    error: errorObj,
  });
};
