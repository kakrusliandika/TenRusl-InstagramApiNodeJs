import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.IG_PROVIDER = 'mock';
process.env.API_KEY_ENABLED = 'true';
process.env.API_KEY = 'security_test_api_key_32_chars';
process.env.METRICS_PUBLIC = 'false';
process.env.CAPABILITIES_PUBLIC = 'false';
process.env.RATE_LIMIT_WINDOW_MS = '60000';
process.env.RATE_LIMIT_MAX = '2';
process.env.TRUST_PROXY = '1';

const { createApp } = await import('../app.js');
const {
  clearRateLimitBuckets,
  createRateLimitMiddleware,
  getRateLimitBucketCount,
} = await import('../middlewares/rate-limit.middleware.js');
const { startTestServer } = await import('./server-helper.js');

const apiKey = process.env.API_KEY;

async function withSecurityServer(testFn) {
  clearRateLimitBuckets();
  const app = createApp();
  const { server, baseUrl } = await startTestServer(app);

  try {
    await testFn({ baseUrl });
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    clearRateLimitBuckets();
  }
}

async function requestJson(baseUrl, path, { headers = {}, method = 'GET', body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    body,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
  });
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();
  return { response, body: payload };
}

function assertErrorEnvelope(body, code) {
  assert.equal(body.success, false);
  assert.equal(body.data, null);
  assert.ok(body.meta.requestId);
  assert.equal(body.error.code, code);
}

test('API key is required for protected API routes', async () => {
  await withSecurityServer(async ({ baseUrl }) => {
    const { response, body } = await requestJson(baseUrl, '/v1/get/profiles/tenrusl', {
      headers: { 'x-forwarded-for': '203.0.113.10' },
    });

    assert.equal(response.status, 401);
    assertErrorEnvelope(body, 'UNAUTHORIZED');
  });
});

test('valid API key allows protected API routes', async () => {
  await withSecurityServer(async ({ baseUrl }) => {
    const { response, body } = await requestJson(baseUrl, '/v1/get/profiles/tenrusl', {
      headers: { 'x-api-key': apiKey, 'x-forwarded-for': '203.0.113.11' },
    });

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.ok(body.data.profile);
  });
});

test('invalid API key is rejected for protected API routes', async () => {
  await withSecurityServer(async ({ baseUrl }) => {
    const { response, body } = await requestJson(baseUrl, '/v1/get/profiles/tenrusl', {
      headers: { 'x-api-key': 'wrong-api-key', 'x-forwarded-for': '203.0.113.12' },
    });

    assert.equal(response.status, 401);
    assertErrorEnvelope(body, 'UNAUTHORIZED');
  });
});

test('rate limit returns 429 with retry and quota headers', async () => {
  await withSecurityServer(async ({ baseUrl }) => {
    const headers = { 'x-forwarded-for': '203.0.113.13' };
    const first = await requestJson(baseUrl, '/health', { headers });
    const second = await requestJson(baseUrl, '/health', { headers });
    const third = await requestJson(baseUrl, '/health', { headers });

    assert.equal(first.response.status, 200);
    assert.equal(first.response.headers.get('x-ratelimit-limit'), '2');
    assert.equal(first.response.headers.get('x-ratelimit-remaining'), '1');
    assert.match(first.response.headers.get('x-ratelimit-reset') || '', /^\d+$/);

    assert.equal(second.response.status, 200);
    assert.equal(second.response.headers.get('x-ratelimit-remaining'), '0');

    assert.equal(third.response.status, 429);
    assert.equal(third.response.headers.get('x-ratelimit-limit'), '2');
    assert.equal(third.response.headers.get('x-ratelimit-remaining'), '0');
    assert.match(third.response.headers.get('x-ratelimit-reset') || '', /^\d+$/);
    assert.match(third.response.headers.get('retry-after') || '', /^\d+$/);
    assertErrorEnvelope(third.body, 'RATE_LIMITED');
  });
});

test('rate limit can be disabled only for local or test middleware instances', async () => {
  clearRateLimitBuckets();
  const headers = new Map();
  const disabledLimiter = createRateLimitMiddleware({
    isProduction: false,
    rateLimitEnabled: false,
    rateLimitMax: 1,
    rateLimitWindowMs: 60_000,
  });

  let allowed = 0;
  const req = { ip: '203.0.113.18', socket: {} };
  const res = { setHeader: (name, value) => headers.set(name.toLowerCase(), value) };
  const next = (error) => {
    assert.equal(error, undefined);
    allowed += 1;
  };

  disabledLimiter(req, res, next);
  disabledLimiter(req, res, next);

  assert.equal(allowed, 2);
  assert.equal(headers.size, 0);
  clearRateLimitBuckets();
});

test('rate limit remains enforced when disabled flag is set in production', async () => {
  clearRateLimitBuckets();
  const headers = new Map();
  const productionLimiter = createRateLimitMiddleware({
    isProduction: true,
    rateLimitEnabled: false,
    rateLimitMax: 1,
    rateLimitWindowMs: 60_000,
  });

  const req = { ip: '203.0.113.19', socket: {} };
  const res = { setHeader: (name, value) => headers.set(name.toLowerCase(), value) };

  let firstError;
  let secondError;
  productionLimiter(req, res, (error) => { firstError = error; });
  productionLimiter(req, res, (error) => { secondError = error; });

  assert.equal(firstError, undefined);
  assert.equal(secondError.statusCode, 429);
  assert.equal(secondError.code, 'RATE_LIMITED');
  assert.equal(headers.get('x-ratelimit-limit'), '1');
  assert.equal(headers.get('x-ratelimit-remaining'), '0');
  assert.match(headers.get('x-ratelimit-reset') || '', /^\d+$/);
  assert.match(headers.get('retry-after') || '', /^\d+$/);
  clearRateLimitBuckets();
});

test('rate limit automatically cleans up expired buckets', async () => {
  clearRateLimitBuckets();
  const limiter = createRateLimitMiddleware({
    isProduction: false,
    rateLimitEnabled: true,
    rateLimitMax: 10,
    rateLimitWindowMs: 20,
  });

  const req = { ip: '203.0.113.20', socket: {} };
  const res = { setHeader: () => {} };
  limiter(req, res, (error) => assert.equal(error, undefined));

  assert.equal(getRateLimitBucketCount(), 1);
  await new Promise((resolve) => setTimeout(resolve, 80));
  assert.equal(getRateLimitBucketCount(), 0);
  clearRateLimitBuckets();
});

test('metrics are protected when configured private', async () => {
  await withSecurityServer(async ({ baseUrl }) => {
    const denied = await requestJson(baseUrl, '/metrics', {
      headers: { 'x-forwarded-for': '203.0.113.14' },
    });
    const allowed = await fetch(`${baseUrl}/metrics`, {
      headers: { 'x-api-key': apiKey, 'x-forwarded-for': '203.0.113.15' },
    });

    assert.equal(denied.response.status, 401);
    assertErrorEnvelope(denied.body, 'UNAUTHORIZED');
    assert.equal(allowed.status, 200);
    assert.match(await allowed.text(), /tenrusl_up 1/);
  });
});

test('capabilities are protected when configured private', async () => {
  await withSecurityServer(async ({ baseUrl }) => {
    const denied = await requestJson(baseUrl, '/capabilities', {
      headers: { 'x-forwarded-for': '203.0.113.16' },
    });
    const allowed = await requestJson(baseUrl, '/capabilities', {
      headers: { 'x-api-key': apiKey, 'x-forwarded-for': '203.0.113.17' },
    });

    assert.equal(denied.response.status, 401);
    assertErrorEnvelope(denied.body, 'UNAUTHORIZED');
    assert.equal(allowed.response.status, 200);
    assert.equal(allowed.body.success, true);
    assert.equal(allowed.body.data.activeProvider, 'mock');
  });
});
