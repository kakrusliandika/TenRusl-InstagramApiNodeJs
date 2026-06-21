import express from 'express';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { API_VERSION } from './config/constants.js';
import { logger } from './utils/logger.js';
import { requestIdMiddleware } from './middlewares/request-id.middleware.js';
import { applySecurityMiddleware } from './middlewares/security.middleware.js';
import { notFoundMiddleware } from './middlewares/not-found.middleware.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { healthRouter } from './routes/health.routes.js';
import { instagramRouter } from './routes/instagram.routes.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(requestIdMiddleware);
  app.use(pinoHttp({ logger, genReqId: (req) => req.id }));
  applySecurityMiddleware(app);

  app.use(express.json({ limit: '32kb' }));
  app.use(express.urlencoded({ extended: false, limit: '32kb' }));

  app.get('/', (_req, res) => {
    res.json({
      success: true,
      name: env.appName,
      version: '2.0.0',
      mode: env.appMode,
      endpoints: {
        health: '/health',
        ready: '/health/ready',
        instagram: `/api/${API_VERSION}/instagram/:username`,
        legacyInstagram: '/api/instagram/:username'
      },
      docs: 'README.md'
    });
  });

  app.use('/health', healthRouter);
  app.use(`/api/${API_VERSION}/instagram`, instagramRouter);

  // Backward compatible route for the old project.
  app.use('/api/instagram', instagramRouter);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}

const app = createApp();
export default app;
