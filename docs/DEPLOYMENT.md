# Deployment Guide

## Local

Cocok untuk development dan audit cepat.

```bash
npm install
cp .env.example .env
npm run dev
```

Health check: `/health`.

## Docker

Cocok untuk production parity dan platform container.

```bash
docker build -t tenrusl-instagram-api:production .
docker run --env-file .env -p 3000:3000 tenrusl-instagram-api:production
```

File: `Dockerfile`, `.dockerignore`.

## Docker Compose

Cocok untuk local staging.

```bash
docker compose up --build
```

File: `docker-compose.yml`.

## Cloudflare

Cocok sebagai edge proxy. Gunakan `deploy/cloudflare/worker.js` dan set `APP_BASE_URL` ke origin API.

## GitHub Actions

Cocok untuk CI. Copy `deploy/github/ci.yml` ke `.github/workflows/ci.yml`.

## Google Cloud

Cocok untuk Cloud Run container. Gunakan `deploy/google-cloud/cloud-run.yaml`.

Build/start: container image, start `npm start`, port `3000`.

## AWS

Cocok untuk App Runner atau ECS. Gunakan `deploy/aws/apprunner.yaml` atau adaptasi ke ECS task.

## Heroku

Cocok untuk deployment cepat. File: `Procfile`.

```bash
heroku config:set NODE_ENV=production IG_PROVIDER=mock
```

## Render

Cocok untuk managed web service. File: `render.yaml` dengan health check `/health`.

## Railway

Cocok untuk deploy cepat Node.js. File: `railway.json`.

## Vercel

Cocok untuk preview serverless. File: `deploy/vercel/vercel.json`.

## Netlify

Cocok untuk serverless preview. File: `deploy/netlify/netlify.toml` dan `netlify/functions/api.js`.

## VPS

Cocok untuk kontrol penuh. Gunakan Nginx reverse proxy dan systemd service dari `deploy/vps`.

## Kubernetes

Cocok untuk scale dan multi-region. File: `deploy/kubernetes/*.yaml`.

```bash
kubectl apply -f deploy/kubernetes/
```

Readiness: `/ready`, liveness: `/live`.

## Hybrid Multi-Cloud

Cocok untuk high availability. Gunakan image yang sama di Kubernetes primary, Cloud Run/AWS secondary, VPS fallback, dan edge DNS failover.
