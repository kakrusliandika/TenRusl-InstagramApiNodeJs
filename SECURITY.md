# Security Policy

Project ini adalah API gateway dengan default aman: `IG_PROVIDER=mock`, semua write action dry-run, dan tidak ada secret yang dikirim balik melalui response.

## Melaporkan masalah keamanan

Laporkan issue secara privat kepada maintainer sebelum membuka detail publik.

## Batasan keamanan

- Tidak menyediakan bypass login, anti-bot, rate-limit, atau access control.
- Rate limit mendukung compliance dan fair-use; `429` harus dihormati, bukan dihindari.
- Tidak menyimpan password mentah.
- Adapter `authorized` disabled by default dan hanya untuk data milik sendiri atau izin eksplisit.
- Adapter `official` hanya memakai Meta/Instagram Graph API resmi dan mengirim token lewat `Authorization: Bearer`, bukan query string.
- Adapter `public` hanya boleh diarahkan ke upstream data publik yang compliant; tidak boleh dipakai untuk bypass login, anti-bot, atau rate-limit.
- `/health`, `/ready`, dan `/live` public untuk platform probes.
- `/metrics` dan `/capabilities` default protected saat `API_KEY_ENABLED=true`; buka hanya dengan `METRICS_PUBLIC=true` atau `CAPABILITIES_PUBLIC=true` jika sudah dilindungi upstream.

## Production checklist

- Aktifkan API key atau proteksi upstream gateway.
- Batasi `CORS_ORIGIN`.
- Biarkan `RATE_LIMIT_ENABLED=true`; mode disabled hanya untuk local/test troubleshooting dan diabaikan saat production.
- Biarkan `METRICS_PUBLIC=false` dan `CAPABILITIES_PUBLIC=false` kecuali monitoring/ops gateway sudah membatasi akses.
- Gunakan secret manager untuk token.
- Pantau `/health`, `/ready`, `/live`, dan `/metrics`.
- Halaman statis `/` hanya menampilkan status/link endpoint publik; jangan taruh secret atau data sensitif di `public/`.
- Jalankan container sebagai non-root user.
