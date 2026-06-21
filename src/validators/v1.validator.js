import { z } from 'zod';
import { env } from '../config/env.js';
import { ERROR_CODES, INSTAGRAM_USERNAME_REGEX, REQUEST_SOURCES } from '../config/constants.js';
import { AppError } from '../utils/errors.js';

const sourceSchema = z.enum([REQUEST_SOURCES.AUTO, REQUEST_SOURCES.OFFICIAL, REQUEST_SOURCES.SCRAPER]).default(REQUEST_SOURCES.AUTO);
const idRegex = /^[A-Za-z0-9._:-]{1,128}$/;

const booleanFromQuery = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((value) => {
    if (value === undefined) return false;
    if (typeof value === 'boolean') return value;
    return ['true', '1', 'yes', 'y', 'on'].includes(value.toLowerCase());
  });

const collectionQuerySchema = z.object({
  username: z.string().optional(),
  q: z.string().max(120).optional(),
  tag: z.string().max(80).optional(),
  postId: z.string().max(128).optional(),
  conversationId: z.string().max(128).optional(),
  limit: z.coerce.number().int().min(1).max(env.maxFeedLimit).default(env.defaultFeedLimit),
  cursor: z.string().max(256).optional(),
  source: sourceSchema,
  refresh: booleanFromQuery,
  link: z.string().max(500).optional(),
  url: z.string().max(500).optional()
});

const actionBodySchema = z.object({
  username: z.string().optional(),
  targetUsername: z.string().optional(),
  mediaUrl: z.string().url().optional(),
  caption: z.string().max(2200).optional(),
  text: z.string().max(2000).optional(),
  message: z.string().max(2000).optional(),
  recipientUsername: z.string().optional(),
  conversationId: z.string().max(128).optional(),
  metadata: z.record(z.any()).optional(),
  dryRun: z.boolean().optional()
}).passthrough();

function fail(message, code = ERROR_CODES.BAD_REQUEST, details) {
  throw new AppError(message, { statusCode: 400, code, details });
}

export function normalizeUsername(username) {
  if (!username || typeof username !== 'string') {
    fail('Username Instagram wajib diisi.', ERROR_CODES.USERNAME_INVALID);
  }

  const normalized = username.trim().replace(/^@/, '');
  if (!INSTAGRAM_USERNAME_REGEX.test(normalized)) {
    fail('Username Instagram tidak valid. Gunakan huruf, angka, titik, atau underscore maksimal 30 karakter.', ERROR_CODES.USERNAME_INVALID);
  }

  return normalized;
}

export function validateUsernameParam(params = {}) {
  return normalizeUsername(params.username);
}

export function validateIdParam(params = {}, key = 'id') {
  const value = params[key];
  if (!value || typeof value !== 'string' || !idRegex.test(value.trim())) {
    fail(`${key} tidak valid. Gunakan karakter aman maksimal 128 karakter.`, ERROR_CODES.BAD_REQUEST);
  }
  return value.trim();
}

export function validateCollectionQuery(query = {}) {
  const parsed = collectionQuerySchema.safeParse(query);
  if (!parsed.success) {
    fail('Parameter query tidak valid.', ERROR_CODES.BAD_REQUEST, parsed.error.flatten());
  }

  const data = parsed.data;
  return {
    ...data,
    username: data.username ? normalizeUsername(data.username) : undefined,
    link: data.link || data.url || undefined
  };
}

export function validateActionBody(body = {}) {
  const parsed = actionBodySchema.safeParse(body || {});
  if (!parsed.success) {
    fail('Body request tidak valid.', ERROR_CODES.BAD_REQUEST, parsed.error.flatten());
  }

  const data = parsed.data;
  return {
    ...data,
    username: data.username ? normalizeUsername(data.username) : undefined,
    targetUsername: data.targetUsername ? normalizeUsername(data.targetUsername) : undefined,
    recipientUsername: data.recipientUsername ? normalizeUsername(data.recipientUsername) : undefined
  };
}

export function validatePostLink(value) {
  if (!value || typeof value !== 'string') {
    fail('Link post Instagram wajib diisi melalui query `link` atau `url`.', ERROR_CODES.BAD_REQUEST);
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    fail('Link post Instagram tidak valid.', ERROR_CODES.BAD_REQUEST);
  }

  const host = parsed.hostname.replace(/^www\./, '');
  const validHost = host === 'instagram.com' || host.endsWith('.instagram.com');
  const validPath = /^\/(p|reel|tv)\/[^/]+\/?/.test(parsed.pathname);

  if (!validHost || !validPath) {
    fail('Link harus berupa URL Instagram post, reel, atau TV yang valid.', ERROR_CODES.BAD_REQUEST);
  }

  return parsed.toString();
}
