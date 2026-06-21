# Heroku

Cocok untuk deployment cepat aplikasi Node.js. Set config vars `NODE_ENV=production`, `IG_PROVIDER=mock|official|public|authorized`, dan secret terkait.

```bash
heroku create tenrusl-instagram-api
heroku config:set NODE_ENV=production IG_PROVIDER=mock
heroku deploy:container:push web
heroku deploy:container:release web
```

Health check: `/health`.
