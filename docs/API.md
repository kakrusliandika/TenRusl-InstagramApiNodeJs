# API Reference

Base URL local: `http://localhost:3000`.

## Scope: "API full" means full mock contract

"API full" in this project means the gateway exposes a full Express contract: routes, controllers, provider methods, validation, tests, and standard response envelopes are wired consistently. It does **not** mean every provider can perform every Instagram operation against live upstreams.

Only `IG_PROVIDER=mock` supports the full endpoint contract for all routes without Instagram credentials or external upstreams. Non-mock providers are intentionally limited by official API scope, compliant upstream availability, reviewed consent, credentials, and safety/compliance boundaries.

All JSON API endpoints use this envelope. The static `/` page serves HTML, and `/metrics` serves Prometheus text unless `?format=json` is requested.

```json
{ "success": true, "data": {}, "meta": {}, "error": null }
```

Errors use:

```json
{ "success": false, "data": null, "meta": {}, "error": { "code": "ERROR_CODE", "message": "Message", "details": {} } }
```

## Quick Curl

```bash
curl http://localhost:3000/health
curl http://localhost:3000/ready
curl http://localhost:3000/capabilities
curl http://localhost:3000/v1/get/profiles/tenrusl
curl "http://localhost:3000/v1/get/posts/by-link?link=https://www.instagram.com/p/ABC123def45/"
```

Comment reply dry-run:

```bash
curl -X POST http://localhost:3000/v1/comments/reply \
  -H "content-type: application/json" \
  -d '{"id":"comment_123","text":"Local dry-run reply","dryRun":true}'
```

Publish dry-run:

```bash
curl -X POST http://localhost:3000/v1/publish/media \
  -H "content-type: application/json" \
  -d '{"mediaUrl":"https://example.com/image.jpg","mediaType":"IMAGE","caption":"Dry run only","dryRun":true}'
```

PowerShell:

```powershell
curl.exe http://localhost:3000/health
curl.exe http://localhost:3000/ready
curl.exe http://localhost:3000/capabilities
curl.exe http://localhost:3000/v1/get/profiles/tenrusl
curl.exe "http://localhost:3000/v1/get/posts/by-link?link=https://www.instagram.com/p/ABC123def45/"
curl.exe -X POST http://localhost:3000/v1/comments/reply -H "content-type: application/json" -d "{\"id\":\"comment_123\",\"text\":\"Local dry-run reply\",\"dryRun\":true}"
curl.exe -X POST http://localhost:3000/v1/publish/media -H "content-type: application/json" -d "{\"mediaUrl\":\"https://example.com/image.jpg\",\"mediaType\":\"IMAGE\",\"caption\":\"Dry run only\",\"dryRun\":true}"
```

## Provider Endpoint Status Matrix

Legend:

| Status | Meaning |
|---|---|
| ✅ Ready | Implemented for that provider boundary. |
| ◐ Partial | Partially implemented; depends on scope, fields, upstream behavior, or a subset of the contract. |
| 🧪 Dry-run | Request contract is accepted but no live write/action is executed. |
| 🔐 Needs credential/upstream | Requires provider credentials, approved scopes, account IDs, or a compliant upstream. |
| ⛔ Disabled | Explicitly rejected or not implemented for that provider. |

| Endpoint group | Mock | Official | Public | Authorized |
|---|---:|---:|---:|---:|
| System: `/health`, `/live` | ✅ Ready | ✅ Ready | ✅ Ready | ✅ Ready |
| Readiness/capability: `/ready`, `/capabilities` | ✅ Ready | 🔐 Needs Meta env; ◐ readiness | 🔐 Needs compliant upstream; ◐ readiness | ⛔ Disabled until reviewed integration |
| Metrics: `/metrics` | ✅ Ready | ✅ Ready | ✅ Ready | ✅ Ready |
| Accounts/profiles: `/v1/get/accounts/*`, `/v1/get/profiles/*` | ✅ Ready | ◐ Partial; 🔐 Meta credential/account scope | ◐ Upstream-dependent; 🔐 compliant upstream | ⛔ Disabled |
| Followers/following | ✅ Ready | ⛔ Disabled; unsupported safe Meta boundary here | ◐ Upstream-dependent; 🔐 compliant upstream | ⛔ Disabled |
| Content reads: photos/feeds/statuses/posts/reels/media by user/link/id | ✅ Ready | ⛔ Disabled except provider-specific supported reads | ◐ Upstream-dependent; 🔐 compliant upstream | ⛔ Disabled |
| Comments reads | ✅ Ready | ⛔ Disabled unless future approved scope is implemented | ◐ Upstream-dependent; 🔐 compliant upstream | ⛔ Disabled |
| Discovery: mentions, hashtag media | ✅ Ready | ⛔ Disabled unless future approved scope is implemented | ◐ Upstream-dependent; 🔐 compliant upstream | ⛔ Disabled |
| Insights | ✅ Ready | ◐ Partial; 🔐 Meta credential, IG user ID, approved scopes | ⛔ Disabled | ⛔ Disabled |
| Messaging/conversations | ✅ Ready | ⛔ Disabled unless future approved Messenger/IG scope is implemented | ⛔ Disabled | ⛔ Disabled |
| Writes/actions: follow, unfollow, publish, comment reply, send message | 🧪 Dry-run only | ⛔ Disabled; no automation/write boundary | ⛔ Disabled/read-only | ⛔ Disabled until reviewed consent integration |

Use the endpoint tables below as the canonical gateway contract. Use this matrix to decide whether a provider returns live data, dry-run responses, explicit provider errors, or readiness warnings.

## System

| Method | Path | Description | Provider status |
|---|---|---|---|
| GET | `/health` | Service health. | ✅ All providers |
| GET | `/ready` | Readiness and provider configuration warnings. | ✅ Mock; 🔐/◐ non-mock depending env |
| GET | `/live` | Liveness probe. | ✅ All providers |
| GET | `/metrics` | Prometheus-style metrics. Add `?format=json` for JSON. | ✅ All providers |
| GET | `/capabilities` | Active provider and safe operation capabilities. | ✅ Mock; 🔐/◐ non-mock depending env |

## Official and Legacy Routes

Canonical API routes use `/v1`. The `/v1/get/...` read routes are the official account, profile, relation, and media contract.

Legacy aliases are retained for existing clients and return the same standard JSON envelope:

| Legacy path | Replacement |
|---|---|
| `/api/v1/*` | `/v1/*` |
| `/api/v1/instagram/:identifier` | `/v1/get/profiles/:identifier` |
| `/v1/accounts/:identifier` | `/v1/get/accounts/:identifier` |
| `/v1/profiles/by-link` | `/v1/get/profiles/by-link` |
| `/v1/profiles/:identifier` | `/v1/get/profiles/:identifier` |
| `/v1/followers/:identifier` | `/v1/get/followers/:identifier` |
| `/v1/following/:identifier` | `/v1/get/following/:identifier` |
| `/v1/posts/by-link` | `/v1/get/posts/by-link` |
| `/v1/posts/:id` | `/v1/get/posts/:id` |

## Accounts, Profiles, Followers, Following

| Method | Path | Query/body | Provider status |
|---|---|---|---|
| GET | `/v1/get/accounts/:identifier` | ID or username. | ✅ Mock; ◐/🔐 Official; ◐/🔐 Public; ⛔ Authorized |
| GET | `/v1/get/profiles/:identifier` | ID or username. | ✅ Mock; ◐/🔐 Official; ◐/🔐 Public; ⛔ Authorized |
| GET | `/v1/get/profiles/by-link` | `link` or `url`. | ✅ Mock; ◐/🔐 Official; ◐/🔐 Public; ⛔ Authorized |
| GET | `/v1/get/followers/:identifier` | `limit`, `page`, `cursor`, `all`. | ✅ Mock; ⛔ Official; ◐/🔐 Public; ⛔ Authorized |
| GET | `/v1/get/following/:identifier` | `limit`, `page`, `cursor`, `all`. | ✅ Mock; ⛔ Official; ◐/🔐 Public; ⛔ Authorized |

## Content

| Method | Path | Provider status |
|---|---|---|
| GET | `/v1/get/photos/users/:identifier` | ✅ Mock; ⛔ Official; ◐/🔐 Public; ⛔ Authorized |
| GET | `/v1/get/photos/by-link?link=` | ✅ Mock; ⛔ Official; ◐/🔐 Public; ⛔ Authorized |
| GET | `/v1/get/feeds/users/:identifier` | ✅ Mock; ⛔ Official; ◐/🔐 Public; ⛔ Authorized |
| GET | `/v1/get/feeds/by-link?link=` | ✅ Mock; ⛔ Official; ◐/🔐 Public; ⛔ Authorized |
| GET | `/v1/get/statuses/users/:identifier` | ✅ Mock; ⛔ Official; ◐/🔐 Public; ⛔ Authorized |
| GET | `/v1/get/statuses/by-link?link=` | ✅ Mock; ⛔ Official; ◐/🔐 Public; ⛔ Authorized |
| GET | `/v1/get/posts/users/:identifier` | ✅ Mock; ⛔ Official; ◐/🔐 Public; ⛔ Authorized |
| GET | `/v1/get/posts/:id` | ✅ Mock; ⛔ Official; ◐/🔐 Public; ⛔ Authorized |
| GET | `/v1/get/posts/by-link?link=` | ✅ Mock; ⛔ Official; ◐/🔐 Public; ⛔ Authorized |
| GET | `/v1/get/reels/users/:identifier` | ✅ Mock; ⛔ Official; ◐/🔐 Public; ⛔ Authorized |
| GET | `/v1/get/reels/by-link?link=` | ✅ Mock; ⛔ Official; ◐/🔐 Public; ⛔ Authorized |
| GET | `/v1/get/media/users/:identifier` | ✅ Mock; ⛔ Official; ◐/🔐 Public; ⛔ Authorized |
| GET | `/v1/get/media/by-link?link=` | ✅ Mock; ⛔ Official; ◐/🔐 Public; ⛔ Authorized |

## Actions and Publishing

All write operations are safe dry-run in `mock`. Non-mock providers do not silently execute writes: unsupported actions fail explicitly unless a future reviewed provider implementation adds a safe live boundary.

| Method | Path | Body | Provider status |
|---|---|---|---|
| POST | `/v1/actions/follow/:identifier` | `{ "dryRun": true }` | 🧪 Mock; ⛔ Official/Public/Authorized |
| POST | `/v1/actions/unfollow/:identifier` | `{ "dryRun": true }` | 🧪 Mock; ⛔ Official/Public/Authorized |
| POST | `/v1/publish/media` | `{ "mediaUrl", "mediaType", "caption", "dryRun" }` | 🧪 Mock; ⛔ Official/Public/Authorized |
| POST | `/v1/publish/reels` | `{ "mediaUrl", "mediaType", "caption", "dryRun" }` | 🧪 Mock; ⛔ Official/Public/Authorized |
| POST | `/v1/publish/photos` | `{ "mediaUrl", "mediaType", "caption", "dryRun" }` | 🧪 Mock; ⛔ Official/Public/Authorized |
| POST | `/v1/publish/feeds` | `{ "mediaUrl", "mediaType", "caption", "dryRun" }` | 🧪 Mock; ⛔ Official/Public/Authorized |
| POST | `/v1/publish/statuses` | `{ "mediaUrl", "mediaType", "caption", "dryRun" }` | 🧪 Mock; ⛔ Official/Public/Authorized |

## Comments, Discovery, Insights, Messaging

| Method | Path | Query/body | Provider status |
|---|---|---|---|
| GET | `/v1/comments` | optional `link`, pagination. | ✅ Mock; ⛔ Official; ◐/🔐 Public; ⛔ Authorized |
| POST | `/v1/comments/:id/reply` | `{ "text", "dryRun" }` | 🧪 Mock; ⛔ Official/Public/Authorized |
| POST | `/v1/comments/reply` | `{ "id" or "link", "text", "dryRun" }` | 🧪 Mock; ⛔ Official/Public/Authorized |
| GET | `/v1/mentions` | pagination. | ✅ Mock; ⛔ Official; ◐/🔐 Public; ⛔ Authorized |
| GET | `/v1/hashtags/media` | `hashtag` or `tag`, pagination. | ✅ Mock; ⛔ Official; ◐/🔐 Public; ⛔ Authorized |
| GET | `/v1/insights` | provider-specific. | ✅ Mock; ◐/🔐 Official; ⛔ Public/Authorized |
| GET | `/v1/conversations` | pagination. | ✅ Mock; ⛔ Official/Public/Authorized |
| GET | `/v1/messages` | pagination. | ✅ Mock; ⛔ Official/Public/Authorized |
| GET | `/v1/messages/:id` | thread messages. | ✅ Mock; ⛔ Official/Public/Authorized |
| POST | `/v1/messages/:id/send` | `{ "recipientId" or "username", "text", "dryRun" }` | 🧪 Mock; ⛔ Official/Public/Authorized |

## Validation

- `username`: letters, numbers, dots, underscores; no consecutive/trailing dots; max 30 chars.
- `id`: required, safe characters only, max 128 chars.
- `link`: must use Instagram host and supported path (`p`, `reel`, `tv`, `stories`, or profile where supported).
- `limit`: integer, bounded by `MAX_LIMIT`.
- `dryRun`: defaults to `true` for write actions.

`POST /v1/comments/reply` accepts either `id` or `link`. If both are present, `id` wins because it is the explicit target and avoids URL ambiguity.
