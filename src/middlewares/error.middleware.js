import { env } from '../config/env.js';
import { ERROR_CODES } from '../config/constants.js';
import { isOperationalError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { sendError } from '../utils/response.js';

export function errorMiddleware(error, req, res, _next) {
  const statusCode = error.statusCode || 500;
  const normalizedError = {
    statusCode,
    code: error.code || ERROR_CODES.INTERNAL_ERROR,
    message: statusCode >= 500 && env.isProduction ? 'Internal server error.' : error.message,
    details: statusCode >= 500 && env.isProduction ? undefined : error.details
  };

  const logPayload = {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    statusCode,
    code: normalizedError.code,
    error: error.stack || error.message
  };

  if (statusCode >= 500 || !isOperationalError(error)) {
    logger.error(logPayload, 'Unhandled API error.');
  } else {
    logger.warn(logPayload, 'Handled API error.');
  }

  return sendError(res, normalizedError);
}
