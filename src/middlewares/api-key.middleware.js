import { env } from '../config/env.js';
import { ERROR_CODES } from '../config/constants.js';
import { AppError } from '../utils/errors.js';
import { sha256 } from '../utils/hash.js';

function safeEqual(left, right) {
  if (!left || !right) return false;
  return sha256(left) === sha256(right);
}

export function apiKeyMiddleware(req, _res, next) {
  if (!env.apiKeyEnabled) {
    next();
    return;
  }

  const provided = req.get('x-api-key') || '';

  if (!safeEqual(provided, env.apiKey)) {
    next(new AppError('API key tidak valid atau belum dikirim.', {
      statusCode: 401,
      code: ERROR_CODES.UNAUTHORIZED
    }));
    return;
  }

  next();
}
