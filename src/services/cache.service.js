import { LRUCache } from 'lru-cache';
import { env } from '../config/env.js';

const cache = new LRUCache({
  max: env.cacheMaxItems,
  ttl: env.cacheTtlSeconds * 1000,
  allowStale: false,
  updateAgeOnGet: true
});

export function getCache(key) {
  if (!env.cacheEnabled) return undefined;
  return cache.get(key);
}

export function setCache(key, value, ttlSeconds = env.cacheTtlSeconds) {
  if (!env.cacheEnabled) return;
  cache.set(key, value, { ttl: ttlSeconds * 1000 });
}

export function deleteCache(key) {
  cache.delete(key);
}

export function clearCache() {
  cache.clear();
}

export function getCacheStats() {
  return {
    enabled: env.cacheEnabled,
    size: cache.size,
    max: env.cacheMaxItems,
    ttlSeconds: env.cacheTtlSeconds
  };
}

export function buildInstagramCacheKey({ source, username, limit }) {
  return `instagram:${source}:${username.toLowerCase()}:${limit}`;
}
