import { z } from 'zod';
import { env } from '../config/env.js';
import { ERROR_CODES, INSTAGRAM_USERNAME_REGEX, REQUEST_SOURCES } from '../config/constants.js';
import { AppError } from '../utils/errors.js';

const booleanFromQuery = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((value) => {
    if (value === undefined) return false;
    if (typeof value === 'boolean') return value;
    return ['true', '1', 'yes', 'y', 'on'].includes(value.toLowerCase());
  });

const instagramQuerySchema = z.object({
  username: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(env.maxFeedLimit).default(env.defaultFeedLimit),
  source: z.enum([REQUEST_SOURCES.AUTO, REQUEST_SOURCES.OFFICIAL, REQUEST_SOURCES.SCRAPER]).default(REQUEST_SOURCES.AUTO),
  refresh: booleanFromQuery
});

export function validateInstagramRequest(params = {}, query = {}) {
  const username = params.username || query.username;

  if (!username || typeof username !== 'string') {
    throw new AppError('Username Instagram wajib diisi.', {
      statusCode: 400,
      code: ERROR_CODES.USERNAME_INVALID
    });
  }

  const normalizedUsername = username.trim().replace(/^@/, '');

  if (!INSTAGRAM_USERNAME_REGEX.test(normalizedUsername)) {
    throw new AppError('Username Instagram tidak valid. Gunakan huruf, angka, titik, atau underscore maksimal 30 karakter.', {
      statusCode: 400,
      code: ERROR_CODES.USERNAME_INVALID
    });
  }

  const parsed = instagramQuerySchema.safeParse({ ...query, username: normalizedUsername });

  if (!parsed.success) {
    throw new AppError('Parameter request tidak valid.', {
      statusCode: 400,
      code: ERROR_CODES.BAD_REQUEST,
      details: parsed.error.flatten()
    });
  }

  return {
    username: normalizedUsername,
    limit: parsed.data.limit,
    source: parsed.data.source,
    refresh: parsed.data.refresh
  };
}
