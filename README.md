# TenRusl Instagram API Node.js v3 — Fullpower UltimateGod Edition

![Node.js](https://img.shields.io/badge/Node.js-24%20LTS-22c55e?logo=node.js&logoColor=white)
![Compatibility](https://img.shields.io/badge/Compatible-Node.js%2022-84cc16?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-111827?logo=express&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-0ea5e9?logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-ready-326ce5?logo=kubernetes&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

**TenRusl Instagram API Node.js v3** adalah refactor final berbasis Express untuk kontrak endpoint Instagram-style yang lengkap, health/readiness/liveness/metrics, deployment multi-platform, dan struktur yang siap dikembangkan memakai adapter resmi.

Implementasi ini sengaja memakai **safe adapter boundary** untuk endpoint yang bersifat aksi tulis seperti follow, unfollow, publish, reply, dan send message. Route tersedia dan respons kontrak aktif, tetapi operasi tulis default berjalan sebagai **dry-run** agar aman untuk development, audit, dan deployment awal. Untuk produksi nyata, hubungkan provider resmi yang sesuai izin akun dan platform.

## Runtime target

| Kebutuhan | Nilai |
|---|---|
| Node runtime utama | **Node.js 24 LTS** |
| Node compatibility | **Node.js 22** |
| Package manager | npm 10+ |
| Framework API | Express 5 |
| Format module | ES Module |
| Default port | `3000` |

## Fitur utama

- Semua endpoint yang diminta tersedia di prefix **`/v1`**.
- Alias kompatibilitas juga tersedia di **`/api/v1`**.
- Endpoint legacy tetap dipertahankan: `/api/v1/instagram/:username` dan `/api/instagram/:username`.
- Health check lengkap: `/health`, `/ready`, `/live`, `/metrics`.
- Metrics Prometheus text dan opsi JSON: `/metrics?format=json`.
- Request ID otomatis via `X-Request-ID`.
- Security middleware: Helmet, CORS, body limit, compression.
- API key optional untuk production: `X-API-Key`.
- Rate limit public API.
- Cache LRU untuk endpoint legacy Instagram feed.
- Safe dry-run untuk operasi tulis.
- Test route coverage untuk seluruh endpoint target.
- Deployment template untuk Docker, Cloudflare, GitHub Actions, Google Cloud, AWS, Heroku, Render, Railway, Vercel, Netlify, VPS, Kubernetes, dan hybrid multi-cloud.

## Struktur project

```txt
.
├─ src/
│  ├─ app.js
│  ├─ server.js
│  ├─ config/
│  │  ├─ constants.js
│  │  └─ env.js
│  ├─ controllers/
│  │  ├─ instagram.controller.js
│  │  └─ v1.controller.js
│  ├─ middlewares/
│  ├─ routes/
│  │  ├─ health.routes.js
│  │  ├─ instagram.routes.js
│  │  └─ v1.routes.js
│  ├─ services/
│  │  ├─ instagram-v1.service.js
│  │  ├─ instagram.service.js
│  │  ├─ metrics.service.js
│  │  └─ ...
│  ├─ serverless/
│  ├─ tests/
│  │  ├─ cache.test.js
│  │  ├─ health.test.js
│  │  ├─ validator.test.js
│  │  └─ v1-routes.test.js
│  ├─ utils/
│  └─ validators/
│     ├─ instagram.validator.js
│     └─ v1.validator.js
├─ cloudflare/worker/
├─ deploy/
│  ├─ aws/
│  ├─ google-cloud/
│  ├─ nginx/
│  ├─ systemd/
│  └─ vps/
├─ docker/
├─ docs/
├─ k8s/
├─ netlify/functions/
├─ public/
├─ .github/workflows/
├─ Dockerfile
├─ Procfile
├─ app.yaml
├─ cloudbuild.yaml
├─ docker-compose.yml
├─ netlify.toml
├─ railway.json
├─ render.yaml
├─ vercel.json
├─ package.json
└─ README.md
```

## Instalasi lokal

```bash
npm install
cp .env.example .env
npm run dev
```

Cek server:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/ready
curl http://localhost:3000/live
curl http://localhost:3000/metrics
```

Jalankan validasi:

```bash
npm run check
npm test
npm run doctor
```

## Environment penting

```env
APP_MODE=official
NODE_ENV=production
PORT=3000
APP_NAME=TenRusl Instagram API
APP_BASE_URL=https://api.example.com
LOG_LEVEL=info

CORS_ORIGIN=https://example.com
API_KEY_ENABLED=true
API_KEY=replace_with_32_plus_character_random_secret

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=60

DEFAULT_FEED_LIMIT=12
MAX_FEED_LIMIT=35
CACHE_ENABLED=true
CACHE_TTL_SECONDS=900
CACHE_MAX_ITEMS=500

SCRAPER_ENABLED=false

META_API_ENABLED=false
META_API_VERSION=v23.0
META_ACCESS_TOKEN=
META_IG_USER_ID=
META_USERNAME=
META_TIMEOUT_MS=15000
```

## Health, readiness, liveness, metrics

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/health` | Health check ringan untuk uptime service |
| GET | `/ready` | Readiness check untuk cache, scraper queue, dan konfigurasi official adapter |
| GET | `/live` | Liveness probe untuk container/Kubernetes |
| GET | `/metrics` | Metrics format Prometheus text |
| GET | `/metrics?format=json` | Metrics runtime dalam format JSON |
| GET | `/health/ready` | Backward-compatible readiness path |
| GET | `/health/live` | Backward-compatible liveness path |
| GET | `/health/metrics` | Backward-compatible metrics path |

## Endpoint v1 lengkap

Semua endpoint utama tersedia pada prefix `/v1`. Prefix `/api/v1` juga dipasang sebagai alias agar mudah dipakai pada gateway lama.

| Method | Endpoint | Status implementasi |
|---|---|---|
| GET | `/v1/accounts` | Route aktif, list contract |
| GET | `/v1/accounts/:id` | Route aktif, detail by ID |
| GET | `/v1/profiles` | Route aktif, list contract |
| GET | `/v1/profiles/:id` | Route aktif, detail by ID |
| GET | `/v1/followers/self` | Route aktif, by configured/self username |
| GET | `/v1/followers/users/:username` | Route aktif, by username |
| GET | `/v1/following/self` | Route aktif, by configured/self username |
| GET | `/v1/following/users/:username` | Route aktif, by username |
| POST | `/v1/actions/follow/from-username` | Route aktif, safe dry-run |
| POST | `/v1/actions/unfollow/from-username` | Route aktif, safe dry-run |
| GET | `/v1/photos/users/:username` | Route aktif, by username |
| GET | `/v1/feeds/users/:username` | Route aktif, by username |
| GET | `/v1/statuses/users/:username` | Route aktif, by username |
| GET | `/v1/posts` | Route aktif, list contract |
| GET | `/v1/posts/:id` | Route aktif, detail post by Post ID |
| GET | `/v1/posts/by-link?link=<instagram-url>` | Route aktif, detail post by Link |
| GET | `/v1/posts?link=<instagram-url>` | Alias detail post by Link |
| GET | `/v1/reels` | Route aktif, list contract |
| GET | `/v1/media` | Route aktif, list contract |
| POST | `/v1/publish/media` | Route aktif, safe dry-run |
| POST | `/v1/publish/reel` | Route aktif, safe dry-run |
| GET | `/v1/comments` | Route aktif, list contract |
| POST | `/v1/comments/:id/reply` | Route aktif, safe dry-run |
| GET | `/v1/mentions` | Route aktif, list contract |
| GET | `/v1/hashtags/media` | Route aktif, list contract |
| GET | `/v1/insights` | Route aktif, list contract |
| GET | `/v1/conversations` | Route aktif, list contract |
| GET | `/v1/messages` | Route aktif, list contract |
| POST | `/v1/messages/send` | Route aktif, safe dry-run |

## Endpoint by username

```bash
curl "http://localhost:3000/v1/followers/users/kakrusliandika?limit=12"
curl "http://localhost:3000/v1/following/users/kakrusliandika?limit=12"
curl "http://localhost:3000/v1/photos/users/kakrusliandika?limit=12"
curl "http://localhost:3000/v1/feeds/users/kakrusliandika?limit=12"
curl "http://localhost:3000/v1/statuses/users/kakrusliandika?limit=12"
```

## Get Detail Post by Post ID

```bash
curl "http://localhost:3000/v1/posts/POST_ID_OR_SHORTCODE"
```

Contoh respons:

```json
{
  "success": true,
  "version": "v1",
  "resource": "posts",
  "operation": "detail-by-post-id",
  "id": "POST_ID_OR_SHORTCODE",
  "data": {
    "id": "POST_ID_OR_SHORTCODE",
    "shortcode": "POST_ID_OR_SHORTCODE",
    "status": "adapter-required"
  }
}
```

## Get Detail Post by Link

Dua cara didukung:

```bash
curl "http://localhost:3000/v1/posts/by-link?link=https%3A%2F%2Fwww.instagram.com%2Fp%2FCODE123%2F"
curl "http://localhost:3000/v1/posts?link=https%3A%2F%2Fwww.instagram.com%2Freel%2FCODE123%2F"
```

Link yang valid harus berbentuk:

```txt
https://www.instagram.com/p/<shortcode>/
https://www.instagram.com/reel/<shortcode>/
https://www.instagram.com/tv/<shortcode>/
```

## POST action examples

Semua action POST aktif sebagai dry-run default.

```bash
curl -X POST http://localhost:3000/v1/actions/follow/from-username \
  -H "Content-Type: application/json" \
  -d '{"targetUsername":"kakrusliandika"}'
```

```bash
curl -X POST http://localhost:3000/v1/messages/send \
  -H "Content-Type: application/json" \
  -d '{"recipientUsername":"kakrusliandika","message":"Halo"}'
```

```bash
curl -X POST http://localhost:3000/v1/publish/media \
  -H "Content-Type: application/json" \
  -d '{"mediaUrl":"https://example.com/photo.jpg","caption":"Demo"}'
```

## API key production

Aktifkan di `.env`:

```env
API_KEY_ENABLED=true
API_KEY=replace_with_32_plus_character_random_secret
```

Kirim header:

```bash
curl http://localhost:3000/v1/accounts \
  -H "X-API-Key: replace_with_32_plus_character_random_secret"
```

## Response envelope

Sukses:

```json
{
  "success": true,
  "version": "v1",
  "resource": "accounts",
  "operation": "list",
  "provider": {
    "mode": "official",
    "adapter": "safe-placeholder",
    "officialConfigured": false,
    "writeOperations": "dry-run"
  },
  "count": 1,
  "data": [],
  "generatedAt": "2026-06-21T00:00:00.000Z"
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Parameter query tidak valid."
  }
}
```

## Legacy Instagram feed endpoint

Endpoint lama tetap ada:

```bash
curl "http://localhost:3000/api/v1/instagram/kakrusliandika?limit=12"
curl "http://localhost:3000/api/instagram/kakrusliandika?limit=12"
```

Mode legacy:

| Mode | Keterangan |
|---|---|
| `official` | Menggunakan konfigurasi Meta API untuk akun yang dikonfigurasi |
| `scraper` | Optional controlled/internal Puppeteer mode |
| `hybrid` | Official-first, fallback optional |

Untuk production jangka panjang, gunakan official adapter dan izin yang sesuai.

## Docker

Build:

```bash
docker build -t tenrusl-instagram-api:latest .
```

Run:

```bash
docker run --rm --env-file .env -p 3000:3000 tenrusl-instagram-api:latest
```

Docker Compose:

```bash
docker compose up -d --build
curl http://localhost:3000/health
```

Image default memakai Node.js 24 dan tidak menginstall optional Puppeteer. Untuk mode internal yang membutuhkan Puppeteer, gunakan:

```bash
docker build -f docker/Dockerfile.scraper -t tenrusl-instagram-api:scraper .
```

## GitHub Actions

Workflow tersedia:

```txt
.github/workflows/ci.yml
.github/workflows/docker-ghcr.yml
```

CI menjalankan Node.js 22 dan 24, syntax check, dan unit test. Docker workflow publish image ke GitHub Container Registry ketika push ke branch utama atau tag `v*`.

## Vercel

File tersedia: `vercel.json` dan `src/serverless/vercel.js`.

Environment yang disarankan:

```env
NODE_ENV=production
APP_MODE=official
SCRAPER_ENABLED=false
API_KEY_ENABLED=true
API_KEY=...
CORS_ORIGIN=https://your-domain.example
```

Deploy:

```bash
vercel --prod
```

## Netlify

File tersedia: `netlify.toml` dan `netlify/functions/api.js`.

Netlify adapter bersifat lightweight contract adapter. Untuk full Express middleware, gunakan Docker/VPS/Render/Railway/Kubernetes.

Deploy:

```bash
netlify deploy --prod
```

## Cloudflare Worker

File tersedia:

```txt
cloudflare/worker/src/index.js
cloudflare/worker/wrangler.toml.example
```

Deploy:

```bash
cd cloudflare/worker
cp wrangler.toml.example wrangler.toml
wrangler deploy
```

Untuk menjadikan Worker sebagai gateway ke origin Node full service:

```toml
[vars]
ORIGIN_API_URL = "https://api.example.com"
```

Tambahkan secret origin bila API key aktif:

```bash
wrangler secret put ORIGIN_API_KEY
```

## Google Cloud

Pilihan 1 — App Engine:

```bash
gcloud app deploy app.yaml
```

Pilihan 2 — Cloud Run dengan Docker:

```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/tenrusl-instagram-api
gcloud run deploy tenrusl-instagram-api \
  --image gcr.io/PROJECT_ID/tenrusl-instagram-api \
  --platform managed \
  --region asia-southeast2 \
  --allow-unauthenticated \
  --port 3000
```

Gunakan environment dari `deploy/google-cloud/cloud-run.env.example`.

## AWS

Pilihan ringan: AWS App Runner memakai `deploy/aws/apprunner.yaml`.

Pilihan container production: ECR + ECS Fargate memakai `deploy/aws/ecs-task-definition.example.json`.

Alur umum:

```bash
aws ecr create-repository --repository-name tenrusl-instagram-api
docker build -t tenrusl-instagram-api .
docker tag tenrusl-instagram-api:latest <account-id>.dkr.ecr.<region>.amazonaws.com/tenrusl-instagram-api:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/tenrusl-instagram-api:latest
```

## Heroku

File tersedia: `Procfile`.

```bash
heroku create tenrusl-instagram-api
heroku stack:set heroku-24
heroku config:set NODE_ENV=production APP_MODE=official SCRAPER_ENABLED=false API_KEY_ENABLED=true API_KEY=replace_with_secret
heroku git:remote -a tenrusl-instagram-api
git push heroku main
```

## Render

File tersedia: `render.yaml`.

Langkah:

1. Push repo ke GitHub.
2. Import Blueprint di Render.
3. Isi secret `API_KEY` dan `CORS_ORIGIN`.
4. Deploy.

Health check path: `/health`.

## Railway

File tersedia: `railway.json`.

```bash
railway login
railway init
railway up
railway variables set NODE_ENV=production APP_MODE=official SCRAPER_ENABLED=false API_KEY_ENABLED=true API_KEY=replace_with_secret
```

Health check path: `/health`.

## VPS umum

Dengan Docker Compose:

```bash
git clone https://github.com/kakrusliandika/TenRusl-InstagramApiNodeJs.git
cd TenRusl-InstagramApiNodeJs
cp .env.production.example .env
nano .env
docker compose up -d --build
curl http://127.0.0.1:3000/health
```

Script helper:

```bash
bash deploy/vps/install.sh
```

Nginx dan systemd sample tetap tersedia di:

```txt
deploy/nginx/tenrusl-instagram-api.conf
deploy/systemd/tenrusl-instagram-api.service
```

## Kubernetes

File tersedia:

```txt
k8s/deployment.yaml
k8s/service.yaml
k8s/ingress.yaml
k8s/secret.example.yaml
```

Deploy:

```bash
kubectl apply -f k8s/secret.example.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl rollout status deployment/tenrusl-instagram-api
```

Probe:

| Probe | Path |
|---|---|
| readinessProbe | `/ready` |
| livenessProbe | `/live` |

## Hybrid multi-cloud pattern

Rekomendasi arsitektur:

```txt
Client
  ↓
Cloudflare Worker / CDN Gateway
  ↓
Primary API: Google Cloud Run / Render / Railway / Kubernetes
  ↓
Fallback API: VPS Docker / AWS ECS
  ↓
Observability: /metrics + platform logs
```

Strategi:

1. Pasang DNS di Cloudflare.
2. Cloudflare Worker menerima request `/v1/*`.
3. Worker proxy ke origin utama melalui `ORIGIN_API_URL`.
4. Jika ingin failover manual, ubah `ORIGIN_API_URL` ke origin cadangan.
5. Container platform memakai `/health`, `/ready`, `/live` untuk probe.
6. Metrics di-scrape dari `/metrics` oleh Prometheus-compatible collector.

## Audit refactor summary

| Area | Sebelum | Sesudah |
|---|---|---|
| Health | `/health`, `/health/ready` | `/health`, `/ready`, `/live`, `/metrics`, plus `/health/*` aliases |
| API prefix | `/api/v1/instagram` | `/v1/*`, `/api/v1/*`, legacy tetap ada |
| Endpoint coverage | Feed legacy | Semua endpoint target tersedia |
| POST support | CORS hanya GET | CORS GET + POST |
| Metrics | Belum ada endpoint utama | Prometheus + JSON snapshot |
| Runtime | Node >=20 | Node 24 LTS utama, Node 22 kompatibel |
| Deploy | Docker/Vercel/Netlify/Cloudflare dasar | Docker, Cloudflare, GitHub, Google Cloud, AWS, Heroku, Render, Railway, Vercel, Netlify, VPS, Kubernetes, hybrid |
| Safety | Scraper legacy ada | V1 action memakai safe dry-run dan adapter boundary |

## Checklist final sebelum deploy publik

- Ganti `API_KEY` dengan secret panjang.
- Set `API_KEY_ENABLED=true` untuk production.
- Batasi `CORS_ORIGIN` ke domain sendiri.
- Gunakan `APP_MODE=official` untuk public production.
- Biarkan `SCRAPER_ENABLED=false` pada serverless/public hosting.
- Simpan token provider di secret manager platform, bukan di Git.
- Jalankan `npm run check`, `npm test`, dan `npm run doctor`.
- Cek `/health`, `/ready`, `/live`, `/metrics` setelah deploy.

## License

MIT — lihat `LICENSE`.
