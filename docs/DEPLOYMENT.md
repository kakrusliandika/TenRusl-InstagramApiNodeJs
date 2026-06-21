# 🚀 Deployment Guide

## 1. VPS Ubuntu + Docker — recommended for scraper production

```bash
git clone https://github.com/kakrusliandika/TenRusl-InstagramApiNodeJs.git
cd TenRusl-InstagramApiNodeJs
cp .env.production.example .env
nano .env
docker compose up -d --build
curl http://127.0.0.1:3000/health
```

Gunakan Cloudflare DNS/CDN di depan VPS.

## 2. Vercel — recommended for official mode only

Environment:

```env
APP_MODE=official
SCRAPER_ENABLED=false
META_API_ENABLED=true
META_ACCESS_TOKEN=...
META_IG_USER_ID=...
META_USERNAME=kakrusliandika
```

Jika ingin menghindari Puppeteer install di serverless, set install command di dashboard:

```bash
npm install --omit=optional
```

## 3. Netlify — official function adapter

Environment:

```env
META_ACCESS_TOKEN=...
META_IG_USER_ID=...
META_USERNAME=kakrusliandika
META_API_VERSION=v23.0
MAX_FEED_LIMIT=35
```

Endpoint:

```txt
/api/v1/instagram/kakrusliandika
```

## 4. Cloudflare Worker — gateway / official / proxy

```bash
cd cloudflare/worker
cp wrangler.toml.example wrangler.toml
wrangler secret put META_ACCESS_TOKEN
wrangler secret put META_IG_USER_ID
wrangler deploy
```

Untuk proxy ke VPS scraper:

```toml
[vars]
APP_MODE = "hybrid"
SCRAPER_API_URL = "https://api.example.com"
```

Tambahkan secret:

```bash
wrangler secret put SCRAPER_API_KEY
```

## 5. GitHub Actions + GHCR

Workflow sudah tersedia:

- `.github/workflows/ci.yml`
- `.github/workflows/docker-ghcr.yml`

Push ke branch `main` atau `master`, lalu image Docker akan bisa dipublish ke GitHub Container Registry.
