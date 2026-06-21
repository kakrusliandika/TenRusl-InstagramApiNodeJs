import { ERROR_CODES } from '../config/constants.js';
import { AppError } from '../utils/errors.js';

export function notFoundMiddleware(req, _res, next) {
  next(new AppError(`Route tidak ditemukan: ${req.method} ${req.originalUrl}`, {
    statusCode: 404,
    code: ERROR_CODES.NOT_FOUND
  }));
}
