# Deployment Guide

## Deployment File Ownership

Root configs are kept only when the platform or common tooling expects them at the repository root.

| File | Category | Purpose |
|---|---|---|
| `Dockerfile` | Active root config | Container image build. |
| `docker-compose.yml` | Active root config | Local/staging container orchestration. |
| `.github/workflows/ci.yml` | Active root config | CI source of truth. |
| `Procfile` | Active root config | Heroku-style process command. |
| `render.yaml` | Active root config | Render managed service. |
| `railway.json` | Active root config | Railway deploy settings. |
| `vercel.json` | Active root config | Vercel preview routing to `src/serverless/vercel.js`. |
| `netlify.toml` | Active root config | Netlify preview routing to `netlify/functions/api.js`. |
| `app.yaml` | Active root config | Google App Engine service config. Replace placeholder secrets before use. |
| `cloudbuild.yaml` | Active root config | Google Cloud Build image template. |
| `deploy/*` | Optional templates | Platform examples and notes. Replace placeholders before production. |

Optional serverless and edge adapters are not the local runtime. Local and container runtime starts at `src/server.js`.

## Deployment Matrix

| Platform | File | Status | Cocok untuk | Env wajib |
|---|---|---|---|---|
| Docker image | `Dockerfile`, `.dockerignore` | Active | Portable container runtime | Runtime env injected by platform or `--env-file`; never bake secrets into image. |
| Docker Compose | `docker-compose.yml` | Active local/staging | Local staging with production-like container | `.env`, `NODE_ENV`, `IG_PROVIDER`, `API_KEY_ENABLED`, `CORS_ORIGIN`, rate limit, body limit, provider timeout. |
| GitHub Actions | `.github/workflows/ci.yml` | Active CI | Validate PRs and pushes | No production secrets; runs local mock/provider-safe checks. |
| App Engine | `app.yaml` | Active template | Google App Engine | `NODE_ENV`, `IG_PROVIDER`, `API_KEY_ENABLED`, `API_KEY`, `CORS_ORIGIN`, rate limit, provider timeout, selected provider env. |
| Cloud Build | `cloudbuild.yaml` | Active image template | Google image build | Build-time project/image values only; runtime secrets come from deploy target. |
| Cloud Run | `deploy/google-cloud/cloud-run.yaml` | Optional template | Container production/preview on Google Cloud | Same runtime env as App Engine; use Secret Manager for `API_KEY`, `META_ACCESS_TOKEN`, `META_IG_USER_ID`. |
| AWS App Runner | `deploy/aws/apprunner.yaml` | Optional template | AWS managed container | Same runtime env as App Engine; use AWS Secrets Manager for secrets. |
| Render | `render.yaml` | Active managed service | Managed web service | Non-secret env in YAML; `sync:false` for `API_KEY`, Meta token/id, and authorized token. |
| Railway | `railway.json` | Active deploy settings | Quick Node deploy | Set env in Railway dashboard/variables; `railway.json` only owns build/start/probe settings. |
| Heroku-style | `Procfile` | Active process command | Heroku-compatible platforms | Set env via platform config vars; `Procfile` only owns process command. |
| Vercel | `vercel.json`, `src/serverless/vercel.js` | Preview serverless | Pull request/demo preview | Safe non-secret preview env in JSON; set secrets in Vercel dashboard if enabling auth/provider live data. |
| Netlify | `netlify.toml`, `netlify/functions/api.js` | Preview serverless | Pull request/demo preview | Safe non-secret preview env in TOML; set secrets in Netlify UI if needed. |
| Kubernetes | `deploy/kubernetes/*.yaml` | Optional production template | Multi-instance container deployment | ConfigMap for non-secrets, Secret/external secret manager for `API_KEY`, Meta token/id, authorized token. |
| VPS | `deploy/vps/*` | Optional production template | VM/systemd/nginx deployment | systemd env for non-secrets; `/etc/tenrusl-instagram-api/secrets.env` or secret manager for secrets. |
| Cloudflare Worker | `deploy/cloudflare/worker.js` | Edge proxy template | Reverse proxy/API facade | `ORIGIN_BASE_URL` must point to a deployed origin API. |

Common runtime env across deploy targets:

- `NODE_ENV`, `IG_PROVIDER`, `API_KEY_ENABLED`, `API_KEY`, `CORS_ORIGIN`
- `RATE_LIMIT_ENABLED`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`
- `BODY_LIMIT`, `PROVIDER_REQUEST_TIMEOUT_MS`
- Provider-specific env: `META_GRAPH_BASE_URL`, `META_API_VERSION`, `META_ACCESS_TOKEN`, `META_IG_USER_ID`, `PUBLIC_DATA_ENABLED`, `PUBLIC_DATA_UPSTREAM_URL`, `AUTHORIZED_PROVIDER_ENABLED`, `AUTHORIZED_SESSION_TOKEN`, `AUTHORIZED_INTEGRATION_REVIEWED`

Keep real secret values out of committed deployment files. Use platform secret managers, dashboard variables, Kubernetes Secrets, or a root-owned VPS environment file outside git.

## Local

Cocok untuk development dan audit cepat. Local default uses `IG_PROVIDER=mock`, so no Instagram credential is required.

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

Local smoke checks:

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

Local troubleshooting:

| Problem | Fix |
|---|---|
| Port `3000` already in use | Set `PORT=3001` in `.env`. |
| API key `401` | Local default is `API_KEY_ENABLED=false`; if enabled, send `x-api-key` or bearer auth. |
| Rate limit `429` | Wait for the reset or adjust `RATE_LIMIT_MAX` in local `.env`. |
| Official provider not configured | Use `IG_PROVIDER=mock` locally, or fill the required Meta env. |
| CORS blocked | Add your frontend origin to `CORS_ORIGIN`. |

## Docker

Cocok untuk production parity dan platform container.

```bash
docker build -t tenrusl-instagram-api:production .
docker run --env-file .env -p 3000:3000 tenrusl-instagram-api:production
```

File: `Dockerfile`, `.dockerignore`.

The Docker image runs as the non-root `node` user. `.dockerignore` excludes common local secret files such as `.env`, `.env.local`, and `.env.production`; keep real secrets in runtime env or a secret manager.

## Docker Compose

Cocok untuk local staging.

```bash
cp .env.example .env
docker compose up --build
```

File: `docker-compose.yml`.

Use `.env` for local staging values. The compose file provides safe defaults and does not include real tokens.

## Cloudflare

Cocok sebagai edge proxy. `deploy/cloudflare/worker.js` adalah template reverse proxy, bukan runtime Express. Set `ORIGIN_BASE_URL` ke origin API sebelum deploy; the worker returns `500` when the origin is not configured.

## GitHub Actions

Cocok untuk CI. File aktif: `.github/workflows/ci.yml`.

## Google Cloud

Cocok untuk Cloud Run container. `deploy/google-cloud/cloud-run.yaml` adalah template; ganti image, project, secret, dan `IG_PROVIDER`.

Root `app.yaml` is for App Engine. Root `cloudbuild.yaml` is a Cloud Build image template. Keep real tokens in Secret Manager or platform config, not in committed YAML.

Build/start: container image, start `npm start`, port `3000`.

## AWS

Cocok untuk App Runner atau ECS. `deploy/aws/apprunner.yaml` adalah template App Runner; adaptasi image, secret, dan provider sebelum deploy.

## Heroku

Cocok untuk deployment cepat. File: `Procfile`.

```bash
heroku config:set NODE_ENV=production IG_PROVIDER=mock
```

## Render

Cocok untuk managed web service. File: `render.yaml` dengan health check `/health`.

Keep `sync:false` values populated from the Render dashboard. Do not commit real token values.

## Railway

Cocok untuk deploy cepat Node.js. File: `railway.json`.

Set runtime env in Railway Variables. `railway.json` intentionally keeps only build, start, healthcheck, and restart policy.

## Vercel

Cocok untuk preview serverless, not the primary production recommendation for sustained API traffic. File aktif: `vercel.json`, yang menunjuk ke adapter `src/serverless/vercel.js`. Keep real secrets in Vercel Project Settings.

## Netlify

Cocok untuk serverless preview, not the primary production recommendation for sustained API traffic. File aktif: `netlify.toml` dan `netlify/functions/api.js`. Keep real secrets in Netlify environment variables.

## VPS

Cocok untuk kontrol penuh. `deploy/vps/nginx.conf` dan `deploy/vps/systemd.service` adalah template; ganti domain, user, working directory, TLS, env, dan secret injection.

## Kubernetes

Cocok untuk scale dan multi-region. File `deploy/kubernetes/*.yaml` adalah template; ganti image, namespace, secret, resource limits, ingress host, dan TLS.

```bash
kubectl apply -f deploy/kubernetes/
```

Readiness: `/ready`, liveness: `/live`. The deployment template includes CPU/memory requests and limits; tune them after load testing.

## Per-Platform Checklist

- Docker: build from `Dockerfile`, pass env at runtime, confirm image runs as non-root, and check `/health`.
- Docker Compose: copy `.env.example` to `.env`, keep `IG_PROVIDER=mock` for staging unless provider env is complete, then run `docker compose up --build`.
- Google/AWS/Render/Railway: set runtime env in platform config, put secrets in the platform secret manager/dashboard, and make `/ready` the deployment gate.
- Kubernetes: apply ConfigMap and Secret/external secret first, then Deployment/Service/Ingress; verify probes and resource limits.
- VPS: install Node or run the container, configure systemd and nginx, store secrets outside git, and add TLS.
- Vercel/Netlify: use as preview unless you have reviewed serverless limits and cold-start behavior for your traffic.
- Cloudflare: deploy only as a proxy after `ORIGIN_BASE_URL` points to a healthy API origin.

## Hybrid Multi-Cloud

Cocok untuk high availability. `deploy/hybrid-multicloud/README.md` adalah arsitektur contoh, bukan config otomatis. Gunakan image yang sama di Kubernetes primary, Cloud Run/AWS secondary, VPS fallback, dan edge DNS failover.

## Production Notes

- Replace all placeholder domains, image names, project IDs, and secret values.
- Keep `METRICS_PUBLIC=false` and `CAPABILITIES_PUBLIC=false` unless these endpoints are protected upstream.
- Prefer `IG_PROVIDER=official` for real Meta-approved Business/Creator integrations.
- Treat `/ready` as the deployment readiness gate; non-mock providers must be configured and warning-free.
- Add a distributed rate limiter such as Redis, platform gateway quotas, or WAF-level rate limits before running multiple API instances.
- Do not treat `deploy/*` templates as final production config without review.
