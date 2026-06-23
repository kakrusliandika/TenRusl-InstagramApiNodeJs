import { createHash, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';
import { AppError, ERROR_CODES } from '../utils/errors.js';

function isPublicPath(path) {
  if (['/', '/favicon.svg', '/health', '/ready', '/live'].includes(path)) return true;
  if (path === '/metrics') return env.metricsPublic;
  if (path === '/capabilities') return env.capabilitiesPublic;
  return false;
}

function timingSafeStringEqual(provided, expected) {
  if (!provided || !expected) return false;
  const providedDigest = createHash('sha256').update(String(provided)).digest();
  const expectedDigest = createHash('sha256').update(String(expected)).digest();
  return timingSafeEqual(providedDigest, expectedDigest);
}

export function apiKeyMiddleware(req, _res, next) {
  if (isPublicPath(req.path)) return next();
  if (!env.apiKeyEnabled) return next();
  const provided = req.get('x-api-key') || req.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (timingSafeStringEqual(provided, env.apiKey)) return next();
  return next(new AppError('A valid API key is required.', {
    statusCode: 401,
    code: ERROR_CODES.UNAUTHORIZED
  }));
}
