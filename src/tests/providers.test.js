import test from 'node:test';
import assert from 'node:assert/strict';
import { createInstagramProvider } from '../providers/instagram/index.js';

test('provider factory creates all supported providers', () => {
  for (const name of ['mock', 'official', 'public', 'authorized']) {
    const provider = createInstagramProvider(name);
    assert.equal(provider.name, name);
    assert.equal(typeof provider.status, 'function');
  }
});

test('mock provider returns safe dry-run action result', async () => {
  const provider = createInstagramProvider('mock');
  const result = await provider.performAction('follow', 'tenrusl', { dryRun: false });
  assert.equal(result.provider.provider, 'mock');
  assert.equal(result.dryRun, true);
  assert.equal(result.result.status, 'dry-run');
});
