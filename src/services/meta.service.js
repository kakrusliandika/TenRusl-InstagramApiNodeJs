import { env } from '../config/env.js';
import { ERROR_CODES } from '../config/constants.js';
import { AppError } from '../utils/errors.js';

function assertMetaConfig(username) {
  if (!env.metaApiEnabled) {
    throw new AppError('Meta Instagram API mode sedang dinonaktifkan.', {
      statusCode: 503,
      code: ERROR_CODES.OFFICIAL_DISABLED
    });
  }

  if (!env.metaAccessToken || !env.metaIgUserId) {
    throw new AppError('Konfigurasi Meta API belum lengkap. Isi META_ACCESS_TOKEN dan META_IG_USER_ID.', {
      statusCode: 500,
      code: ERROR_CODES.META_CONFIG_MISSING
    });
  }

  if (env.metaUsername && username.toLowerCase() !== env.metaUsername.toLowerCase()) {
    throw new AppError('Username tidak sesuai dengan akun Instagram resmi yang dikonfigurasi.', {
      statusCode: 404,
      code: ERROR_CODES.META_USERNAME_MISMATCH
    });
  }
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new AppError('Meta API mengembalikan error.', {
        statusCode: response.status >= 500 ? 502 : response.status,
        code: ERROR_CODES.META_API_ERROR,
        details: body?.error || body
      });
    }

    return body;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Gagal menghubungi Meta Instagram API.', {
      statusCode: 502,
      code: ERROR_CODES.META_API_ERROR,
      details: env.isProduction ? undefined : error.message
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchOfficialInstagramFeed({ username, limit }) {
  assertMetaConfig(username);

  const fields = [
    'id',
    'caption',
    'media_type',
    'media_url',
    'permalink',
    'timestamp',
    'thumbnail_url'
  ].join(',');

  const url = new URL(`https://graph.facebook.com/${env.metaApiVersion}/${env.metaIgUserId}/media`);
  url.searchParams.set('fields', fields);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('access_token', env.metaAccessToken);

  const response = await fetchWithTimeout(url, env.metaTimeoutMs);
  const fetchedAt = new Date().toISOString();

  return (response.data || []).map((item) => ({
    id: item.id,
    imageUrl: item.media_url || item.thumbnail_url || '',
    caption: item.caption || '',
    postUrl: item.permalink || '',
    mediaType: item.media_type || 'UNKNOWN',
    timestamp: item.timestamp || null,
    source: 'official',
    fetchedAt
  }));
}
