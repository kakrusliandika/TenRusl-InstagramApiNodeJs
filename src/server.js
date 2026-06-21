import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { closeBrowser } from './services/browser.service.js';

const server = app.listen(env.port, () => {
  logger.info({
    port: env.port,
    mode: env.appMode,
    environment: env.nodeEnv
  }, `TenRusl Instagram API running on port ${env.port}`);
});

async function shutdown(signal) {
  logger.info({ signal }, 'Shutdown signal received.');
  server.close(async () => {
    await closeBrowser();
    logger.info('HTTP server closed.');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection.');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught exception.');
  process.exit(1);
});
