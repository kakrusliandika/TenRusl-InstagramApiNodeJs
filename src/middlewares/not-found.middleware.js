import { AppError, ERROR_CODES } from '../utils/errors.js';

export function notFoundMiddleware(req, _res, next) {
    next(
        new AppError(`Route not found: ${req.method} ${req.originalUrl}`, {
            statusCode: 404,
            code: ERROR_CODES.NOT_FOUND,
            details: { method: req.method, path: req.originalUrl },
        })
    );
}
