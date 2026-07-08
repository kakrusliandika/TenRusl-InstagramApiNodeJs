<!-- Dokumen ini berisi penjelasan environment variable yang digunakan project. -->
<!-- Env key dan value teknis tetap dalam bahasa Inggris. -->

# Environment Variable

Untuk development lokal, copy `.env.local.example` ke `.env`.

## Contoh `.env` Lokal Minimal

```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
TRUST_PROXY=1
IG_PROVIDER=mock
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000
API_KEY_ENABLED=false
METRICS_PUBLIC=false
CAPABILITIES_PUBLIC=false
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120
BODY_LIMIT=256kb
DEFAULT_LIMIT=25
MAX_LIMIT=100
PROVIDER_REQUEST_TIMEOUT_MS=10000
GRACEFUL_SHUTDOWN_MS=10000
```

## Tabel Environment Variable

<!-- Tabel lengkap semua environment variable beserta default dan penjelasannya. -->

| Variable | Default | Penjelasan |
|---|---|---|
| `NODE_ENV` | `development` | Mode runtime. |
| `APP_NAME` | `TenRusl Instagram API Gateway` | Nama layanan yang diekspos oleh health dan metrics. |
| `PORT` | `3000` | Port HTTP. |
| `HOST` | `0.0.0.0` | Alamat bind. |
| `TRUST_PROXY` | `1` | Pengaturan trust proxy Express untuk reverse proxy. |
| `LOG_LEVEL` | `info` | Level log: `debug`, `info`, `warn`, `error`, `silent`. |
| `IG_PROVIDER` | `mock` | Provider aktif: `mock`, `official`, `public`, `authorized`. |
| `API_KEY_ENABLED` | `false` | Mengaktifkan autentikasi `x-api-key` atau Bearer. |
| `API_KEY` | kosong | Wajib diisi ketika API key diaktifkan. |
| `METRICS_PUBLIC` | `false` | Ketika autentikasi API key aktif, izinkan `/metrics` tanpa autentikasi. |
| `CAPABILITIES_PUBLIC` | `false` | Ketika autentikasi API key aktif, izinkan `/capabilities` tanpa autentikasi. |
| `CORS_ORIGIN` | `*` | Origin yang diizinkan, dipisahkan koma. |
| `RATE_LIMIT_ENABLED` | `true` | Mengaktifkan rate limiter internal per-IP. `false` hanya dihormati di luar production. |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Jendela waktu rate limit (dalam milidetik). |
| `RATE_LIMIT_MAX` | `120` | Maksimum request per jendela per IP. |
| `DEFAULT_LIMIT` | `25` | Limit default untuk collection. |
| `MAX_LIMIT` | `100` | Limit maksimum untuk collection. |
| `BODY_LIMIT` | `256kb` | Limit body JSON dan form. |
| `PROVIDER_REQUEST_TIMEOUT_MS` | `10000` | Timeout untuk request ke upstream provider. |
| `META_GRAPH_BASE_URL` | `https://graph.facebook.com` | Base URL Meta Graph API. |
| `META_API_VERSION` | `v23.0` | Versi Meta Graph API yang digunakan. |
| `META_ACCESS_TOKEN` | kosong | Token provider official. |
| `META_IG_USER_ID` | kosong | ID user Instagram Business/Creator. |
| `PUBLIC_DATA_ENABLED` | `false` | Mengaktifkan batasan integrasi adapter public. |
| `PUBLIC_DATA_UPSTREAM_URL` | kosong | Upstream public data yang compliant, jika digunakan. |
| `AUTHORIZED_PROVIDER_ENABLED` | `false` | Mengaktifkan batasan provider authorized lanjutan. |
| `AUTHORIZED_SESSION_TOKEN` | kosong | Token/sesi rahasia yang disediakan secara sadar oleh pemilik. |
| `AUTHORIZED_INTEGRATION_REVIEWED` | `false` | Wajib bersama implementasi kode yang sudah direview sebelum provider authorized dapat melaporkan ready. |
| `GRACEFUL_SHUTDOWN_MS` | `10000` | Timeout shutdown sebelum memaksa keluar proses. |

## Variable Wajib

<!-- Variable yang harus diatur di semua environment. |

- `NODE_ENV`: tentukan mode runtime (`development`, `production`, `test`).
- `IG_PROVIDER`: tentukan provider aktif (`mock` untuk development dan preview tanpa credential).

## Variable Opsional

<!-- Variable yang opsional tetapi direkomendasikan untuk production. -->

- `API_KEY` + `API_KEY_ENABLED`: aktifkan untuk melindungi endpoint sensitif.
- `CORS_ORIGIN`: batasi origin yang diizinkan untuk production.
- `RATE_LIMIT_*`: sesuaikan untuk beban traffic production.
- `META_*`: wajib untuk provider `official`.
- `PUBLIC_DATA_*`: wajib untuk provider `public`.
- `AUTHORIZED_*`: wajib untuk provider `authorized`.

## Penjelasan IG_PROVIDER

<!-- Penjelasan singkat tentang setiap provider. -->

| Nilai | Penjelasan |
|---|---|
| `mock` | Provider default. Data deterministik lokal; semua operasi tersedia tanpa credential eksternal. Cocok untuk development, testing, dan preview. |
| `official` | Menggunakan Meta Graph API resmi. Memerlukan `META_ACCESS_TOKEN` dan `META_IG_USER_ID`. Operasi dibatasi oleh scope Meta yang disetujui. |
| `public` | Proxy ke upstream public data yang kamu kontrol. Memerlukan `PUBLIC_DATA_UPSTREAM_URL`. Hanya operasi baca; write ditolak. |
| `authorized` | Dikunci sampai integrasi direview dan diimplementasikan. Memerlukan `AUTHORIZED_SESSION_TOKEN` dan `AUTHORIZED_INTEGRATION_REVIEWED=true`. |

## Penjelasan API Key dan Bearer Token

<!-- Penjelasan cara kerja autentikasi API key dan Bearer token. -->

Ketika `API_KEY_ENABLED=true`:

- Endpoint memerlukan header `x-api-key` dengan nilai yang cocok dengan `API_KEY`, **atau** header `Authorization: Bearer <token>` dengan nilai yang cocok dengan `API_KEY`.
- `/health` selalu publik (tidak memerlukan autentikasi).
- `/metrics` dan `/capabilities` dapat dikecualikan dari autentikasi dengan mengatur `METRICS_PUBLIC=true` atau `CAPABILITIES_PUBLIC=true`.
- Jika `API_KEY` tidak diatur ketika `API_KEY_ENABLED=true`, server akan menolak start dengan error yang jelas.

## Penjelasan Rate Limit

<!-- Penjelasan cara kerja rate limiting. -->

Rate limiter internal membatasi request per IP:

- `RATE_LIMIT_ENABLED`: aktifkan/nonaktifkan rate limiter. Dinonaktifkan hanya di luar production.
- `RATE_LIMIT_WINDOW_MS`: jendela waktu dalam milidetik (default 60000 = 1 menit).
- `RATE_LIMIT_MAX`: maksimum request per jendela per IP (default 120).

Ketika batas tercapai, API mengembalikan status `429` dengan header `Retry-After` dan informasi kuota. Rate limit otomatis membersihkan bucket yang sudah kedaluwarsa.

Untuk production multi-instance, gunakan rate limiter terdistribusi (misalnya Redis) atau rate limit level platform/WAF.

## Penjelasan CORS

<!-- Penjelasan konfigurasi CORS. -->

`CORS_ORIGIN` mengontrol origin mana yang diizinkan mengakses API:

- Default `*` mengizinkan semua origin (cocok untuk development).
- Untuk production, batasi ke origin spesifik, dipisahkan koma: `https://app.example.com,https://admin.example.com`.
- Origin yang tidak diizinkan akan menerima error CORS sebelum response endpoint ter-ekspos.

## Penjelasan Logging

<!-- Penjelasan konfigurasi logging. -->

`LOG_LEVEL` mengontrol verbosity log:

- `debug`: log paling detail; gunakan hanya untuk troubleshooting.
- `info`: log standar untuk operasi normal (default).
- `warn`: hanya peringatan dan error.
- `error`: hanya error.
- `silent`: tanpa log output.

Log tidak membocorkan secret, token, atau credential. Request ID disertakan untuk tracing lintas log.

## Contoh `.env` Production

<!-- Contoh konfigurasi production yang aman. -->

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
TRUST_PROXY=1
IG_PROVIDER=official
CORS_ORIGIN=https://app.example.com
API_KEY_ENABLED=true
API_KEY=<gunakan-secret-manager>
METRICS_PUBLIC=false
CAPABILITIES_PUBLIC=false
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120
BODY_LIMIT=256kb
DEFAULT_LIMIT=25
MAX_LIMIT=100
PROVIDER_REQUEST_TIMEOUT_MS=10000
GRACEFUL_SHUTDOWN_MS=10000
META_GRAPH_BASE_URL=https://graph.facebook.com
META_API_VERSION=v23.0
META_ACCESS_TOKEN=<gunakan-secret-manager>
META_IG_USER_ID=<gunakan-secret-manager>
```

## Rekomendasi Production

<!-- Rekomendasi environment untuk production. -->

- Pertahankan `IG_PROVIDER=mock` untuk preview.
- Gunakan `official` untuk integrasi Business/Creator yang disetujui Meta secara resmi.
- Pertahankan `METRICS_PUBLIC=false` dan `CAPABILITIES_PUBLIC=false`.
- Pertahankan `RATE_LIMIT_ENABLED=true`.
- Simpan semua secret di secret manager platform, bukan di file `.env` yang di-commit.

## Variable Legacy yang Dinonaktifkan

<!-- Variable legacy yang sudah tidak dibaca oleh Express runtime. -->

Variable legacy berikut tidak dibaca oleh Express runtime: `APP_MODE`, `SCRAPER_ENABLED`, `CACHE_ENABLED`, `PUPPETEER_HEADLESS`, dan `META_API_ENABLED`.