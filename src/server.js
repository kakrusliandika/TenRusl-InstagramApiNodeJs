import { env, getEnvironmentWarnings } from './config/env.js';
import { logger } from './config/logger.js';
import { createApp } from './app.js';

const app = createApp();
const server = app.listen(env.port, env.host, () => {
  logger.info('API server started.', {
    host: env.host,
    port: env.port,
    node: process.version,
    provider: env.igProvider,
    warnings: getEnvironmentWarnings()
  });
});

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info('Graceful shutdown requested.', { signal });
  const timeout = setTimeout(() => {
    logger.error('Graceful shutdown timeout reached. Forcing exit.', { signal });
    server.closeAllConnections?.();
    process.exit(1);
  }, env.gracefulShutdownMs);
  timeout.unref?.();

  server.closeIdleConnections?.();

  server.close((error) => {
    clearTimeout(timeout);
    if (error) {
      logger.error('HTTP server shutdown failed.', { error: error.message });
      process.exit(1);
    }
    logger.info('HTTP server stopped cleanly.', { signal });
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection.', { reason: reason instanceof Error ? reason.message : String(reason) });
});
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception.', { error: error.message, stack: error.stack });
  process.exit(1);
});
