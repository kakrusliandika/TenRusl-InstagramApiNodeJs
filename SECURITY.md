# Security Policy

Project ini adalah API gateway dengan default aman: `IG_PROVIDER=mock`, semua write action dry-run, dan tidak ada secret yang dikirim balik melalui response.

## Melaporkan masalah keamanan

Laporkan issue secara privat kepada maintainer sebelum membuka detail publik.

## Batasan keamanan

- Tidak menyediakan bypass login, anti-bot, rate-limit, atau access control.
- Tidak menyimpan password mentah.
- Adapter `authorized` disabled by default dan hanya untuk data milik sendiri atau izin eksplisit.
- Adapter `official` harus memakai token resmi Meta/Instagram Graph API.

## Production checklist

- Aktifkan API key atau proteksi upstream gateway.
- Batasi `CORS_ORIGIN`.
- Gunakan secret manager untuk token.
- Pantau `/health`, `/ready`, `/live`, dan `/metrics`.
- Jalankan container sebagai non-root user.
