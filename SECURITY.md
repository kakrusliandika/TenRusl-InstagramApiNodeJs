# Security Policy

## Supported version

| Version | Status |
|---|---|
| 2.x | Supported |

## Security recommendations

- Always enable `API_KEY_ENABLED=true` for public production scraper deployments.
- Never expose `META_ACCESS_TOKEN` in client-side code.
- Use Cloudflare or another reverse proxy for TLS, DDoS protection, and caching.
- Keep `CACHE_TTL_SECONDS` enabled to reduce expensive browser automation calls.
- Use Docker for Puppeteer production runtime.
- Do not run public scraper endpoints without rate limiting.

## Reporting

If you find a vulnerability, open a private security advisory or contact the project maintainer.
