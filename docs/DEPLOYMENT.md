# Deployment Guide — TenRusl Instagram API v3

Runtime utama: Node.js 24 LTS. Compatibility: Node.js 22.

## Matrix deployment

| Target | File pendukung | Rekomendasi mode |
|---|---|---|
| Docker | `Dockerfile`, `docker-compose.yml` | `official` |
| Cloudflare | `cloudflare/worker/*` | Gateway/proxy |
| GitHub | `.github/workflows/*` | CI + GHCR |
| Google Cloud | `app.yaml`, `cloudbuild.yaml`, `deploy/google-cloud/*` | App Engine / Cloud Run |
| AWS | `deploy/aws/*` | App Runner / ECS Fargate |
| Heroku | `Procfile` | Node dyno |
| Render | `render.yaml` | Docker service |
| Railway | `railway.json` | Docker service |
| Vercel | `vercel.json`, `src/serverless/vercel.js` | Serverless official/gateway |
| Netlify | `netlify.toml`, `netlify/functions/api.js` | Lightweight contract adapter |
| VPS umum | `deploy/vps/install.sh`, nginx/systemd sample | Docker Compose |
| Kubernetes | `k8s/*` | Container orchestration |
| Hybrid multi-cloud | Cloudflare + 2 origins | Primary/fallback gateway |

## Docker

```bash
cp .env.production.example .env
docker compose up -d --build
curl http://localhost:3000/health
```

## Cloudflare Worker

```bash
cd cloudflare/worker
cp wrangler.toml.example wrangler.toml
wrangler deploy
```

Untuk proxy ke origin Node:

```toml
[vars]
ORIGIN_API_URL = "https://api.example.com"
```

## GitHub Actions

Push ke `main` atau `master` akan menjalankan CI. Push tag `v*` dapat mem-publish Docker image ke GHCR.

## Google Cloud Run

```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/tenrusl-instagram-api
gcloud run deploy tenrusl-instagram-api --image gcr.io/PROJECT_ID/tenrusl-instagram-api --port 3000
```

## AWS ECS Fargate

Gunakan `deploy/aws/ecs-task-definition.example.json` sebagai baseline, push image ke ECR, lalu buat service dengan target group health path `/health`.

## Heroku

```bash
heroku create tenrusl-instagram-api
heroku stack:set heroku-24
heroku config:set NODE_ENV=production APP_MODE=official SCRAPER_ENABLED=false API_KEY_ENABLED=true API_KEY=replace_with_secret
git push heroku main
```

## Render

Import blueprint dari `render.yaml`, isi secret, lalu deploy.

## Railway

```bash
railway up
railway variables set NODE_ENV=production APP_MODE=official SCRAPER_ENABLED=false API_KEY_ENABLED=true API_KEY=replace_with_secret
```

## Vercel

```bash
vercel --prod
```

Set env di dashboard: `NODE_ENV`, `APP_MODE`, `SCRAPER_ENABLED`, `API_KEY_ENABLED`, `API_KEY`, `CORS_ORIGIN`.

## Netlify

```bash
netlify deploy --prod
```

Netlify function yang disediakan adalah lightweight contract adapter. Pakai Docker/Kubernetes/VPS untuk full Express stack.

## VPS umum

```bash
bash deploy/vps/install.sh
```

Atau manual:

```bash
git clone https://github.com/kakrusliandika/TenRusl-InstagramApiNodeJs.git
cd TenRusl-InstagramApiNodeJs
cp .env.production.example .env
nano .env
docker compose up -d --build
```

## Kubernetes

```bash
kubectl apply -f k8s/secret.example.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

## Hybrid multi-cloud

Recommended layout:

```txt
Cloudflare Worker
  ├─ Primary origin: Cloud Run / Render / Railway / Kubernetes
  └─ Backup origin: VPS Docker / AWS ECS
```

Gunakan `/health`, `/ready`, `/live`, dan `/metrics` untuk routing health, probe, dan observability.
