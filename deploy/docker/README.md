# Docker Deployment

Cocok untuk local production parity, staging, dan single-container hosting.

```bash
docker build -t tenrusl-instagram-api:production .
docker run --rm --env-file .env -p 3000:3000 tenrusl-instagram-api:production
```

Health check: `GET /health`. Production note: gunakan `.env` asli dari secret manager, bukan `.env.example`.
