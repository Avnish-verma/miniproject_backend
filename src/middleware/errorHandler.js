const HTTP_STATUS = require('../constants/httpStatusCodes');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'An unexpected error occurred.';
  let details = err.details || null;

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    code = 'INVALID_ID_FORMAT';
    message = `Invalid format for resource identifier: ${err.value}`;
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = HTTP_STATUS.CONFLICT;
    code = 'DUPLICATE_KEY_ERROR';
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `The ${field} "${err.keyValue ? err.keyValue[field] : ''}" is already registered.`;
  }

  // Handle Mongoose Schema ValidationError
  if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed on input data.';
    details = Object.values(err.errors).map((e) => e.message);
  }

  // Handle JWT specific errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    code = 'TOKEN_EXPIRED';
    message = 'Your session has expired. Please log in again.';
  }

  // Log error (with stack trace in development)
  if (statusCode >= 500) {
    logger.error(`[${req.method} ${req.originalUrl}] - ${message}`, {
      stack: err.stack,
    });
  } else {
    logger.warn(`[${req.method} ${req.originalUrl}] [${statusCode}] - ${message}${details ? ' : ' + JSON.stringify(details) : ''}`);
  }

  // Sanitize response: never leak internal stack traces to client
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
      ...(process.env.NODE_ENV === 'development' && statusCode >= 500 ? { stack: err.stack } : {}),
    },
  });
};

module.exports = errorHandler;
