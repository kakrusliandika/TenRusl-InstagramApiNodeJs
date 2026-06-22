import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import {
  clearInstagramProviderCache,
  createInstagramProvider,
  getInstagramProvider,
} from '../providers/instagram/index.js';
import { AuthorizedInstagramProvider } from '../providers/instagram/authorized.provider.js';
import { OfficialInstagramProvider } from '../providers/instagram/official.provider.js';
import { PublicInstagramProvider } from '../providers/instagram/public.provider.js';

test('provider factory creates all supported providers', () => {
  for (const name of ['mock', 'official', 'public', 'authorized']) {
    const provider = createInstagramProvider(name);
    assert.equal(provider.name, name);
    assert.equal(typeof provider.status, 'function');
    assert.equal(typeof provider.status().capabilities, 'object');
  }
});

test('provider factory rejects unsupported provider names', () => {
  assert.throws(() => createInstagramProvider('scraper'), /Instagram provider is invalid/);
});

test('getInstagramProvider caches the selected IG_PROVIDER instance', () => {
  clearInstagramProviderCache();
  const first = getInstagramProvider();
  const second = getInstagramProvider();
  assert.equal(first.name, 'mock');
  assert.strictEqual(first, second);
  clearInstagramProviderCache();
});

test('mock provider returns safe dry-run action result', async () => {
  const provider = createInstagramProvider('mock');
  const result = await provider.performAction('follow', 'tenrusl', { dryRun: false });
  assert.equal(result.provider.provider, 'mock');
  assert.equal(result.dryRun, true);
  assert.equal(result.result.status, 'dry-run');
});

test('non-mock providers fail clearly when required env is missing', async () => {
  await assert.rejects(() => new OfficialInstagramProvider({ config: {} }).getInsights(), {
    code: 'PROVIDER_NOT_CONFIGURED',
  });
  await assert.rejects(() => new PublicInstagramProvider({ config: {} }).getProfile('tenrusl'), {
    code: 'PROVIDER_NOT_CONFIGURED',
  });
  await assert.rejects(() => new AuthorizedInstagramProvider({ config: {} }).getProfile('tenrusl'), {
    code: 'PROVIDER_NOT_CONFIGURED',
  });
});

test('official provider uses configured Meta Graph boundary without hardcoded token', async () => {
  const calls = [];
  const server = createServer((req, res) => {
    calls.push(new URL(req.url, 'http://127.0.0.1'));
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ id: 'ig_123', username: 'tenrusl' }));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    const provider = new OfficialInstagramProvider({
      config: {
        metaGraphBaseUrl: `http://127.0.0.1:${port}`,
        metaApiVersion: 'v99.0',
        metaAccessToken: 'test-token-from-env',
        metaIgUserId: 'ig_123',
        providerRequestTimeoutMs: 1000,
      },
    });
    const result = await provider.getAccount('ig_123');

    assert.equal(result.account.id, 'ig_123');
    assert.equal(calls[0].pathname, '/v99.0/ig_123');
    assert.equal(calls[0].searchParams.get('access_token'), 'test-token-from-env');
    assert.equal(calls[0].searchParams.get('fields'), 'id,username,name,account_type,media_count');
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});
