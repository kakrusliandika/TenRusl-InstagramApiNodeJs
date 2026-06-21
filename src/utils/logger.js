import pino from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.logLevel,
  base: {
    service: 'tenrusl-instagram-api',
    environment: env.nodeEnv
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.x-api-key',
      'res.headers.set-cookie',
      'META_ACCESS_TOKEN',
      'API_KEY'
    ],
    censor: '[redacted]'
  }
});
