# Environment Variables

| Variable                      | Default                 | Description                                             |
| ----------------------------- | ----------------------- | ------------------------------------------------------- |
| `NODE_ENV`                    | `development`           | Runtime mode.                                           |
| `APP_NAME`                    | `TenRusl Instagram API Gateway` | Service name exposed by health and metrics.      |
| `PORT`                        | `3000`                  | HTTP port.                                              |
| `HOST`                        | `0.0.0.0`               | Bind address.                                           |
| `TRUST_PROXY`                 | `1`                     | Express trust proxy setting for reverse proxies.        |
| `LOG_LEVEL`                   | `info`                  | `debug`, `info`, `warn`, `error`, `silent`.             |
| `IG_PROVIDER`                 | `mock`                  | `mock`, `official`, `public`, `authorized`.             |
| `API_KEY_ENABLED`             | `false`                 | Enables `x-api-key` or Bearer auth.                     |
| `API_KEY`                     | empty                   | Required when API key is enabled.                       |
| `CORS_ORIGIN`                 | `*`                     | Comma-separated allowed origins.                        |
| `RATE_LIMIT_WINDOW_MS`        | `60000`                 | Rate limit window.                                      |
| `RATE_LIMIT_MAX`              | `120`                   | Max requests per window per IP.                         |
| `DEFAULT_LIMIT`               | `25`                    | Default collection limit.                               |
| `MAX_LIMIT`                   | `100`                   | Max collection limit.                                   |
| `BODY_LIMIT`                  | `256kb`                 | JSON and form body limit.                               |
| `PROVIDER_REQUEST_TIMEOUT_MS` | `10000`                 | Timeout for upstream provider requests.                 |
| `META_GRAPH_BASE_URL`         | `https://graph.facebook.com` | Meta Graph API base URL.                         |
| `META_API_VERSION`            | `v23.0`                 | Meta Graph API version boundary.                        |
| `META_ACCESS_TOKEN`           | empty                   | Official provider token.                                |
| `META_IG_USER_ID`             | empty                   | Instagram Business/Creator user ID.                     |
| `PUBLIC_DATA_ENABLED`         | `false`                 | Enables public adapter integration boundary.            |
| `PUBLIC_DATA_UPSTREAM_URL`    | empty                   | Compliant public data upstream, if used.                |
| `AUTHORIZED_PROVIDER_ENABLED` | `false`                 | Enables advanced authorized provider boundary.          |
| `AUTHORIZED_SESSION_TOKEN`    | empty                   | Secret token/session supplied consciously by the owner. |
| `GRACEFUL_SHUTDOWN_MS`        | `10000`                 | Shutdown timeout before forcing process exit.           |

Production recommendation: keep `IG_PROVIDER=mock` for previews, use `official` for real Business/Creator integrations, and store all secrets in a platform secret manager.

Deprecated legacy variables are not read by the Express runtime: `APP_MODE`, `SCRAPER_ENABLED`, `CACHE_ENABLED`, `PUPPETEER_HEADLESS`, and `META_API_ENABLED`.
