import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

export const publicApiLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  limit: env.rateLimitMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Terlalu banyak request. Coba lagi nanti.'
    }
  }
});
