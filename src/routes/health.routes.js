import { Router } from 'express';
import { env } from '../config/env.js';
import { getCacheStats } from '../services/cache.service.js';
import { getPrometheusMetrics, getMetricsSnapshot } from '../services/metrics.service.js';
import { getScraperStats } from '../services/scraper.service.js';

export const healthRouter = Router();

export function healthHandler(_req, res) {
  res.json({
    success: true,
    status: 'ok',
    service: 'tenrusl-instagram-api',
    version: '3.0.0',
    mode: env.appMode,
    node: process.version,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
}

export function readyHandler(_req, res) {
  res.json({
    success: true,
    status: 'ready',
    mode: env.appMode,
    cache: getCacheStats(),
    scraper: getScraperStats(),
    official: {
      enabled: env.metaApiEnabled,
      configured: Boolean(env.metaAccessToken && env.metaIgUserId)
    },
    timestamp: new Date().toISOString()
  });
}

export function liveHandler(_req, res) {
  res.json({
    success: true,
    status: 'live',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
}

export function metricsHandler(req, res) {
  const wantsJson = req.query.format === 'json' || req.get('accept')?.includes('application/json');
  if (wantsJson) return res.json({ success: true, metrics: getMetricsSnapshot() });
  res.setHeader('content-type', 'text/plain; version=0.0.4; charset=utf-8');
  return res.send(getPrometheusMetrics());
}

healthRouter.get('/', healthHandler);
healthRouter.get('/ready', readyHandler);
healthRouter.get('/live', liveHandler);
healthRouter.get('/metrics', metricsHandler);
