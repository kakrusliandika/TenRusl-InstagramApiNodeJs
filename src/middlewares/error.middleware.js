import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError, ERROR_CODES, isOperationalError } from '../utils/errors.js';
import { sendError } from '../utils/response.js';
import { redactSensitive } from '../utils/sanitize.js';

export function errorMiddleware(error, req, res, _next) {
  const statusCode = Number(error.statusCode) || 500;
  const normalized = new AppError(
    statusCode >= 500 && env.isProduction ? 'Internal server error.' : (error.message || 'Unexpected error.'),
    {
      statusCode,
      code: error.code || ERROR_CODES.INTERNAL_ERROR,
      details: statusCode >= 500 && env.isProduction ? {} : redactSensitive(error.details || {})
    }
  );

  const logPayload = {
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    code: normalized.code,
    stack: error.stack
  };

  if (statusCode >= 500 || !isOperationalError(error)) logger.error('Unhandled request error.', logPayload);
  else logger.warn('Handled request error.', logPayload);

  return sendError(res, normalized, { requestId: req.id });
}
