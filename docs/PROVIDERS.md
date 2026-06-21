# Provider Adapters

Provider selection is controlled by `IG_PROVIDER`.

## Mock

- Default provider.
- No external network calls.
- All endpoints return deterministic mock data.
- Write endpoints return accepted dry-run responses.
- Best for CI/CD and deployment previews.

## Official

- Boundary for Instagram Graph API / Meta API.
- Requires `META_ACCESS_TOKEN` and `META_IG_USER_ID`.
- Use only scopes approved for your app and authenticated Business/Creator account.
- Follow/unfollow automation is not exposed by this safe adapter.

## Public

- Read-only boundary for public data that is allowed by law and platform terms.
- Does not bypass login, anti-bot controls, rate limits, or access controls.
- Write operations are disabled.

## Authorized

- Advanced boundary for owned data or data with explicit permission.
- Disabled by default via `AUTHORIZED_PROVIDER_ENABLED=false`.
- Does not store raw passwords.
- Live operations are intentionally not implemented until you add reviewed consent and secure integration logic.
