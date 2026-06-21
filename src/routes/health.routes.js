import { Router } from 'express';
import { env } from '../config/env.js';
import { getCacheStats } from '../services/cache.service.js';
import { getScraperStats } from '../services/scraper.service.js';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    service: 'tenrusl-instagram-api',
    mode: env.appMode,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

healthRouter.get('/ready', (_req, res) => {
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
});
