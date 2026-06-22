import express from 'express';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
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
import { validateIdentifier } from './utils/validation.js';

const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

export function createApp() {
  const app = express();

  app.set('trust proxy', env.trustProxy);
  app.use(requestIdMiddleware);
  app.use(metricsMiddleware);
  applySecurityMiddleware(app);
  app.use(express.static(publicDir, { index: false, maxAge: env.isProduction ? '1h' : 0 }));
  app.get('/', (_req, res) => {
    return res.sendFile(join(publicDir, 'index.html'));
  });
  app.use(rateLimitMiddleware);
  app.use(apiKeyMiddleware);
  app.use(express.json({ limit: env.bodyLimit, strict: true }));
  app.use(express.urlencoded({ extended: false, limit: env.bodyLimit }));
  app.use((req, _res, next) => {
    req.body = sanitizeObject(req.body);
    const sanitizedQuery = sanitizeObject(req.query);
    for (const key of Object.keys(req.query)) delete req.query[key];
    Object.assign(req.query, sanitizedQuery);
    next();
  });

  app.use(router);

  app.get('/api/v1/instagram/:identifier', async (req, res, next) => {
    try {
      const provider = getInstagramProvider();
      const identifier = validateIdentifier(req.params.identifier);
      const data = await provider.getProfile(identifier.value);
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
