# API Reference — TenRusl Instagram API v3

Base URL lokal:

```txt
http://localhost:3000
```

Base prefix utama:

```txt
/v1
```

Alias kompatibilitas:

```txt
/api/v1
```

## Health

| Method | Endpoint | Response |
|---|---|---|
| GET | `/health` | JSON status service |
| GET | `/ready` | JSON readiness lengkap |
| GET | `/live` | JSON liveness |
| GET | `/metrics` | Prometheus text |
| GET | `/metrics?format=json` | JSON metrics |

## V1 endpoints

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/v1/accounts` | List accounts contract |
| GET | `/v1/accounts/:id` | Detail account by ID |
| GET | `/v1/profiles` | List profiles contract |
| GET | `/v1/profiles/:id` | Detail profile by ID |
| GET | `/v1/followers/self` | Followers akun configured/self |
| GET | `/v1/followers/users/:username` | Followers by username |
| GET | `/v1/following/self` | Following akun configured/self |
| GET | `/v1/following/users/:username` | Following by username |
| POST | `/v1/actions/follow/from-username` | Follow action dry-run |
| POST | `/v1/actions/unfollow/from-username` | Unfollow action dry-run |
| GET | `/v1/photos/users/:username` | Photos by username |
| GET | `/v1/feeds/users/:username` | Feeds by username |
| GET | `/v1/statuses/users/:username` | Statuses by username |
| GET | `/v1/posts` | List posts contract |
| GET | `/v1/posts/:id` | Detail post by Post ID |
| GET | `/v1/posts/by-link?link=<url>` | Detail post by Link |
| GET | `/v1/posts?link=<url>` | Alias detail post by Link |
| GET | `/v1/reels` | List reels contract |
| GET | `/v1/media` | List media contract |
| POST | `/v1/publish/media` | Publish media dry-run |
| POST | `/v1/publish/reel` | Publish reel dry-run |
| GET | `/v1/comments` | List comments contract |
| POST | `/v1/comments/:id/reply` | Reply comment dry-run |
| GET | `/v1/mentions` | List mentions contract |
| GET | `/v1/hashtags/media` | Hashtag media contract |
| GET | `/v1/insights` | Insights contract |
| GET | `/v1/conversations` | Conversations contract |
| GET | `/v1/messages` | Messages contract |
| POST | `/v1/messages/send` | Send message dry-run |

## Query parameters

| Parameter | Type | Default | Keterangan |
|---|---|---:|---|
| `limit` | number | `12` | Maksimal mengikuti `MAX_FEED_LIMIT` |
| `cursor` | string | `null` | Cursor pagination |
| `username` | string | optional | Filter username untuk list endpoint tertentu |
| `q` | string | optional | Search/filter generic |
| `tag` | string | optional | Hashtag media |
| `postId` | string | optional | Filter comments/insights by post ID |
| `conversationId` | string | optional | Filter messages by conversation |
| `link` / `url` | string | optional | Detail post by link |
| `source` | enum | `auto` | `auto`, `official`, `scraper` |
| `refresh` | boolean | `false` | Bypass cache pada endpoint yang memakai cache |

## Headers

Production dengan API key:

```http
X-API-Key: your-secret-api-key
X-Request-ID: optional-request-id
```

## Body examples

### Follow from username

```json
{
  "targetUsername": "kakrusliandika"
}
```

### Unfollow from username

```json
{
  "targetUsername": "kakrusliandika"
}
```

### Publish media

```json
{
  "mediaUrl": "https://example.com/photo.jpg",
  "caption": "Caption demo"
}
```

### Publish reel

```json
{
  "mediaUrl": "https://example.com/reel.mp4",
  "caption": "Caption demo"
}
```

### Reply comment

```json
{
  "text": "Terima kasih"
}
```

### Send message

```json
{
  "recipientUsername": "kakrusliandika",
  "message": "Halo"
}
```

## Notes

Endpoint POST adalah dry-run by default. Route sudah siap kontrak, validasi, rate limit, API key, dan response envelope. Hubungkan adapter resmi bila ingin mengubahnya menjadi operasi nyata.
