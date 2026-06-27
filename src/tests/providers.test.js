import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import {
  clearInstagramProviderCache,
  createInstagramProvider,
  getInstagramProvider,
  INSTAGRAM_PROVIDER_METHODS,
} from '../providers/instagram/index.js';
import { AuthorizedInstagramProvider } from '../providers/instagram/authorized.provider.js';
import { OfficialInstagramProvider } from '../providers/instagram/official.provider.js';
import { PublicInstagramProvider } from '../providers/instagram/public.provider.js';
import { startTestServer } from './server-helper.js';

test('provider factory creates all supported providers', () => {
  for (const name of ['mock', 'official', 'public', 'authorized']) {
    const provider = createInstagramProvider(name);
    assert.equal(provider.name, name);
    assert.equal(typeof provider.status, 'function');
    assert.equal(typeof provider.status().capabilities, 'object');
  }
});

test('all instagram providers expose the gateway controller contract', () => {
  for (const name of ['mock', 'official', 'public', 'authorized']) {
    const provider = createInstagramProvider(name);
    for (const method of ['status', ...INSTAGRAM_PROVIDER_METHODS]) {
      assert.equal(typeof provider[method], 'function', `${name}.${method}`);
    }
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

test("mock provider keeps every write dry-run even when dryRun=false is requested", async () => {
    const provider = createInstagramProvider("mock");

    const action = await provider.performAction("follow", "tenrusl", { dryRun: false });
    assert.equal(action.dryRun, true);
    assert.equal(action.requestedDryRun, false);
    assert.equal(action.result.status, "dry-run");
    assert.match(action.result.message, /No Instagram state was changed/);

    const publish = await provider.publish("media", {
        mediaUrl: "https://example.com/image.jpg",
        mediaType: "IMAGE",
        caption: "No real write",
        dryRun: false,
    });
    assert.equal(publish.dryRun, true);
    assert.equal(publish.requestedDryRun, false);
    assert.equal(publish.draft.status, "dry-run");

    const reply = await provider.replyComment({ id: "comment_123" }, { text: "No real reply", dryRun: false });
    assert.equal(reply.dryRun, true);
    assert.equal(reply.result.status, "dry-run");

    const message = await provider.sendMessage("thread_123", {
        username: "tenrusl",
        text: "No real message",
        dryRun: false,
    });
    assert.equal(message.dryRun, true);
    assert.equal(message.result.status, "dry-run");
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

test('provider readiness boundaries are conservative', () => {
  const official = new OfficialInstagramProvider({
    config: {
      metaGraphBaseUrl: 'https://graph.facebook.com',
      metaApiVersion: 'v99.0',
      metaAccessToken: 'token',
      metaIgUserId: 'ig_123',
      providerRequestTimeoutMs: 1000,
    },
  });
  const publicProvider = new PublicInstagramProvider({
    config: {
      publicDataEnabled: true,
      publicDataUpstreamUrl: 'https://public-upstream.example',
      providerRequestTimeoutMs: 1000,
    },
  });
  const authorizedWithoutImplementation = new AuthorizedInstagramProvider({
    config: {
      authorizedProviderEnabled: true,
      authorizedSessionToken: 'session-token',
      authorizedIntegrationReviewed: true,
    },
  });
  const authorizedWithImplementation = new AuthorizedInstagramProvider({
    config: {
      authorizedProviderEnabled: true,
      authorizedSessionToken: 'session-token',
      authorizedIntegrationReviewed: true,
    },
    integrationImplemented: true,
  });

  assert.equal(official.status().ready, true);
  assert.equal(publicProvider.status().ready, true);
  assert.equal(authorizedWithoutImplementation.status().ready, false);
  assert.equal(authorizedWithoutImplementation.status().integrationReviewed, true);
  assert.equal(authorizedWithoutImplementation.status().integrationImplemented, false);
  assert.equal(authorizedWithImplementation.status().ready, true);
});

test('provider capabilities describe safe boundaries', () => {
  const mock = createInstagramProvider('mock').status().capabilities;
  const official = createInstagramProvider('official').status().capabilities;
  const publicProvider = createInstagramProvider('public').status().capabilities;
  const authorized = createInstagramProvider('authorized').status().capabilities;

  assert.equal(mock.dryRunWrites, true);
  assert.equal(official.officialApiOnly, true);
  assert.equal(official.writeActions, false);
  assert.equal(publicProvider.requiresCompliantUpstream, true);
  assert.equal(publicProvider.writeActions, false);
  assert.equal(authorized.requiresReviewedIntegration, true);
  assert.equal(authorized.readProfile, false);
});

test('official provider validates Meta configuration shape', () => {
  const invalidVersion = new OfficialInstagramProvider({
    config: {
      metaGraphBaseUrl: 'https://graph.facebook.com',
      metaApiVersion: '23.0',
      metaAccessToken: 'token',
      metaIgUserId: 'ig_123',
    },
  });
  const invalidUser = new OfficialInstagramProvider({
    config: {
      metaGraphBaseUrl: 'https://graph.facebook.com',
      metaApiVersion: 'v23.0',
      metaAccessToken: 'token',
      metaIgUserId: '',
    },
  });
  const invalidUrl = new OfficialInstagramProvider({
    config: {
      metaGraphBaseUrl: 'file:///tmp/graph',
      metaApiVersion: 'v23.0',
      metaAccessToken: 'token',
      metaIgUserId: 'ig_123',
    },
  });

  assert.equal(invalidVersion.status().ready, false);
  assert.equal(invalidVersion.status().metaApiVersionValid, false);
  assert.equal(invalidUser.status().ready, false);
  assert.equal(invalidUser.status().metaIgUserIdConfigured, false);
  assert.equal(invalidUrl.status().ready, false);
  assert.equal(invalidUrl.status().graphBaseUrlConfigured, false);
});

test('official provider uses Authorization Bearer for Meta Graph boundary', async () => {
  const calls = [];
  const server = createServer((req, res) => {
    calls.push({
      url: new URL(req.url, 'http://127.0.0.1'),
      authorization: req.headers.authorization,
    });
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ id: 'ig_123', username: 'tenrusl' }));
  });
  const started = await startTestServer(server);
  const { port } = started.server.address();

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
    assert.equal(calls[0].url.pathname, '/v99.0/ig_123');
    assert.equal(calls[0].url.searchParams.get('access_token'), null);
    assert.equal(calls[0].url.searchParams.get('fields'), 'id,username,name,account_type,media_count');
    assert.equal(calls[0].authorization, 'Bearer test-token-from-env');
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

test('official provider handles non-json and upstream error responses', async () => {
  const nonJsonServer = createServer((_req, res) => {
    res.setHeader('content-type', 'text/plain');
    res.end('not json');
  });
  await startTestServer(nonJsonServer);
  const nonJsonPort = nonJsonServer.address().port;

  try {
    const provider = new OfficialInstagramProvider({
      config: {
        metaGraphBaseUrl: `http://127.0.0.1:${nonJsonPort}`,
        metaApiVersion: 'v99.0',
        metaAccessToken: 'token',
        metaIgUserId: 'ig_123',
        providerRequestTimeoutMs: 1000,
      },
    });
    await assert.rejects(() => provider.getAccount('ig_123'), {
      code: 'PROVIDER_UPSTREAM_ERROR',
      statusCode: 502,
    });
  } finally {
    await new Promise((resolve, reject) => nonJsonServer.close((error) => (error ? reject(error) : resolve())));
  }

  const errorServer = createServer((_req, res) => {
    res.statusCode = 400;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: { message: 'bad request' } }));
  });
  await startTestServer(errorServer);
  const errorPort = errorServer.address().port;

  try {
    const provider = new OfficialInstagramProvider({
      config: {
        metaGraphBaseUrl: `http://127.0.0.1:${errorPort}`,
        metaApiVersion: 'v99.0',
        metaAccessToken: 'token',
        metaIgUserId: 'ig_123',
        providerRequestTimeoutMs: 1000,
      },
    });
    await assert.rejects(() => provider.getAccount('ig_123'), {
      code: 'PROVIDER_UPSTREAM_ERROR',
      statusCode: 502,
    });
  } finally {
    await new Promise((resolve, reject) => errorServer.close((error) => (error ? reject(error) : resolve())));
  }
});

test('public provider proxies only to configured compliant upstream and rejects writes', async () => {
  const calls = [];
  const server = createServer(async (req, res) => {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    calls.push({ url: new URL(req.url, 'http://127.0.0.1'), body: JSON.parse(raw) });
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ resource: 'profiles', profile: { username: 'tenrusl' } }));
  });
  await startTestServer(server);
  const { port } = server.address();

  try {
    const provider = new PublicInstagramProvider({
      config: {
        publicDataEnabled: true,
        publicDataUpstreamUrl: `http://127.0.0.1:${port}`,
        providerRequestTimeoutMs: 1000,
      },
    });
    const result = await provider.getProfile('tenrusl');

    assert.equal(result.upstream.profile.username, 'tenrusl');
    assert.equal(calls[0].url.pathname, '/profiles/get');
    assert.equal(calls[0].body.identifier, 'tenrusl');
    await assert.rejects(() => provider.publish('media'), {
      code: 'PROVIDER_OPERATION_DISABLED',
      statusCode: 403,
    });
    await assert.rejects(() => provider.sendMessage('thread_123'), {
      code: 'PROVIDER_OPERATION_DISABLED',
      statusCode: 403,
    });
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

test('authorized provider stays disabled by default and returns 501 when reviewed but not implemented', async () => {
  const disabled = new AuthorizedInstagramProvider({ config: {} });
  await assert.rejects(() => disabled.getProfile('tenrusl'), {
    code: 'PROVIDER_NOT_CONFIGURED',
    statusCode: 503,
  });

  const reviewedButNotImplemented = new AuthorizedInstagramProvider({
    config: {
      authorizedProviderEnabled: true,
      authorizedSessionToken: 'session-token',
      authorizedIntegrationReviewed: true,
    },
  });
  await assert.rejects(() => reviewedButNotImplemented.getProfile('tenrusl'), {
    code: 'PROVIDER_OPERATION_DISABLED',
    statusCode: 501,
  });
});
