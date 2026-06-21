import { env } from '../src/config/env.js';

const checks = [
  ['Node.js >= 20.18.0', Number(process.versions.node.split('.')[0]) >= 20],
  ['APP_MODE valid', ['official', 'scraper', 'hybrid'].includes(env.appMode)],
  ['API key configured when enabled', !env.apiKeyEnabled || env.apiKey.length >= 16],
  ['Meta config ready when official enabled', !env.metaApiEnabled || Boolean(env.metaAccessToken && env.metaIgUserId)],
  ['Scraper enabled config', typeof env.scraperEnabled === 'boolean']
];

let failed = false;
for (const [name, ok] of checks) {
  console.log(`${ok ? '✅' : '❌'} ${name}`);
  if (!ok) failed = true;
}

if (failed) process.exit(1);
console.log('🚀 Doctor check passed.');
