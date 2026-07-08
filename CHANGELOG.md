<!-- Changelog — catatan rilis resmi TenRusl Instagram API Gateway. -->
<!-- Format: Keep a Changelog (https://keepachangelog.com/id/1.1.0/) -->
<!-- Versi: Semantic Versioning (https://semver.org/id/) -->

# Changelog

Catatan rilis resmi untuk **TenRusl Instagram API Gateway Node.js**.

## [Unreleased]

Perubahan yang belum dirilis.

---

## [1.0.0] — Rilis Stabil Pertama

Rilis produksi pertama yang stabil. API gateway Express untuk Instagram dengan provider adapter, validasi input, observability, test suite, dan deployment multi-platform. Seluruh naratif menggunakan bahasa Indonesia; kode, endpoint, dan istilah teknis tetap dalam bahasa Inggris.

### Ditambahkan

#### Core

- **Express 5.1.0** sebagai framework HTTP utama.
- **ESM** (`"type": "module"`) — semua module menggunakan `import`/`export`.
- **Node.js 22+** — engine requirement (`>=22 <25`), kompatibel dengan Node.js 24 LTS.
- **Standard response envelope** — `successEnvelope` dan `errorEnvelope` untuk semua response.
- **Zod validation** — schema validasi input di `src/schemas/` untuk semua endpoint.

#### Provider

- **Provider adapter** — 4 provider: `mock`, `official`, `public`, `authorized`.
- **Provider factory** — `createInstagramProvider` dengan cache instance via `getInstagramProvider`.
- **Provider contract** — 19 method Instagram di `INSTAGRAM_PROVIDER_METHODS` dengan validasi kepatuhan `assertInstagramProviderContract`.
- **Capabilities** — `/capabilities` endpoint menampilkan mode provider aktif dan dukungan operasi aman.
- **Mock provider** — full contract testing tanpa credential, semua write operation dry-run.
- **Official provider** — Meta/Instagram Graph API untuk akun Business/Creator.
- **Public provider** — proxy data publik dari upstream compliant, read-only.
- **Authorized provider** — data milik sendiri, disabled by default, butuh review consent.

#### API Endpoints

- **System**: `/health`, `/ready`, `/live`, `/metrics`, `/capabilities`.
- **V1 routes**: account, profile, followers, following, media, comment, discovery, insight, messaging, publish, action.
- **Legacy alias**: `/api/v1/instagram/:identifier`.

#### Keamanan

- **Helmet** — security headers (CSP, X-Frame-Options, X-Content-Type-Options, HSTS).
- **CORS** — origin configurable via `CORS_ORIGIN`.
- **API key middleware** — optional authentication via `X-API-Key` header, timing-safe comparison.
- **Rate limiting** — per-IP bucket, window time, cleanup otomatis, header `X-RateLimit-*` dan `Retry-After`. Tetap aktif di production.
- **Request ID** — `X-Request-Id` unik per request untuk tracing.
- **Body limit** — default `256kb`, configurable via `BODY_LIMIT`.
- **Input sanitization** — `sanitizeObject` dan `redactSensitive` untuk redaksi data sensitif di log.
- **Error handler global** — stack trace hanya di log di production, tidak ke response body.
- **Not-found handler** — 404 dengan standard error envelope.

#### Observability

- **Prometheus metrics** — `/metrics` endpoint dengan counter request, duration, dan status.
- **Health probes** — `/health`, `/ready`, `/live` untuk platform probes dan monitoring.
- **Structured logging** — configurable level via `LOG_LEVEL`.

#### Test

- **Test suite** — `node:test` (built-in Node.js test runner) dengan 7 file test.
- **Test coverage**: health, validation, v1-routes, gateway-contract, providers, security, api-smoke.
- **Global test helper** — `src/tests/test-client.js` dengan `withServer`, `requestJson`, `assertEnvelope`, `assertErrorEnvelope`.
- **Smoke test** — `scripts/api-smoke.js` dengan mode `get`, `post`, `api`.
- **Doctor script** — `scripts/doctor.js` validasi versi Node.js, provider, file wajib, deployment folders.
- **Lint script** — `scripts/lint-basic.js` pemeriksaan pola umum.

#### Deployment

- **Dockerfile** — multi-stage build, `node:24-bookworm-slim`, `npm ci --omit=dev`, non-root user, `HEALTHCHECK`.
- **docker-compose.yml** — single-service compose dengan env injection.
- **Procfile** — Heroku-style `web: npm start`.
- **render.yaml** — Render deployment dengan `sync: false` untuk secret.
- **railway.json** — Railway deployment dengan health check.
- **vercel.json** — Vercel serverless via `src/serverless/vercel.js`.
- **netlify.toml** — Netlify Functions via `netlify/functions/api.js`.
- **app.yaml** — Google App Engine.
- **cloudbuild.yaml** — Google Cloud Build template.
- **Kubernetes** — Deployment, Service, Ingress, ConfigMap, Secret example.
- **VPS** — systemd service + nginx config.
- **Cloudflare Worker** — proxy worker.
- **Hybrid multi-cloud** — template arsitektur hybrid.
- **CI pipeline** — `.github/workflows/ci.yml` — `npm ci`, `check`, `lint`, `test`, `doctor`.

#### Dokumentasi

- **README.md** — ringkasan fitur, provider mode, quick start, arsitektur.
- **CONTRIBUTING.md** — alur kontribusi dan standar commit.
- **SECURITY.md** — kebijakan keamanan dan production checklist.
- **CHANGELOG.md** — catatan rilis ini.
- **docs/** — API, Architecture, Deployment, Environment, Providers, Security.
- **deploy/*/README.md** — panduan per platform.
- **Blok komentar bahasa Indonesia** di semua file `.js` source code.

### Infrastruktur

- **Zero-dependency production** — hanya 6 dependency: `cors`, `dotenv`, `express`, `helmet`, `zod`, `serverless-http`.

---

## Kategori Perubahan

Mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.1.0/):

| Kategori | Keterangan |
|----------|------------|
| **Ditambahkan** | Fitur baru. |
| **Diubah** | Perubahan pada fitur existing. |
| **Dihapus** | Fitur yang dihapus. |
| **Diperbaiki** | Bug fix. |
| **Keamanan** | Perubahan terkait keamanan. |
| **Deprecated** | Fitur yang akan dihapus di versi mendatang. |
