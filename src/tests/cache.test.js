import test from 'node:test';
import assert from 'node:assert/strict';
import { buildInstagramCacheKey, clearCache, getCache, setCache } from '../services/cache.service.js';

test('cache stores and retrieves values', () => {
  clearCache();
  const key = buildInstagramCacheKey({ source: 'scraper', username: 'KakRusliAndika', limit: 12 });
  setCache(key, { ok: true });
  assert.deepEqual(getCache(key), { ok: true });
});
