import dotenv from 'dotenv';

dotenv.config();

export const PROVIDERS = Object.freeze({
  MOCK: 'mock',
  OFFICIAL: 'official',
  PUBLIC: 'public',
  AUTHORIZED: 'authorized'
});

const APP_VERSION = '4.0.0';
const providerValues = Object.values(PROVIDERS);

function stringValue(name, fallback = '') {
  const raw = process.env[name];
  if (raw === undefined || raw === null || raw === '') return fallback;
  return String(raw).trim();
}

function integerValue(name, fallback, { min, max } = {}) {
  const parsed = Number.parseInt(stringValue(name, String(fallback)), 10);
  let value = Number.isFinite(parsed) ? parsed : fallback;
  if (typeof min === 'number' && value < min) value = min;
  if (typeof max === 'number' && value > max) value = max;
  return value;
}

function booleanValue(name, fallback = false) {
  const raw = stringValue(name, String(fallback)).toLowerCase();
  return ['1', 'true', 'yes', 'y', 'on'].includes(raw);
}

function listValue(name, fallback = '') {
  return stringValue(name, fallback)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function providerValue() {
  const requested = stringValue('IG_PROVIDER', PROVIDERS.MOCK).toLowerCase();
  return providerValues.includes(requested) ? requested : PROVIDERS.MOCK;
}

export const env = Object.freeze({
  appName: stringValue('APP_NAME', 'TenRusl Instagram API Gateway'),
  appVersion: APP_VERSION,
  nodeEnv: stringValue('NODE_ENV', 'development'),
  isProduction: stringValue('NODE_ENV', 'development') === 'production',
  port: integerValue('PORT', 3000, { min: 1, max: 65535 }),
  host: stringValue('HOST', '0.0.0.0'),
  baseUrl: stringValue('APP_BASE_URL', 'http://localhost:3000'),
  logLevel: stringValue('LOG_LEVEL', 'info'),

  igProvider: providerValue(),
  corsOrigins: listValue('CORS_ORIGIN', '*'),
  bodyLimit: stringValue('BODY_LIMIT', '256kb'),
  apiKeyEnabled: booleanValue('API_KEY_ENABLED', false),
  apiKey: stringValue('API_KEY', ''),

  rateLimitWindowMs: integerValue('RATE_LIMIT_WINDOW_MS', 60_000, { min: 1_000, max: 3_600_000 }),
  rateLimitMax: integerValue('RATE_LIMIT_MAX', 120, { min: 1, max: 100_000 }),

  defaultLimit: integerValue('DEFAULT_LIMIT', 25, { min: 1, max: 100 }),
  maxLimit: integerValue('MAX_LIMIT', 100, { min: 1, max: 500 }),

  metaApiVersion: stringValue('META_API_VERSION', 'v23.0'),
  metaAccessToken: stringValue('META_ACCESS_TOKEN', ''),
  metaIgUserId: stringValue('META_IG_USER_ID', ''),
  metaAppId: stringValue('META_APP_ID', ''),

  publicDataEnabled: booleanValue('PUBLIC_DATA_ENABLED', false),
  publicDataUpstreamUrl: stringValue('PUBLIC_DATA_UPSTREAM_URL', ''),

  authorizedProviderEnabled: booleanValue('AUTHORIZED_PROVIDER_ENABLED', false),
  authorizedSessionToken: stringValue('AUTHORIZED_SESSION_TOKEN', ''),

  gracefulShutdownMs: integerValue('GRACEFUL_SHUTDOWN_MS', 10_000, { min: 1_000, max: 60_000 })
});

export function getEnvironmentWarnings() {
  const warnings = [];

  if (env.apiKeyEnabled && env.apiKey.length < 16) {
    warnings.push('API_KEY_ENABLED=true requires API_KEY with at least 16 characters.');
  }

  if (env.igProvider === PROVIDERS.OFFICIAL && (!env.metaAccessToken || !env.metaIgUserId)) {
    warnings.push('IG_PROVIDER=official is selected but META_ACCESS_TOKEN or META_IG_USER_ID is missing.');
  }

  if (env.igProvider === PROVIDERS.PUBLIC && !env.publicDataEnabled) {
    warnings.push('IG_PROVIDER=public is selected but PUBLIC_DATA_ENABLED=false. Public adapter will stay in safe placeholder mode.');
  }

  if (env.igProvider === PROVIDERS.AUTHORIZED && !env.authorizedProviderEnabled) {
    warnings.push('IG_PROVIDER=authorized is selected but AUTHORIZED_PROVIDER_ENABLED=false. Authorized adapter remains disabled by default.');
  }

  return warnings;
}
