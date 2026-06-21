# 📡 API Reference

## GET `/api/v1/instagram/:username`

Mengambil feed Instagram berdasarkan mode aplikasi.

### Query

| Parameter | Default | Keterangan |
|---|---:|---|
| `limit` | `12` | Jumlah item, maksimal mengikuti `MAX_FEED_LIMIT` |
| `source` | `auto` | `auto`, `official`, atau `scraper` |
| `refresh` | `false` | Paksa bypass cache |

### Header production

```http
X-API-Key: your-secret-api-key
```

### Contoh

```bash
curl "http://localhost:3000/api/v1/instagram/kakrusliandika?limit=12"
```

### Response sukses

```json
{
  "success": true,
  "mode": "hybrid",
  "source": "official",
  "username": "kakrusliandika",
  "count": 12,
  "cached": false,
  "data": [],
  "generatedAt": "2026-06-21T00:00:00.000Z"
}
```

## GET `/health`

Health check ringan.

## GET `/health/ready`

Readiness check dengan status cache, mode, dan queue scraper.
