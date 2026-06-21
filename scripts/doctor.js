import { existsSync, readdirSync } from 'node:fs';
import { env, getEnvironmentWarnings, PROVIDERS } from '../src/config/env.js';
import { createInstagramProvider } from '../src/providers/instagram/index.js';

const major = Number.parseInt(process.versions.node.split('.')[0], 10);
const provider = createInstagramProvider(env.igProvider);
const requiredPaths = [
  'src/app.js',
  'src/server.js',
  'src/routes/v1.routes.js',
  'src/providers/instagram/provider.factory.js',
  'docs/API.md',
  'docs/DEPLOYMENT.md',
  'README.md',
  '.env.example',
  'Dockerfile',
  'docker-compose.yml'
];

const checks = [
  ['Node.js version is 22 compatible or 24 primary', major === 22 || major === 24],
  ['IG_PROVIDER is valid', Object.values(PROVIDERS).includes(env.igProvider)],
  ['Selected provider can be created', Boolean(provider?.status?.())],
  ['API key is strong when enabled', !env.apiKeyEnabled || env.apiKey.length >= 16],
  ['Required project files exist', requiredPaths.every((file) => existsSync(file))],
  ['Deployment folders exist', ['docker','cloudflare','github','google-cloud','aws','heroku','render','railway','vercel','netlify','vps','kubernetes','hybrid-multicloud'].every((dir) => existsSync(`deploy/${dir}`))],
  ['Test files exist', readdirSync('src/tests').some((file) => file.endsWith('.test.js'))]
];

let failed = false;
for (const [name, ok] of checks) {
  console.log(`${ok ? '✅' : '❌'} ${name}`);
  if (!ok) failed = true;
}

for (const warning of getEnvironmentWarnings()) {
  console.log(`⚠️  ${warning}`);
}

if (failed) process.exit(1);
console.log('🚀 Doctor check passed. Project is ready for local validation and safe production deployment defaults.');
