import { env } from '../config/env.js';
import { AppError, ERROR_CODES } from '../utils/errors.js';

export function apiKeyMiddleware(req, _res, next) {
  if (['/health', '/ready', '/live', '/metrics'].includes(req.path)) return next();
  if (!env.apiKeyEnabled) return next();
  const provided = req.get('x-api-key') || req.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (provided && provided === env.apiKey) return next();
  return next(new AppError('A valid API key is required.', {
    statusCode: 401,
    code: ERROR_CODES.UNAUTHORIZED
  }));
}
