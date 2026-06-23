import { env } from '../config/env.js';
import { AppError, ERROR_CODES } from '../utils/errors.js';

const buckets = new Map();
let cleanupTimer = null;

function normalizedOptions(options = env) {
  const isProduction = options.isProduction === true;
  return {
    enabled: options.rateLimitEnabled !== false || isProduction,
    max: Number.isFinite(options.rateLimitMax) ? options.rateLimitMax : env.rateLimitMax,
    windowMs: Number.isFinite(options.rateLimitWindowMs) ? options.rateLimitWindowMs : env.rateLimitWindowMs
  };
}

function cleanupExpiredBuckets(now = Date.now()) {
  for (const [key, bucket] of buckets.entries()) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}

function ensureCleanupTimer(options) {
  if (cleanupTimer || !options.enabled) return;

  // Jaga pembatas di memori tetap terbatas untuk penerapan satu instance.
  cleanupTimer = setInterval(() => cleanupExpiredBuckets(), Math.min(options.windowMs, 60_000));
  cleanupTimer.unref?.();
}

function setRateLimitHeaders(res, bucket, now, options) {
  const resetSeconds = Math.ceil(bucket.resetAt / 1000);
  const remaining = Math.max(options.max - bucket.count, 0);
  res.setHeader('X-RateLimit-Limit', String(options.max));
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  res.setHeader('X-RateLimit-Reset', String(resetSeconds));
  return Math.max(Math.ceil((bucket.resetAt - now) / 1000), 1);
}

export function createRateLimitMiddleware(options = env) {
  const limiterOptions = normalizedOptions(options);

  return function rateLimitHandler(req, res, next) {
    if (!limiterOptions.enabled) return next();

    ensureCleanupTimer(limiterOptions);
    const now = Date.now();
    cleanupExpiredBuckets(now);

    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const existing = buckets.get(key);

    if (!existing || now >= existing.resetAt) {
      const bucket = { count: 1, resetAt: now + limiterOptions.windowMs };
      buckets.set(key, bucket);
      setRateLimitHeaders(res, bucket, now, limiterOptions);
      return next();
    }

    existing.count += 1;
    const retryAfterSeconds = setRateLimitHeaders(res, existing, now, limiterOptions);

    if (existing.count > limiterOptions.max) {
      res.setHeader('Retry-After', String(retryAfterSeconds));
      return next(new AppError('Rate limit exceeded.', {
        statusCode: 429,
        code: ERROR_CODES.RATE_LIMITED,
        details: { retryAfterMs: Math.max(existing.resetAt - now, 0), retryAfterSeconds }
      }));
    }

    return next();
  };
}

export const rateLimitMiddleware = createRateLimitMiddleware();

export function clearRateLimitBuckets() {
  buckets.clear();
  if (cleanupTimer) clearInterval(cleanupTimer);
  cleanupTimer = null;
}

export function getRateLimitBucketCount() {
  return buckets.size;
}
