# VPS Templates

These files are deployment templates, not final production config.

- `nginx.conf`: reverse proxy example. Replace `api.example.com`, TLS settings, and upstream address.
- `systemd.service`: service example. Replace `WorkingDirectory`, `User`, environment values, and secret injection.

Use root `Dockerfile` or `npm start` as the application runtime entry.
