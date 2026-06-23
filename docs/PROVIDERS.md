# Provider Adapters

Provider selection is controlled by `IG_PROVIDER`.

| Provider | Production status | Required env | Behavior |
|---|---|---|---|
| `mock` | Safe default | none | Deterministic local data; write contracts return dry-run responses. |
| `official` | Partial | `META_GRAPH_BASE_URL`, `META_API_VERSION`, `META_ACCESS_TOKEN`, `META_IG_USER_ID` | Uses the official Meta/Instagram Graph API only for supported account/profile/insight reads; unsupported operations fail explicitly. |
| `public` | Disabled by default | `PUBLIC_DATA_ENABLED=true`, `PUBLIC_DATA_UPSTREAM_URL` | Proxies only to a compliant public-data upstream you control; private/write operations fail with `403`. |
| `authorized` | Disabled / not production-ready | `AUTHORIZED_PROVIDER_ENABLED=true`, `AUTHORIZED_SESSION_TOKEN`, `AUTHORIZED_INTEGRATION_REVIEWED=true` plus reviewed code implementation | Reserved for owned or explicitly consented data after reviewed integration work; live operations are not implemented. |

All providers expose the same gateway controller method contract. The contract is documented in `src/providers/instagram/provider.contract.js` and asserted when a provider instance is created. Unsupported live behavior should fail with explicit provider errors rather than falling back to fake production data.

## Capability Matrix

| Provider | Public/profile reads | Public media/comments | Insights | Writes/private actions | Boundary flags |
|---|---:|---:|---:|---:|---|
| `mock` | yes | yes | yes | dry-run only | deterministic local data |
| `official` | partial | no | partial | no | `officialApiOnly=true` |
| `public` | upstream-dependent | upstream-dependent | no | no | `requiresCompliantUpstream=true` |
| `authorized` | no | no | no | no | `requiresReviewedIntegration=true` |
 
Capability values are returned by `/capabilities` and by each provider `status()`. They describe the implemented gateway boundary, not every feature Instagram or Meta may provide.

## Production Readiness Matrix

| Area | Status | Production meaning |
|---|---|---|
| API skeleton | Ready as a deployable gateway skeleton | Express, validation, envelopes, security middleware, probes, Docker, CI, and docs are maintained. |
| Mock provider | Ready for preview/demo production | Safe deterministic gateway, no live Instagram state, write contracts always dry-run. |
| Official provider | Partially ready | Ready only for the implemented Meta Graph API account/profile/insights reads and only when Meta env is complete. |
| Public provider | Conditional | Ready only if the configured upstream is legal, compliant, reliable, and owned/controlled by the deployer. |
| Authorized provider | Blocked | Not ready for production traffic until a reviewed integration exists in code and unsupported operations are implemented safely. |

## Mock

- Default provider.
- No external network calls.
- All endpoints return deterministic mock data.
- Write endpoints return accepted dry-run responses.
- Best for CI/CD and deployment previews.

## Official

- Boundary for Instagram Graph API / Meta API.
- Requires `META_ACCESS_TOKEN` and `META_IG_USER_ID`.
- Requires `META_GRAPH_BASE_URL` and `META_API_VERSION`.
- Sends the access token as an `Authorization: Bearer` header, not as a query parameter.
- Validates `META_GRAPH_BASE_URL`, `META_API_VERSION`, and `META_IG_USER_ID` before reporting ready.
- Handles upstream timeout, non-JSON responses, and Graph API error responses as provider upstream errors.
- Use only scopes approved for your app and authenticated Business/Creator account.
- Follow/unfollow automation is not exposed by this safe adapter.

## Public

- Read-only boundary for public data that is allowed by law and platform terms.
- Requires `PUBLIC_DATA_ENABLED=true` and a valid `PUBLIC_DATA_UPSTREAM_URL`.
- `PUBLIC_DATA_UPSTREAM_URL` must be an HTTP/HTTPS URL without embedded credentials.
- Does not bypass login, anti-bot controls, rate limits, or access controls.
- Write and private operations are disabled with `403`.

## Authorized

- Advanced boundary for owned data or data with explicit permission.
- Disabled by default via `AUTHORIZED_PROVIDER_ENABLED=false`.
- Requires `AUTHORIZED_PROVIDER_ENABLED=true` and `AUTHORIZED_SESSION_TOKEN` before the boundary can be selected.
- Requires `AUTHORIZED_INTEGRATION_REVIEWED=true` and a real reviewed implementation in code before readiness can pass.
- Does not store raw passwords.
- Live operations return `501` until you add reviewed consent and secure integration logic.
