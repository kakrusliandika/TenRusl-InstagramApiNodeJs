import cors from 'cors';
import helmet from 'helmet';
import { env } from '../config/env.js';

function corsOrigin(origin, callback) {
  if (env.corsOrigins.includes('*')) return callback(null, true);
  if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
  return callback(new Error('Origin is not allowed by CORS.'));
}

export function applySecurityMiddleware(app) {
  app.disable('x-powered-by');
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  }));
  app.use(cors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['content-type', 'authorization', 'x-api-key', 'x-request-id'],
    credentials: false,
    maxAge: 600
  }));
}
