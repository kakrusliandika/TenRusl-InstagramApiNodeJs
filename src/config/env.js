import dotenv from 'dotenv';
import { APP_MODES } from './constants.js';

dotenv.config();

function readString(name, fallback = '') {
  const value = process.env[name];
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).trim();
}

function readInteger(name, fallback, { min, max } = {}) {
  const raw = readString(name, String(fallback));
  const value = Number.parseInt(raw, 10);
  if (Number.isNaN(value)) return fallback;
  if (typeof min === 'number' && value < min) return min;
  if (typeof max === 'number' && value > max) return max;
  return value;
}

function readBoolean(name, fallback = false) {
  const raw = readString(name, String(fallback)).toLowerCase();
  return ['true', '1', 'yes', 'y', 'on'].includes(raw);
}

function readCsv(name, fallback = '') {
  return readString(name, fallback)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function readMode() {
  const mode = readString('APP_MODE', APP_MODES.HYBRID).toLowerCase();
  if (Object.values(APP_MODES).includes(mode)) return mode;
  return APP_MODES.HYBRID;
}

export const env = Object.freeze({
  appMode: readMode(),
  nodeEnv: readString('NODE_ENV', 'development'),
  isProduction: readString('NODE_ENV', 'development') === 'production',
  port: readInteger('PORT', 3000, { min: 1, max: 65535 }),
  appName: readString('APP_NAME', 'TenRusl Instagram API'),
  appBaseUrl: readString('APP_BASE_URL', 'http://localhost:3000'),
  logLevel: readString('LOG_LEVEL', 'info'),

  corsOrigin: readCsv('CORS_ORIGIN', 'http://localhost:3000,http://127.0.0.1:3000'),

  apiKeyEnabled: readBoolean('API_KEY_ENABLED', false),
  apiKey: readString('API_KEY', ''),

  rateLimitWindowMs: readInteger('RATE_LIMIT_WINDOW_MS', 60_000, { min: 1_000 }),
  rateLimitMax: readInteger('RATE_LIMIT_MAX', 60, { min: 1 }),

  defaultFeedLimit: readInteger('DEFAULT_FEED_LIMIT', 12, { min: 1, max: 100 }),
  maxFeedLimit: readInteger('MAX_FEED_LIMIT', 35, { min: 1, max: 100 }),

  cacheEnabled: readBoolean('CACHE_ENABLED', true),
  cacheTtlSeconds: readInteger('CACHE_TTL_SECONDS', 900, { min: 1 }),
  cacheMaxItems: readInteger('CACHE_MAX_ITEMS', 500, { min: 10 }),

  scraperEnabled: readBoolean('SCRAPER_ENABLED', true),
  scrapeTimeoutMs: readInteger('SCRAPE_TIMEOUT_MS', 30_000, { min: 3_000 }),
  maxConcurrentScrapes: readInteger('MAX_CONCURRENT_SCRAPES', 2, { min: 1, max: 10 }),
  puppeteerHeadless: readString('PUPPETEER_HEADLESS', 'true'),
  puppeteerExecutablePath: readString('PUPPETEER_EXECUTABLE_PATH', ''),
  puppeteerUserAgent: readString('PUPPETEER_USER_AGENT', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari/537.36'),

  metaApiEnabled: readBoolean('META_API_ENABLED', false),
  metaApiVersion: readString('META_API_VERSION', 'v23.0'),
  metaAccessToken: readString('META_ACCESS_TOKEN', ''),
  metaIgUserId: readString('META_IG_USER_ID', ''),
  metaUsername: readString('META_USERNAME', ''),
  metaTimeoutMs: readInteger('META_TIMEOUT_MS', 15_000, { min: 3_000 }),

  scraperApiUrl: readString('SCRAPER_API_URL', ''),
  scraperApiKey: readString('SCRAPER_API_KEY', '')
});
