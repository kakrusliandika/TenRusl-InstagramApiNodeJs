import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import { env } from '../config/env.js';

function resolveCorsOrigin(origin, callback) {
  if (!origin) {
    callback(null, true);
    return;
  }

  if (env.corsOrigin.includes('*') || env.corsOrigin.includes(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error('Origin tidak diizinkan oleh CORS.'));
}

export function applySecurityMiddleware(app) {
  app.disable('x-powered-by');

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  }));

  app.use(cors({
    origin: resolveCorsOrigin,
    credentials: false,
    methods: ['GET', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID']
  }));

  app.use(compression());
}
