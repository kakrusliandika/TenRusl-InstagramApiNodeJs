import express from 'express';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { apiKeyMiddleware } from './middlewares/api-key.middleware.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { notFoundMiddleware } from './middlewares/not-found.middleware.js';
import { rateLimitMiddleware } from './middlewares/rate-limit.middleware.js';
import { requestIdMiddleware } from './middlewares/request-id.middleware.js';
import { applySecurityMiddleware } from './middlewares/security.middleware.js';
import { getInstagramProvider } from './providers/instagram/index.js';
import { router } from './routes/index.js';
import { metricsMiddleware } from './services/metrics.service.js';
import { successEnvelope } from './utils/response.js';
import { sanitizeObject } from './utils/sanitize.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(requestIdMiddleware);
  app.use(metricsMiddleware);
  applySecurityMiddleware(app);
  app.use(express.json({ limit: env.bodyLimit, strict: true }));
  app.use(express.urlencoded({ extended: false, limit: env.bodyLimit }));
  app.use((req, _res, next) => {
    req.body = sanitizeObject(req.body);
    next();
  });
  app.use(rateLimitMiddleware);
  app.use(apiKeyMiddleware);

  app.get('/', (req, res) => {
    const provider = getInstagramProvider();
    return res.json(successEnvelope({
      name: env.appName,
      version: env.appVersion,
      runtime: {
        primary: 'Node.js 24 LTS',
        compatibility: 'Node.js 22',
        current: process.version,
        module: 'ESM',
        framework: 'Express.js'
      },
      provider: provider.status(),
      endpoints: {
        health: '/health',
        ready: '/ready',
        live: '/live',
        metrics: '/metrics',
        api: '/v1',
        docs: 'README.md and docs/*.md'
      }
    }, { requestId: req.id }));
  });

  app.use(router);

  app.get('/api/v1/instagram/:identifier', async (req, res, next) => {
    try {
      const provider = getInstagramProvider();
      const data = await provider.getProfile(req.params.identifier);
      return res.json(successEnvelope(data, { requestId: req.id, provider: provider.status(), legacy: true }));
    } catch (error) {
      return next(error);
    }
  });

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  logger.debug('Express application created.', { provider: env.igProvider });
  return app;
}

export default createApp();
