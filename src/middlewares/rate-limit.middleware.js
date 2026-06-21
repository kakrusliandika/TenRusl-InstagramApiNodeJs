import { env } from '../config/env.js';
import { AppError, ERROR_CODES } from '../utils/errors.js';

const buckets = new Map();

export function rateLimitMiddleware(req, _res, next) {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const existing = buckets.get(key);

  if (!existing || now > existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + env.rateLimitWindowMs });
    return next();
  }

  existing.count += 1;
  if (existing.count > env.rateLimitMax) {
    return next(new AppError('Rate limit exceeded.', {
      statusCode: 429,
      code: ERROR_CODES.RATE_LIMITED,
      details: { retryAfterMs: Math.max(existing.resetAt - now, 0) }
    }));
  }

  return next();
}
