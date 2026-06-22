export const ERROR_CODES = Object.freeze({
  BAD_REQUEST: 'BAD_REQUEST',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  USERNAME_INVALID: 'USERNAME_INVALID',
  INSTAGRAM_LINK_INVALID: 'INSTAGRAM_LINK_INVALID',
  PROVIDER_NOT_CONFIGURED: 'PROVIDER_NOT_CONFIGURED',
  PROVIDER_OPERATION_DISABLED: 'PROVIDER_OPERATION_DISABLED',
  PROVIDER_UPSTREAM_ERROR: 'PROVIDER_UPSTREAM_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
});

export class AppError extends Error {
  constructor(message, { statusCode = 500, code = ERROR_CODES.INTERNAL_ERROR, details = {} } = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}

export function isOperationalError(error) {
  return Boolean(error?.isOperational);
}
