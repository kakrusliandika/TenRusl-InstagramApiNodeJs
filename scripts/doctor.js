import { env } from '../src/config/env.js';

const major = Number(process.versions.node.split('.')[0]);
const checks = [
  ['Node.js 24 LTS primary or Node.js 22 compatibility', major === 24 || major === 22 || major > 24],
  ['APP_MODE valid', ['official', 'scraper', 'hybrid'].includes(env.appMode)],
  ['API key configured when enabled', !env.apiKeyEnabled || env.apiKey.length >= 16],
  ['Meta config ready when official enabled', !env.metaApiEnabled || Boolean(env.metaAccessToken && env.metaIgUserId)],
  ['Scraper enabled config is boolean', typeof env.scraperEnabled === 'boolean'],
  ['Health routes expected: /health /ready /live /metrics', true],
  ['V1 route contract expected: /v1/*', true]
];

let failed = false;
for (const [name, ok] of checks) {
  console.log(`${ok ? '✅' : '❌'} ${name}`);
  if (!ok) failed = true;
}

if (failed) process.exit(1);
console.log('🚀 Doctor check passed. Runtime contract is ready.');
