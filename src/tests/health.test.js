import test from 'node:test';
import assert from 'node:assert/strict';
import { assertEnvelope, requestJson, withServer } from './test-client.js';

test('health, ready, live, and metrics endpoints work', async () => {
  await withServer(async ({ baseUrl }) => {
    for (const path of ['/health', '/ready', '/live']) {
      const { response, body } = await requestJson(baseUrl, path);
      assert.equal(response.status, 200, path);
      assertEnvelope(body, true);
      assert.ok(body.data.status);
    }

    const metrics = await fetch(`${baseUrl}/metrics`);
    assert.equal(metrics.status, 200);
    const text = await metrics.text();
    assert.match(text, /tenrusl_up 1/);

    const jsonMetrics = await requestJson(baseUrl, '/metrics?format=json');
    assert.equal(jsonMetrics.response.status, 200);
    assertEnvelope(jsonMetrics.body, true);
    assert.ok(jsonMetrics.body.data.nodeVersion);
  });
});
