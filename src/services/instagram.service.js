import { APP_MODES, ERROR_CODES, REQUEST_SOURCES } from '../config/constants.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { buildInstagramCacheKey, getCache, setCache } from './cache.service.js';
import { fetchOfficialInstagramFeed } from './meta.service.js';
import { fetchPublicInstagramFeed } from './scraper.service.js';

function resolveExecutionMode(requestedSource) {
  if (requestedSource === REQUEST_SOURCES.OFFICIAL) return APP_MODES.OFFICIAL;
  if (requestedSource === REQUEST_SOURCES.SCRAPER) return APP_MODES.SCRAPER;
  return env.appMode;
}

async function fetchByMode(mode, input) {
  if (mode === APP_MODES.OFFICIAL) {
    return {
      source: 'official',
      data: await fetchOfficialInstagramFeed(input)
    };
  }

  if (mode === APP_MODES.SCRAPER) {
    return {
      source: 'scraper',
      data: await fetchPublicInstagramFeed(input)
    };
  }

  if (mode === APP_MODES.HYBRID) {
    try {
      return {
        source: 'official',
        data: await fetchOfficialInstagramFeed(input)
      };
    } catch (officialError) {
      logger.warn({ error: officialError.code || officialError.message }, 'Official mode failed; trying scraper fallback.');
      return {
        source: 'scraper',
        fallbackFrom: 'official',
        data: await fetchPublicInstagramFeed(input)
      };
    }
  }

  throw new AppError('Mode aplikasi tidak valid.', {
    statusCode: 500,
    code: ERROR_CODES.MODE_INVALID
  });
}

export async function getInstagramFeed(input) {
  const mode = resolveExecutionMode(input.source);
  const cacheKey = buildInstagramCacheKey({ source: mode, username: input.username, limit: input.limit });

  if (!input.refresh) {
    const cached = getCache(cacheKey);
    if (cached) {
      return {
        ...cached,
        cached: true
      };
    }
  }

  const result = await fetchByMode(mode, input);
  const payload = {
    mode,
    source: result.source,
    fallbackFrom: result.fallbackFrom,
    username: input.username,
    count: result.data.length,
    cached: false,
    data: result.data,
    generatedAt: new Date().toISOString()
  };

  setCache(cacheKey, payload);
  return payload;
}
