import { env } from '../config/env.js';
import { ERROR_CODES } from '../config/constants.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { getBrowser } from './browser.service.js';
import { AsyncQueue } from './queue.service.js';

const scrapeQueue = new AsyncQueue({ concurrency: env.maxConcurrentScrapes });

function normalizeInstagramImageUrl(url) {
  if (!url) return '';
  return String(url).replace(/&amp;/g, '&');
}

async function scrapeNow({ username, limit }) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    page.setDefaultTimeout(env.scrapeTimeoutMs);
    page.setDefaultNavigationTimeout(env.scrapeTimeoutMs);

    await page.setUserAgent(env.puppeteerUserAgent);
    await page.setViewport({ width: 1366, height: 900, deviceScaleFactor: 1 });

    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const type = request.resourceType();
      if (['font', 'media'].includes(type)) {
        request.abort();
        return;
      }
      request.continue();
    });

    const targetUrl = `https://www.instagram.com/${encodeURIComponent(username)}/`;
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: env.scrapeTimeoutMs });
    await page.waitForSelector('article img, main img', { timeout: Math.min(env.scrapeTimeoutMs, 12_000) }).catch(() => undefined);

    const data = await page.evaluate((maxItems) => {
      const toAbsoluteUrl = (href) => {
        try {
          return new URL(href, window.location.origin).toString();
        } catch {
          return href || '';
        }
      };

      const cleanText = (value) => String(value || '').replace(/\s+/g, ' ').trim();
      const roots = [document.querySelector('article'), document.querySelector('main'), document.body].filter(Boolean);
      const links = [];

      for (const root of roots) {
        links.push(...Array.from(root.querySelectorAll('a[href*="/p/"], a[href*="/reel/"], a[href*="/tv/"]')));
      }

      const seen = new Set();
      const items = [];

      for (const link of links) {
        if (items.length >= maxItems) break;
        const href = link.getAttribute('href') || '';
        const postUrl = toAbsoluteUrl(href);
        if (!postUrl || seen.has(postUrl)) continue;

        const img = link.querySelector('img');
        if (!img) continue;

        const imageUrl = img.currentSrc || img.src || img.getAttribute('src') || '';
        const caption = cleanText(img.getAttribute('alt') || img.getAttribute('aria-label') || '');

        if (!imageUrl) continue;
        seen.add(postUrl);
        items.push({
          imageUrl,
          caption,
          postUrl,
          mediaType: postUrl.includes('/reel/') ? 'REEL' : 'IMAGE',
          source: 'scraper'
        });
      }

      if (items.length === 0) {
        const images = Array.from(document.querySelectorAll('article img, main img')).slice(0, maxItems);
        for (const img of images) {
          const imageUrl = img.currentSrc || img.src || img.getAttribute('src') || '';
          if (!imageUrl || seen.has(imageUrl)) continue;
          seen.add(imageUrl);
          items.push({
            imageUrl,
            caption: cleanText(img.getAttribute('alt') || ''),
            postUrl: '',
            mediaType: 'IMAGE',
            source: 'scraper'
          });
        }
      }

      return items;
    }, limit);

    const scrapedAt = new Date().toISOString();
    return data.map((item) => ({
      ...item,
      imageUrl: normalizeInstagramImageUrl(item.imageUrl),
      scrapedAt
    }));
  } catch (error) {
    logger.warn({ error, username }, 'Instagram scraper failed.');
    if (error instanceof AppError) throw error;
    throw new AppError('Gagal mengambil data Instagram publik melalui scraper.', {
      statusCode: 502,
      code: ERROR_CODES.SCRAPER_ERROR,
      details: env.isProduction ? undefined : error.message
    });
  } finally {
    await page.close().catch(() => undefined);
  }
}

export async function fetchPublicInstagramFeed({ username, limit }) {
  if (!env.scraperEnabled) {
    throw new AppError('Scraper mode sedang dinonaktifkan.', {
      statusCode: 503,
      code: ERROR_CODES.SCRAPER_DISABLED
    });
  }

  return scrapeQueue.add(() => scrapeNow({ username, limit }));
}

export function getScraperStats() {
  return scrapeQueue.stats();
}
