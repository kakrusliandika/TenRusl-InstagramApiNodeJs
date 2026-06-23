# Security Notes

## Implemented hardening

- Helmet security headers.
- Configurable CORS.
- Basic in-memory rate limit for single-instance deployments.
- Rate-limit response headers and `Retry-After` on 429 responses.
- Rate limiting is enabled by default. `RATE_LIMIT_ENABLED=false` is only honored outside production; production keeps enforcement active.
- Request ID per request.
- JSON body size limit.
- Input sanitization for body, params, and query values.
- Zod validation schemas.
- Global not-found and error handlers.
- Standard error envelope.
- Structured JSON logging with secret redaction.
- Timing-safe API key comparison.
- Optional API-key protection for `/metrics` and `/capabilities`.
- Graceful shutdown.
- Default mock provider and dry-run write operations.
- Official provider sends Meta access tokens with `Authorization: Bearer`.
- Public provider accepts only HTTP/HTTPS upstream URLs without embedded credentials.

## Not included by design

- Login bypass.
- Credential stuffing.
- Anti-bot or rate-limit evasion.
- Session theft.
- Raw password storage.
- Aggressive scraping.

## Production checklist

- Set `NODE_ENV=production`.
- Use `API_KEY_ENABLED=true` or protect the API behind an auth gateway.
- Keep `RATE_LIMIT_ENABLED=true`; disabling the internal limiter is only for local/test troubleshooting.
- Keep `METRICS_PUBLIC=false` and `CAPABILITIES_PUBLIC=false` unless these endpoints are protected upstream.
- Restrict `CORS_ORIGIN`.
- Use `IG_PROVIDER=official` with Meta-approved scopes for real data.
- Use `IG_PROVIDER=public` only with a compliant upstream you control; do not proxy scraping bypasses.
- Put secrets in cloud secret manager.
- Monitor `/ready`, `/live`, and `/metrics`.
- Rotate tokens and audit access logs.
- Use a distributed rate limiter or upstream gateway quota for multi-instance production.
- Keep real `.env`, token, and credential files out of Docker build context.

## Rate limit client guidance

- Treat `429 RATE_LIMITED` as a compliance signal, not something to bypass.
- Respect the `Retry-After` header before retrying.
- Use exponential backoff with jitter for retryable requests.
- Queue non-urgent jobs instead of sending bursts.
- Cache responses only when your use case and provider terms allow it.
- Use the official provider and approved Meta quota when you need legal production scale.
