# Security Notes

## Implemented hardening

- Helmet security headers.
- Configurable CORS.
- Basic in-memory rate limit.
- Request ID per request.
- JSON body size limit.
- Input sanitization for body, params, and query values.
- Zod validation schemas.
- Global not-found and error handlers.
- Standard error envelope.
- Structured JSON logging with secret redaction.
- Graceful shutdown.
- Default mock provider and dry-run write operations.

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
- Restrict `CORS_ORIGIN`.
- Use `IG_PROVIDER=official` with Meta-approved scopes for real data.
- Put secrets in cloud secret manager.
- Monitor `/ready`, `/live`, and `/metrics`.
- Rotate tokens and audit access logs.
