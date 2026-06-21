import express from 'express';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { API_VERSION } from './config/constants.js';
import { logger } from './utils/logger.js';
import { requestIdMiddleware } from './middlewares/request-id.middleware.js';
import { applySecurityMiddleware } from './middlewares/security.middleware.js';
import { notFoundMiddleware } from './middlewares/not-found.middleware.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { healthRouter, healthHandler, liveHandler, metricsHandler, readyHandler } from './routes/health.routes.js';
import { instagramRouter } from './routes/instagram.routes.js';
import { v1Router } from './routes/v1.routes.js';
import { metricsMiddleware } from './services/metrics.service.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(requestIdMiddleware);
  app.use(pinoHttp({ logger, genReqId: (req) => req.id }));
  app.use(metricsMiddleware);
  applySecurityMiddleware(app);

  app.use(express.json({ limit: '128kb' }));
  app.use(express.urlencoded({ extended: false, limit: '128kb' }));

  app.get('/', (_req, res) => {
    res.json({
      success: true,
      name: env.appName,
      version: '3.0.0',
      mode: env.appMode,
      runtime: {
        primary: 'Node.js 24 LTS',
        compatibility: 'Node.js 22',
        current: process.version
      },
      endpoints: {
        health: '/health',
        ready: '/ready',
        live: '/live',
        metrics: '/metrics',
        v1: '/v1',
        accounts: '/v1/accounts',
        profiles: '/v1/profiles',
        posts: '/v1/posts',
        legacyInstagram: `/api/${API_VERSION}/instagram/:username`
      },
      docs: 'README.md'
    });
  });

  app.get('/health', healthHandler);
  app.get('/ready', readyHandler);
  app.get('/live', liveHandler);
  app.get('/metrics', metricsHandler);
  app.use('/health', healthRouter);

  app.use(`/${API_VERSION}`, v1Router);
  app.use(`/api/${API_VERSION}`, v1Router);

  app.use(`/api/${API_VERSION}/instagram`, instagramRouter);

  // Backward compatible route for the old project.
  app.use('/api/instagram', instagramRouter);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}

const app = createApp();
export default app;
