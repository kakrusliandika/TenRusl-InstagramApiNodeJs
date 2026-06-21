import { env } from '../config/env.js';
import { ERROR_CODES } from '../config/constants.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

let browserPromise;

function resolveHeadless() {
  if (env.puppeteerHeadless === 'false') return false;
  if (env.puppeteerHeadless === 'new') return 'new';
  return true;
}

async function loadPuppeteer() {
  try {
    const imported = await import('puppeteer');
    return imported.default || imported;
  } catch (error) {
    throw new AppError('Puppeteer belum terpasang. Jalankan npm install tanpa --omit=optional atau gunakan Docker scraper.', {
      statusCode: 500,
      code: ERROR_CODES.PUPPETEER_NOT_INSTALLED,
      details: env.isProduction ? undefined : error.message
    });
  }
}

async function createBrowser() {
  const puppeteer = await loadPuppeteer();

  const launchOptions = {
    headless: resolveHeadless(),
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-default-apps',
      '--mute-audio',
      '--no-first-run',
      '--no-zygote'
    ]
  };

  if (env.puppeteerExecutablePath) {
    launchOptions.executablePath = env.puppeteerExecutablePath;
  }

  const browser = await puppeteer.launch(launchOptions);
  browser.on('disconnected', () => {
    logger.warn('Puppeteer browser disconnected; next request will launch a new browser.');
    browserPromise = undefined;
  });

  logger.info('Puppeteer browser launched.');
  return browser;
}

export async function getBrowser() {
  if (!browserPromise) {
    browserPromise = createBrowser().catch((error) => {
      browserPromise = undefined;
      throw error;
    });
  }

  return browserPromise;
}

export async function closeBrowser() {
  if (!browserPromise) return;
  try {
    const browser = await browserPromise;
    await browser.close();
    logger.info('Puppeteer browser closed.');
  } catch (error) {
    logger.warn({ error }, 'Failed to close Puppeteer browser cleanly.');
  } finally {
    browserPromise = undefined;
  }
}
