<!-- Dokumen ini berisi catatan keamanan dan panduan penggunaan yang bertanggung jawab. -->
<!-- Istilah teknis security yang umum digunakan tetap dalam bahasa Inggris. -->

# Catatan Keamanan

## Ringkasan Model Keamanan

<!-- Gambaran umum lapisan keamanan yang diterapkan. -->

Project ini menerapkan prinsip keamanan berlapis. Setiap request melewati beberapa pemeriksaan sebelum mencapai controller:

1. **Middleware keamanan**: Helmet security headers, CORS, dan rate limit.
2. **Autentikasi**: API key atau Bearer token (opsional, dikontrol oleh `API_KEY_ENABLED`).
3. **Validasi input**: Schema Zod memvalidasi query, params, dan body.
4. **Penanganan error**: Error handler global memformat error ke standard envelope tanpa membocorkan detail internal.
5. **Provider batasan**: Setiap provider membatasi operasi berdasarkan kemampuannya; operasi yang tidak didukung gagal secara eksplisit.

## Pengerasan yang Sudah Diimplementasikan

<!-- Daftar langkah pengerasan keamanan yang sudah aktif. -->

- Security headers Helmet.
- CORS yang dapat dikonfigurasi.
- Rate limit in-memory dasar untuk deployment single-instance.
- Header response rate limit dan `Retry-After` pada response `429`.
- Rate limit diaktifkan secara default. `RATE_LIMIT_ENABLED=false` hanya dihormati di luar production; production tetap mempertahankan penegakan aktif.
- Request ID per request.
- Limit ukuran body JSON.
- Sanitasi input untuk body, params, dan nilai query.
- Schema validasi Zod.
- Handler not-found dan error global.
- Standard error envelope.
- Logging JSON terstruktur dengan redaksi secret.
- Perbandingan API key yang aman secara timing.
- Perlindungan API key opsional untuk `/metrics` dan `/capabilities`.
- Graceful shutdown.
- Provider mock default dan operasi write dry-run.
- Provider official mengirim token Meta dengan `Authorization: Bearer`.
- Provider public hanya menerima URL upstream HTTP/HTTPS tanpa credential yang tertanam.

## Tidak Termasuk Secara Sengajal

<!-- Fitur yang sengaja tidak diimplementasikan karena alasan keamanan dan kepatuhan. -->

- Melewati login.
- Credential stuffing.
- Penghindaran anti-bot atau rate limit.
- Pencurian session.
- Penyimpanan password mentah.
- Scraping agresif.

## API Key

<!-- Penjelasan cara kerja autentikasi API key. -->

Ketika `API_KEY_ENABLED=true`:

- Setiap endpoint (kecuali `/health`) memerlukan header `x-api-key` yang cocok dengan `API_KEY`, **atau** header `Authorization: Bearer <token>` yang cocok dengan `API_KEY`.
- Perbandingan dilakukan secara timing-safe untuk mencegah timing attack.
- `/metrics` dan `/capabilities` dapat dikecualikan dari autentikasi dengan `METRICS_PUBLIC=true` atau `CAPABILITIES_PUBLIC=true`.
- Jika `API_KEY` tidak diatur ketika `API_KEY_ENABLED=true`, server menolak start dengan error yang jelas.

## Bearer Token

<!-- Penjelasan penggunaan Bearer token. -->

Bearer token menggunakan mekanisme yang sama dengan API key: nilai header `Authorization: Bearer <token>` dibandingkan dengan `API_KEY`. Ini mendukung client yang mengharapkan pola autentikasi Bearer standar.

Provider official menggunakan Bearer token terpisah (`META_ACCESS_TOKEN`) untuk autentikasi ke Meta Graph API. Token ini **tidak** dikirim sebagai query parameter; selalu dikirim sebagai header `Authorization: Bearer`.

## Rate Limit

<!-- Penjelasan mekanisme rate limiting. -->

Rate limiter internal membatasi request per IP:

- Dikonfigurasi melalui `RATE_LIMIT_ENABLED`, `RATE_LIMIT_WINDOW_MS`, dan `RATE_LIMIT_MAX`.
- Mengembalikan status `429` dengan header `Retry-After` dan informasi kuota.
- Otomatis membersihkan bucket yang sudah kedaluwarsa.
- `RATE_LIMIT_ENABLED=false` hanya dihormati di luar production; production tetap aktif.

Untuk production multi-instance, gunakan rate limiter terdistribusi (misalnya Redis), kuota gateway platform, atau rate limit level WAF.

### Panduan Klien untuk Rate Limit

<!-- Panduan cara klien seharusnya menangani rate limit. -->

- Perlakukan `429 RATE_LIMITED` sebagai sinyal kepatuhan, bukan sesuatu yang harus dilewati.
- Hormati header `Retry-After` sebelum mencoba ulang.
- Gunakan exponential backoff dengan jitter untuk request yang bisa diulang.
- Antrikan pekerjaan yang tidak mendesak alih-alih mengirim burst.
- Cache response hanya ketika kasus penggunaan dan ketentuan provider mengizinkannya.
- Gunakan provider official dan kuota Meta yang disetujui ketika kamu membutuhkan skala production yang legal.

## CORS

<!-- Penjelasan konfigurasi CORS. -->

`CORS_ORIGIN` mengontrol origin mana yang diizinkan mengakses API:

- Default `*` mengizinkan semua origin (cocok untuk development).
- Untuk production, batasi ke origin spesifik.
- Origin yang tidak diizinkan akan menerima error CORS sebelum response endpoint ter-ekspos.
- Credential CORS tidak diaktifkan secara default.

## Helmet / Security Headers

<!-- Penjelasan security headers yang diterapkan. -->

Helmet diterapkan secara default dan menambahkan header keamanan umum:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` (pada HTTPS)
- Dan header lainnya yang direkomendasikan oleh Helmet.

## Limit Body Request

<!-- Penjelasan limit ukuran body request. -->

`BODY_LIMIT` mengontrol ukuran maksimum body JSON dan form (default `256kb`). Request yang melebihi limit ditolak sebelum mencapai controller. Ini mencegah serangan denial-of-service berbasis body besar.

## Validasi Input

<!-- Penjelasan mekanisme validasi input. -->

Semua input divalidasi menggunakan schema Zod sebelum mencapai controller:

- **Query**: parameter pagination, filter, dan query boolean.
- **Params**: identifier seperti username dan ID.
- **Body**: request body untuk operasi write.
- **Link**: URL Instagram divalidasi untuk memastikan host dan path yang valid.
- **Username**: divalidasi untuk karakter yang diizinkan, panjang maksimal, dan format yang valid.

Input yang tidak valid menghasilkan status `400` dengan standard error envelope.

## Error Envelope yang Aman

<!-- Penjelasan cara error di-format secara aman. -->

Semua error diformat ke standard error envelope:

```json
{
  "success": false,
  "data": null,
  "meta": {
    "provider": "mock",
    "requestId": "req_123"
  },
  "error": {
    "code": "ERROR_CODE",
    "message": "Pesan yang aman untuk klien",
    "details": {}
  }
}
```

- Stack trace **tidak** pernah dikembalikan ke client.
- Pesan error cukup informatif untuk debugging tanpa membocorkan detail internal.
- Request ID disertakan untuk tracing tanpa mengekspos infrastruktur.

## Logging Aman Tanpa Membocorkan Secret

<!-- Penjelasan cara logging dilakukan secara aman. -->

- Logging menggunakan format JSON terstruktur.
- Secret, token, dan credential di-redaksi secara otomatis sebelum ditulis ke log.
- Request ID disertakan di setiap entri log untuk tracing.
- Level log dapat dikonfigurasi melalui `LOG_LEVEL`.
- Log tidak mencetak body request yang mengandung credential.

## Secret Management

<!-- Penjelasan cara mengelola secret. -->

- Secret **tidak boleh** di-embed di kode source.
- Secret **tidak boleh** di-commit ke repository.
- Gunakan environment variable untuk secret runtime.
- Untuk production, gunakan secret manager platform (AWS Secrets Manager, Google Secret Manager, HashiCorp Vault, dll.).
- Untuk VPS, simpan secret di file environment yang dimiliki root di luar git (misalnya `/etc/tenrusl-instagram-api/secrets.env`).
- `.dockerignore` mengecualikan file `.env` dari build context Docker.
- Lakukan rotasi token secara berkala.

## Deployment Security Checklist

<!-- Checklist keamanan yang harus dipenuhi sebelum deploy. |

- [ ] Set `NODE_ENV=production`.
- [ ] Gunakan `API_KEY_ENABLED=true` atau lindungi API di belakang auth gateway.
- [ ] Pertahankan `RATE_LIMIT_ENABLED=true`; menonaktifkan rate limiter internal hanya untuk troubleshooting lokal/test.
- [ ] Pertahankan `METRICS_PUBLIC=false` dan `CAPABILITIES_PUBLIC=false` kecuali endpoint ini dilindungi upstream.
- [ ] Batasi `CORS_ORIGIN` ke origin spesifik.
- [ ] Simpan semua secret di secret manager platform.
- [ ] Jangan commit file `.env`, token, atau credential ke repository.
- [ ] Pastikan image Docker berjalan sebagai user non-root.
- [ ] Monitor `/ready`, `/live`, dan `/metrics`.
- [ ] Lakukan rotasi token dan audit log akses.
- [ ] Untuk multi-instance, gunakan rate limiter terdistribusi atau kuota gateway.
- [ ] Jangan perlakukan template `deploy/*` sebagai config production akhir tanpa review.

## Production Checklist

<!-- Checklist tambahan untuk production. -->

- Gunakan `IG_PROVIDER=official` dengan scope yang disetujui Meta untuk data yang nyata.
- Gunakan `IG_PROVIDER=public` hanya dengan upstream yang compliant dan kamu kontrol; jangan proxy bypass scraping.
- Pastikan provider non-mock sudah terkonfigurasi dan bebas peringatan sebelum menerima traffic.
- Verifikasi bahwa `/ready` mengembalikan status sehat sebelum mengarahkan traffic.
- Tambahkan TLS/HTTPS di depan API (nginx, load balancer, atau platform).
- Konfigurasi log aggregation dan alerting untuk error dan peringatan.

## Penggunaan yang Bertanggung Jawab

<!-- Catatan tentang penggunaan yang sesuai aturan. -->

Project ini dirancang untuk integrasi yang aman dan patuh. **Jangan** gunakan project ini untuk:

- Scraping data Instagram.
- Melewati kontrol login, anti-bot, atau rate limit.
- Spam, bulk messaging, atau automasi yang melanggar ketentuan platform.
- Mengakses data tanpa izin dari pemiliknya.
- Credential stuffing atau serangan brute force.

Gunakan hanya untuk:

- Integrasi resmi yang disetujui oleh Meta.
- Data yang kamu miliki atau yang sudah disetujui secara eksplisit.
- Testing dan development dengan mode mock.
- Upstream public data yang legal, compliant, dan kamu kontrol.

## Pelaporan Keamanan

<!-- Cara melaporkan masalah keamanan. -->

Jika kamu menemukan masalah keamanan:

1. **Jangan** buka issue publik untuk kerentanan yang belum ditambal.
2. Kirim detail ke maintainer project secara privat.
3. Sertakan langkah-langkah reproduksi, dampak, dan saran perbaikan jika memungkinkan.
4. Maintainer akan merespons dan menangani masalah sebelum pengungkapan publik.

## Batasan Keamanan Project

<!-- Batasan yang harus dipahami tentang keamanan project. -->

- Rate limiter in-memory tidak efektif untuk multi-instance tanpa rate limiter terdistribusi.
- Mode mock tidak melindungi dari serangan terhadap infrastruktur API itu sendiri (misalnya DDoS).
- Provider public bergantung pada keamanan dan kepatuhan upstream yang kamu kontrol.
- Provider authorized belum memiliki implementasi live; jangan aktifkan tanpa review integrasi yang tepat.
- API ini adalah gateway, bukan pengganti keamanan platform Instagram/Meta itu sendiri.

## Catatan Tambahan

<!-- Catatan keamanan tambahan. -->

- Token Meta, API key, dan credential **tidak boleh** dicommit ke repository.
- File `.env` lokal tidak boleh di-deploy ke production.
- Lakukan audit berkala terhadap log akses dan konfigurasi.
- Ikuti perkembangan keamanan dependencies melalui `npm audit`.