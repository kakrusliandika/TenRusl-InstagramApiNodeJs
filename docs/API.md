# API Reference

Base URL local: `http://localhost:3000`.

All JSON endpoints use this envelope:

```json
{ "success": true, "data": {}, "meta": {}, "error": null }
```

Errors use:

```json
{ "success": false, "data": null, "meta": {}, "error": { "code": "ERROR_CODE", "message": "Message", "details": {} } }
```

## System

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Service health. |
| GET | `/ready` | Readiness and provider configuration warnings. |
| GET | `/live` | Liveness probe. |
| GET | `/metrics` | Prometheus-style metrics. Add `?format=json` for JSON. |

## Accounts, Profiles, Followers, Following

| Method | Path | Query/body |
|---|---|---|
| GET | `/v1/get/accounts/:identifier` | ID or username. |
| GET | `/v1/get/profiles/:identifier` | ID or username. |
| GET | `/v1/get/profiles/by-link` | `link` or `url`. |
| GET | `/v1/get/followers/:identifier` | `limit`, `page`, `cursor`, `all`. |
| GET | `/v1/get/following/:identifier` | `limit`, `page`, `cursor`, `all`. |

## Content

| Method | Path |
|---|---|
| GET | `/v1/get/photos/users/:identifier` |
| GET | `/v1/get/photos/by-link?link=` |
| GET | `/v1/get/feeds/users/:identifier` |
| GET | `/v1/get/feeds/by-link?link=` |
| GET | `/v1/get/statuses/users/:identifier` |
| GET | `/v1/get/statuses/by-link?link=` |
| GET | `/v1/get/posts/users/:identifier` |
| GET | `/v1/get/posts/:id` |
| GET | `/v1/get/posts/by-link?link=` |
| GET | `/v1/get/reels/users/:identifier` |
| GET | `/v1/get/reels/by-link?link=` |
| GET | `/v1/get/media/users/:identifier` |
| GET | `/v1/get/media/by-link?link=` |

## Actions and Publishing

All write operations are safe dry-run by default.

| Method | Path | Body |
|---|---|---|
| POST | `/v1/actions/follow/:identifier` | `{ "dryRun": true }` |
| POST | `/v1/actions/unfollow/:identifier` | `{ "dryRun": true }` |
| POST | `/v1/publish/media` | `{ "mediaUrl", "mediaType", "caption", "dryRun" }` |
| POST | `/v1/publish/reels` | `{ "mediaUrl", "mediaType", "caption", "dryRun" }` |
| POST | `/v1/publish/photos` | `{ "mediaUrl", "mediaType", "caption", "dryRun" }` |
| POST | `/v1/publish/feeds` | `{ "mediaUrl", "mediaType", "caption", "dryRun" }` |
| POST | `/v1/publish/statuses` | `{ "mediaUrl", "mediaType", "caption", "dryRun" }` |

## Comments, Discovery, Insights, Messaging

| Method | Path | Query/body |
|---|---|---|
| GET | `/v1/comments` | optional `link`, pagination. |
| POST | `/v1/comments/:id/reply` | `{ "text", "dryRun" }` |
| POST | `/v1/comments/reply` | `{ "id" or "link", "text", "dryRun" }` |
| GET | `/v1/mentions` | pagination. |
| GET | `/v1/hashtags/media` | `hashtag` or `tag`, pagination. |
| GET | `/v1/insights` | provider-specific. |
| GET | `/v1/conversations` | pagination. |
| GET | `/v1/messages` | pagination. |
| GET | `/v1/messages/:id` | thread messages. |
| POST | `/v1/messages/:id/send` | `{ "recipientId" or "username", "text", "dryRun" }` |

## Validation

- `username`: letters, numbers, dots, underscores; no consecutive/trailing dots; max 30 chars.
- `id`: required, safe characters only, max 128 chars.
- `link`: must use Instagram host and supported path (`p`, `reel`, `tv`, `stories`, or profile where supported).
- `limit`: integer, bounded by `MAX_LIMIT`.
- `dryRun`: defaults to `true` for write actions.
