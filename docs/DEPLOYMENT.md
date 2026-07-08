<!-- Dokumen ini berisi panduan deployment ke berbagai platform. -->
<!-- Command, config key, platform name, dan env key tetap dalam bahasa Inggris. -->

# Panduan Deployment

## Kepemilikan File Deployment

<!-- Tabel ini menunjukkan file konfigurasi root yang aktif dan fungsinya. -->

File konfigurasi root hanya disimpan ketika platform atau tooling umum mengharapkannya berada di root repository.

| File | Kategori | Fungsi |
|---|---|---|
| `Dockerfile` | Konfigurasi root aktif | Build image container. |
| `docker-compose.yml` | Konfigurasi root aktif | Orchestration container lokal/staging. |
| `.github/workflows/ci.yml` | Konfigurasi root aktif | Sumber kebenaran CI. |
| `Procfile` | Konfigurasi root aktif | Perintah proses gaya Heroku. |
| `render.yaml` | Konfigurasi root aktif | Layanan terkelola Render. |
| `railway.json` | Konfigurasi root aktif | Pengaturan deploy Railway. |
| `vercel.json` | Konfigurasi root aktif | Routing preview Vercel ke `src/serverless/vercel.js`. |
| `netlify.toml` | Konfigurasi root aktif | Routing preview Netlify ke `netlify/functions/api.js`. |
| `app.yaml` | Konfigurasi root aktif | Konfigurasi layanan Google App Engine. Ganti placeholder secret sebelum digunakan. |
| `cloudbuild.yaml` | Konfigurasi root aktif | Template image Google Cloud Build. |
| `deploy/*` | Template opsional | Contoh dan catatan platform. Ganti placeholder sebelum production. |

Adapter serverless dan edge opsional bukan merupakan runtime lokal. Runtime lokal dan container dimulai dari `src/server.js`.

## Matriks Deployment

<!-- Tabel ini menunjukkan status dan kesesuaian setiap platform deployment. -->

| Platform | File | Status | Cocok untuk | Env wajib |
|---|---|---|---|---|
| Docker image | `Dockerfile`, `.dockerignore` | Aktif | Runtime container portabel | Runtime env di-inject oleh platform atau `--env-file`; jangan bake secret ke dalam image. |
| Docker Compose | `docker-compose.yml` | Aktif lokal/staging | Staging lokal dengan container mirip production | `.env`, `NODE_ENV`, `IG_PROVIDER`, `API_KEY_ENABLED`, `CORS_ORIGIN`, rate limit, body limit, provider timeout. |
| GitHub Actions | `.github/workflows/ci.yml` | Aktif CI | Validasi PR dan push | Tidak ada secret production; menjalankan cek mock/provider-safe lokal. |
| App Engine | `app.yaml` | Template aktif | Google App Engine | `NODE_ENV`, `IG_PROVIDER`, `API_KEY_ENABLED`, `API_KEY`, `CORS_ORIGIN`, rate limit, provider timeout, env provider terpilih. |
| Cloud Build | `cloudbuild.yaml` | Template image aktif | Build image Google | Hanya nilai project/image saat build; runtime secret dari target deploy. |
| Cloud Run | `deploy/google-cloud/cloud-run.yaml` | Template opsional | Container production/preview di Google Cloud | Sama dengan runtime env App Engine; gunakan Secret Manager untuk `API_KEY`, `META_ACCESS_TOKEN`, `META_IG_USER_ID`. |
| AWS App Runner | `deploy/aws/apprunner.yaml` | Template opsional | Container terkelola AWS | Sama dengan runtime env App Engine; gunakan AWS Secrets Manager untuk secret. |
| Render | `render.yaml` | Layanan terkelola aktif | Web service terkelola | Env non-secret di YAML; `sync:false` untuk `API_KEY`, token/id Meta, dan authorized token. |
| Railway | `railway.json` | Pengaturan deploy aktif | Deploy Node.js cepat | Set env di Railway dashboard/variables; `railway.json` hanya mengatur build/start/probe. |
| Heroku-style | `Procfile` | Perintah proses aktif | Platform kompatibel Heroku | Set env melalui config vars platform; `Procfile` hanya mengatur perintah proses. |
| Vercel | `vercel.json`, `src/serverless/vercel.js` | Preview serverless | Preview PR/demo | Env preview non-secret yang aman di JSON; set secret di Vercel Project Settings jika mengaktifkan auth/data live provider. |
| Netlify | `netlify.toml`, `netlify/functions/api.js` | Preview serverless | Preview PR/demo | Env preview non-secret yang aman di TOML; set secret di Netlify UI jika diperlukan. |
| Kubernetes | `deploy/kubernetes/*.yaml` | Template production opsional | Deploy container multi-instance | ConfigMap untuk non-secret, Secret/external secret manager untuk `API_KEY`, token/id Meta, authorized token. |
| VPS | `deploy/vps/*` | Template production opsional | Deploy VM/systemd/nginx | Env systemd untuk non-secret; `/etc/tenrusl-instagram-api/secrets.env` atau secret manager untuk secret. |
| Cloudflare Worker | `deploy/cloudflare/worker.js` | Template edge proxy | Reverse proxy/facade API | `ORIGIN_BASE_URL` harus mengarah ke origin API yang sudah di-deploy. |

Env runtime umum di seluruh target deploy:

- `NODE_ENV`, `IG_PROVIDER`, `API_KEY_ENABLED`, `API_KEY`, `CORS_ORIGIN`
- `RATE_LIMIT_ENABLED`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`
- `BODY_LIMIT`, `PROVIDER_REQUEST_TIMEOUT_MS`
- Env khusus provider: `META_GRAPH_BASE_URL`, `META_API_VERSION`, `META_ACCESS_TOKEN`, `META_IG_USER_ID`, `PUBLIC_DATA_ENABLED`, `PUBLIC_DATA_UPSTREAM_URL`, `AUTHORIZED_PROVIDER_ENABLED`, `AUTHORIZED_SESSION_TOKEN`, `AUTHORIZED_INTEGRATION_REVIEWED`

Jangan masukkan nilai secret yang sebenarnya ke dalam file deployment yang di-commit. Gunakan secret manager platform, dashboard variable, Kubernetes Secret, atau file environment VPS yang dimiliki root di luar git.

## Lokal

<!-- Instruksi untuk menjalankan project di mesin lokal. -->

Cocok untuk development dan audit cepat. Default lokal menggunakan `IG_PROVIDER=mock`, sehingga tidak diperlukan credential Instagram.

```bash
npm install
cp .env.local.example .env
npm run check
npm test
npm run doctor
npm run dev
```

PowerShell:

```powershell
npm install
Copy-Item .env.local.example .env
npm run check
npm test
npm run doctor
npm run dev
```

CMD:

```bat
npm install
copy .env.local.example .env
npm run check
npm test
npm run doctor
npm run dev
```

Pengecekan smoke lokal:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/ready
curl http://localhost:3000/capabilities
curl http://localhost:3000/v1/get/profiles/tenrusl
curl "http://localhost:3000/v1/get/posts/by-link?link=https://www.instagram.com/p/ABC123def45/"
curl -X POST http://localhost:3000/v1/comments/reply \
  -H "content-type: application/json" \
  -d '{"id":"comment_123","text":"Local dry-run reply","dryRun":true}'
```

Health check: `/health`. Readiness check: `/ready`.

### Troubleshooting Lokal

<!-- Solusi untuk masalah umum saat menjalankan di lokal. -->

| Masalah | Solusi |
|---|---|
| Port `3000` sudah digunakan | Set `PORT=3001` di `.env`. |
| API key `401` | Default lokal adalah `API_KEY_ENABLED=false`; jika diaktifkan, kirim `x-api-key` atau bearer auth. |
| Rate limit `429` | Tunggu reset atau sesuaikan `RATE_LIMIT_MAX` di `.env` lokal. |
| Provider official tidak terkonfigurasi | Gunakan `IG_PROVIDER=mock` di lokal, atau isi env Meta yang diperlukan. |
| CORS diblokir | Tambahkan origin frontend kamu ke `CORS_ORIGIN`. |

## Docker

<!-- Instruksi deploy menggunakan Docker. -->

Cocok untuk parity production dan platform container.

```bash
docker build -t tenrusl-instagram-api:production .
docker run --env-file .env -p 3000:3000 tenrusl-instagram-api:production
```

File: `Dockerfile`, `.dockerignore`.

Image Docker berjalan sebagai user non-root `node`. `.dockerignore` mengecualikan file secret lokal umum seperti `.env`, `.env.local`, dan `.env.production`; simpan secret yang sebenarnya di env runtime atau secret manager.

## Docker Compose

<!-- Instruksi deploy menggunakan Docker Compose untuk staging lokal. -->

Cocok untuk staging lokal.

```bash
cp .env.example .env
docker compose up --build
```

File: `docker-compose.yml`.

Gunakan `.env` untuk nilai staging lokal. File compose menyediakan default yang aman dan tidak menyertakan token yang sebenarnya.

## Cloudflare

<!-- Instruksi deploy Cloudflare Worker sebagai edge proxy. -->

Cocok sebagai edge proxy. `deploy/cloudflare/worker.js` adalah template reverse proxy, bukan runtime Express. Set `ORIGIN_BASE_URL` ke origin API sebelum deploy; worker mengembalikan `500` ketika origin tidak dikonfigurasi.

## GitHub Actions

<!-- Konfigurasi CI aktif. -->

Cocok untuk CI. File aktif: `.github/workflows/ci.yml`.

## Google Cloud

<!-- Instruksi deploy ke Google Cloud. -->

Cocok untuk container Cloud Run. `deploy/google-cloud/cloud-run.yaml` adalah template; ganti image, project, secret, dan `IG_PROVIDER`.

Root `app.yaml` untuk App Engine. Root `cloudbuild.yaml` adalah template image Cloud Build. Simpan token yang sebenarnya di Secret Manager atau config platform, bukan di YAML yang di-commit.

Build/start: image container, mulai `npm start`, port `3000`.

## AWS

<!-- Instruksi deploy ke AWS. -->

Cocok untuk App Runner atau ECS. `deploy/aws/apprunner.yaml` adalah template App Runner; adaptasi image, secret, dan provider sebelum deploy.

## Heroku

<!-- Instruksi deploy ke Heroku. -->

Cocok untuk deployment cepat. File: `Procfile`.

```bash
heroku config:set NODE_ENV=production IG_PROVIDER=mock
```

## Render

<!-- Instruksi deploy ke Render. -->

Cocok untuk web service terkelola. File: `render.yaml` dengan health check `/health`.

Isi nilai `sync:false` dari Render dashboard. Jangan commit nilai token yang sebenarnya.

## Railway

<!-- Instruksi deploy ke Railway. -->

Cocok untuk deploy Node.js cepat. File: `railway.json`.

Set runtime env di Railway Variables. `railway.json` sengaja hanya menyimpan pengaturan build, start, healthcheck, dan restart policy.

## Vercel

<!-- Instruksi deploy ke Vercel. -->

Cocok untuk preview serverless, bukan rekomendasi production utama untuk traffic API berkelanjutan. File aktif: `vercel.json`, yang mengarah ke adapter `src/serverless/vercel.js`. Simpan secret yang sebenarnya di Vercel Project Settings.

## Netlify

<!-- Instruksi deploy ke Netlify. -->

Cocok untuk preview serverless, bukan rekomendasi production utama untuk traffic API berkelanjutan. File aktif: `netlify.toml` dan `netlify/functions/api.js`. Simpan secret yang sebenarnya di environment variable Netlify.

## VPS

<!-- Instruksi deploy ke VPS. -->

Cocok untuk kontrol penuh. `deploy/vps/nginx.conf` dan `deploy/vps/systemd.service` adalah template; ganti domain, user, working directory, TLS, env, dan secret injection.

## Kubernetes

<!-- Instruksi deploy ke Kubernetes. -->

Cocok untuk skala dan multi-region. File `deploy/kubernetes/*.yaml` adalah template; ganti image, namespace, secret, resource limits, ingress host, dan TLS.

```bash
kubectl apply -f deploy/kubernetes/
```

Readiness: `/ready`, liveness: `/live`. Template deployment mencakup request dan limit CPU/memory; sesuaikan setelah load testing.

## Checklist Per Platform

<!-- Checklist yang harus dipenuhi untuk setiap platform sebelum deploy. -->

- **Docker**: build dari `Dockerfile`, pass env saat runtime, pastikan image berjalan sebagai non-root, dan cek `/health`.
- **Docker Compose**: copy `.env.example` ke `.env`, pertahankan `IG_PROVIDER=mock` untuk staging kecuali env provider sudah lengkap, lalu jalankan `docker compose up --build`.
- **Google/AWS/Render/Railway**: set runtime env di config platform, masukkan secret ke secret manager/dashboard platform, dan jadikan `/ready` sebagai gerbang deploy.
- **Kubernetes**: terapkan ConfigMap dan Secret/external secret terlebih dahulu, lalu Deployment/Service/Ingress; verifikasi probe dan resource limits.
- **VPS**: install Node atau jalankan container, konfigurasi systemd dan nginx, simpan secret di luar git, dan tambahkan TLS.
- **Vercel/Netlify**: gunakan sebagai preview kecuali kamu sudah meninjau batasan serverless dan perilaku cold-start untuk traffic kamu.
- **Cloudflare**: deploy hanya sebagai proxy setelah `ORIGIN_BASE_URL` mengarah ke origin API yang sehat.

## Hybrid Multi-Cloud

<!-- Arsitektur contoh untuk high availability multi-cloud. -->

Cocok untuk high availability. `deploy/hybrid-multicloud/README.md` adalah arsitektur contoh, bukan config otomatis. Gunakan image yang sama di Kubernetes primary, Cloud Run/AWS secondary, VPS fallback, dan edge DNS failover.

## Catatan Production

<!-- Hal-hal yang harus diperhatikan sebelum deploy ke production. -->

- Ganti semua placeholder domain, nama image, ID project, dan nilai secret.
- Pertahankan `METRICS_PUBLIC=false` dan `CAPABILITIES_PUBLIC=false` kecuali endpoint ini dilindungi upstream.
- Gunakan `IG_PROVIDER=official` untuk integrasi Business/Creator yang disetujui Meta secara resmi.
- Perlakukan `/ready` sebagai gerbang readiness deploy; provider non-mock harus dikonfigurasi dan bebas peringatan.
- Tambahkan rate limiter terdistribusi seperti Redis, kuota gateway platform, atau rate limit level WAF sebelum menjalankan beberapa instance API.
- Jangan perlakukan template `deploy/*` sebagai config production akhir tanpa review.