# 🛡️ Security Notes

## Wajib untuk public production scraper

```env
API_KEY_ENABLED=true
API_KEY=long-random-secret
RATE_LIMIT_MAX=30
CACHE_ENABLED=true
MAX_CONCURRENT_SCRAPES=2
```

## Jangan lakukan ini

- Jangan taruh token Meta di frontend.
- Jangan expose endpoint scraper tanpa API key.
- Jangan scraping setiap request tanpa cache.
- Jangan deploy Puppeteer berat ke serverless biasa kecuali Anda benar-benar paham limit-nya.

## Cloudflare recommended rules

- Enable SSL/TLS Full Strict.
- Enable WAF managed rules.
- Add rate limiting by path `/api/v1/instagram/*`.
- Cache successful official API responses at edge if sesuai kebutuhan.
