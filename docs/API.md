<!-- Dokumen ini berisi referensi lengkap endpoint API. -->
<!-- Konten endpoint, JSON key, HTTP method, dan command tetap dalam bahasa Inggris sesuai standar teknis. -->

# Referensi API

Base URL lokal: `http://localhost:3000`.

## Lingkup: "API full" berarti full contract mode mock

"API full" dalam project ini berarti gateway mengekspos full Express contract: route, controller, method provider, validasi, test, dan standard response envelope yang terhubung secara konsisten. Ini **bukan** berarti setiap provider dapat menjalankan semua operasi Instagram terhadap upstream live.

Hanya `IG_PROVIDER=mock` yang mendukung full endpoint contract untuk semua route tanpa credential Instagram atau upstream eksternal. Provider selain mock sengaja dibatasi oleh scope API resmi, ketersediaan upstream yang compliant, consent yang sudah direview, credential, dan batasan keamanan/kepatuhan.

Full API contract berjalan penuh pada mode mock. Perilaku live Instagram bergantung pada credential resmi, scope Meta, upstream yang compliant, dan implementasi provider yang aktif.

Semua endpoint JSON API menggunakan envelope ini. Halaman statis `/` menyajikan HTML, dan `/metrics` menyajikan format Prometheus kecuali jika `?format=json` diminta.

```json
{ "success": true, "data": {}, "meta": {}, "error": null }
```

Error menggunakan:

```json
{ "success": false, "data": null, "meta": {}, "error": { "code": "ERROR_CODE", "message": "Message", "details": {} } }
```

## Contoh Curl Cepat

```bash
curl http://localhost:3000/health
curl http://localhost:3000/ready
curl http://localhost:3000/capabilities
curl http://localhost:3000/v1/get/profiles/tenrusl
curl "http://localhost:3000/v1/get/posts/by-link?link=https://www.instagram.com/p/ABC123def45/"
```

<!-- Contoh dry-run untuk comment reply dan publish. -->

Comment reply dry-run:

```bash
curl -X POST http://localhost:3000/v1/comments/reply \
  -H "content-type: application/json" \
  -d '{"id":"comment_123","text":"Local dry-run reply","dryRun":true}'
```

Publish dry-run:

```bash
curl -X POST http://localhost:3000/v1/publish/media \
  -H "content-type: application/json" \
  -d '{"mediaUrl":"https://example.com/image.jpg","mediaType":"IMAGE","caption":"Dry run only","dryRun":true}'
```

PowerShell:

```powershell
curl.exe http://localhost:3000/health
curl.exe http://localhost:3000/ready
curl.exe http://localhost:3000/capabilities
curl.exe http://localhost:3000/v1/get/profiles/tenrusl
curl.exe "http://localhost:3000/v1/get/posts/by-link?link=https://www.instagram.com/p/ABC123def45/"
curl.exe -X POST http://localhost:3000/v1/comments/reply -H "content-type: application/json" -d "{\"id\":\"comment_123\",\"text\":\"Local dry-run reply\",\"dryRun\":true}"
curl.exe -X POST http://localhost:3000/v1/publish/media -H "content-type: application/json" -d "{\"mediaUrl\":\"https://example.com/image.jpg\",\"mediaType\":\"IMAGE\",\"caption\":\"Dry run only\",\"dryRun\":true}"
```

<!-- Tabel berikut menunjukkan status setiap grup endpoint pada masing-masing provider. -->

## Matriks Status Endpoint per Provider

Keterangan:

| Status | Arti |
|---|---|
| ✅ Siap | Diimplementasikan untuk batasan provider tersebut. |
| ◐ Sebagian | Terimplementasi sebagian; bergantung pada scope, field, perilaku upstream, atau subset contract. |
| 🧪 Dry-run | Contract request diterima tetapi tidak ada write/aksi live yang dieksekusi. |
| 🔐 Perlu credential/upstream | Membutuhkan credential provider, scope yang disetujui, ID akun, atau upstream yang compliant. |
| ⛔ Dinonaktifkan | Ditolak secara eksplisit atau tidak diimplementasikan untuk provider tersebut. |

| Grup endpoint | Mock | Official | Public | Authorized |
|---|---:|---:|---:|---:|
| System: `/health`, `/live` | ✅ Siap | ✅ Siap | ✅ Siap | ✅ Siap |
| Readiness/capability: `/ready`, `/capabilities` | ✅ Siap | 🔐 Perlu env Meta; ◐ readiness | 🔐 Perlu upstream compliant; ◐ readiness | ⛔ Dinonaktifkan sampai integrasi direview |
| Metrics: `/metrics` | ✅ Siap | ✅ Siap | ✅ Siap | ✅ Siap |
| Akun/profil: `/v1/get/accounts/*`, `/v1/get/profiles/*` | ✅ Siap | ◐ Sebagian; 🔐 Credential Meta/scope akun | ◐ Bergantung upstream; 🔐 upstream compliant | ⛔ Dinonaktifkan |
| Followers/following | ✅ Siap | ⛔ Dinonaktifkan; batasan Meta yang aman di sini | ◐ Bergantung upstream; 🔐 upstream compliant | ⛔ Dinonaktifkan |
| Baca konten: foto/feed/status/post/reel/media berdasarkan user/link/id | ✅ Siap | ⛔ Dinonaktifkan kecuali baca tertentu yang didukung provider | ◐ Bergantung upstream; 🔐 upstream compliant | ⛔ Dinonaktifkan |
| Baca komentar | ✅ Siap | ⛔ Dinonaktifkan kecuali scope yang disetujui diimplementasikan | ◐ Bergantung upstream; 🔐 upstream compliant | ⛔ Dinonaktifkan |
| Discovery: mention, media hashtag | ✅ Siap | ⛔ Dinonaktifkan kecuali scope yang disetujui diimplementasikan | ◐ Bergantung upstream; 🔐 upstream compliant | ⛔ Dinonaktifkan |
| Insights | ✅ Siap | ◐ Sebagian; 🔐 Credential Meta, IG user ID, scope yang disetujui | ⛔ Dinonaktifkan | ⛔ Dinonaktifkan |
| Messaging/percakapan | ✅ Siap | ⛔ Dinonaktifkan kecuali scope Messenger/IG disetujui dan diimplementasikan | ⛔ Dinonaktifkan | ⛔ Dinonaktifkan |
| Write/aksi: follow, unfollow, publish, reply komentar, kirim pesan | 🧪 Hanya dry-run | ⛔ Dinonaktifkan; tidak ada batasan otomatisasi/write | ⛔ Dinonaktifkan/hanya-baca | ⛔ Dinonaktifkan sampai integrasi consent direview |

Gunakan tabel endpoint di bawah sebagai contract gateway kanonis. Gunakan matriks ini untuk menentukan apakah sebuah provider mengembalikan data live, response dry-run, error provider eksplisit, atau peringatan readiness.

## System

<!-- Endpoint system tersedia untuk semua provider. -->

| Method | Path | Deskripsi | Status provider |
|---|---|---|---|
| GET | `/health` | Kesehatan layanan. | ✅ Semua provider |
| GET | `/ready` | Readiness dan peringatan konfigurasi provider. | ✅ Mock; 🔐/◐ non-mock tergantung env |
| GET | `/live` | Probe liveness. | ✅ Semua provider |
| GET | `/metrics` | Metrik gaya Prometheus. Tambahkan `?format=json` untuk JSON. | ✅ Semua provider |
| GET | `/capabilities` | Provider aktif dan kemampuan operasi yang aman. | ✅ Mock; 🔐/◐ non-mock tergantung env |

## Route Resmi dan Legacy

<!-- Route kanonis menggunakan prefix /v1. Route legacy dipertahankan untuk kompatibilitas klien lama. -->

Route API kanonis menggunakan `/v1`. Route baca `/v1/get/...` adalah contract resmi untuk akun, profil, relasi, dan media.

Alias legacy dipertahankan untuk klien yang sudah ada dan mengembalikan standard JSON envelope yang sama:

| Path legacy | Pengganti |
|---|---|
| `/api/v1/*` | `/v1/*` |
| `/api/v1/instagram/:identifier` | `/v1/get/profiles/:identifier` |
| `/v1/accounts/:identifier` | `/v1/get/accounts/:identifier` |
| `/v1/profiles/by-link` | `/v1/get/profiles/by-link` |
| `/v1/profiles/:identifier` | `/v1/get/profiles/:identifier` |
| `/v1/followers/:identifier` | `/v1/get/followers/:identifier` |
| `/v1/following/:identifier` | `/v1/get/following/:identifier` |
| `/v1/posts/by-link` | `/v1/get/posts/by-link` |
| `/v1/posts/:id` | `/v1/get/posts/:id` |

## Akun, Profil, Followers, Following

<!-- Endpoint baca untuk akun, profil, dan relasi sosial. -->

| Method | Path | Query/body | Status provider |
|---|---|---|---|
| GET | `/v1/get/accounts/:identifier` | ID atau username. | ✅ Mock; ◐/🔐 Official; ◐/🔐 Public; ⛔ Authorized |
| GET | `/v1/get/profiles/:identifier` | ID atau username. | ✅ Mock; ◐/🔐 Official; ◐/🔐 Public; ⛔ Authorized |
| GET | `/v1/get/profiles/by-link` | `link` atau `url`. | ✅ Mock; ◐/🔐 Official; ◐/🔐 Public; ⛔ Authorized |
| GET | `/v1/get/followers/:identifier` | `limit`, `page`, `cursor`, `all`. | ✅ Mock; ⛔ Official; ◐/🔐 Public; ⛔ Authorized |
| GET | `/v1/get/following/:identifier` | `limit`, `page`, `cursor`, `all`. | ✅ Mock; ⛔ Official; ◐/🔐 Public; ⛔ Authorized |

## Konten

<!-- Endpoint baca untuk foto, feed, status, post, reel, dan media. -->

| Method | Path | Status provider |
|---|---|---|
| GET | `/v1/get/photos/users/:identifier` | ✅ Mock; ⛔ Official; ◐/🔐 Public; ⛔ Authorized |
| GET | `/v1/get/photos/by-link?link=` | ✅ Mock; ⛔ Official; ◐/🔐 Public; ⛔ Authorized |
| GET | `/v1/get/feeds/users/:identifier` | ✅ Mock; ⛔ Official; ◐/🔐 Public; ⛔ Authorized |
| GET | `/v1/get/feeds/by-link?link=` | ✅ Mock; ⛔ Official; ◐/🔐 Public; ⛔ Authorized |
| GET | `/v1/get/statuses/users/:identifier` | ✅ Mock; ⛔ Official; ◐/🔐 Public; ⛔ Authorized |
| GET | `/v1/get/statuses/by-link?link=` | ✅ Mock; ⛔ Official; ◐/🔐 Public; ⛔ Authorized |
| GET | `/v1/get/posts/users/:identifier` | ✅ Mock; ⛔ Official; ◐/🔐 Public; ⛔ Authorized |
| GET | `/v1/get/posts/:id` | ✅ Mock; ⛔ Official; ◐/🔐 Public; ⛔ Authorized |
| GET | `/v1/get/posts/by-link?link=` | ✅ Mock; ⛔ Official; ◐/🔐 Public; ⛔ Authorized |
| GET | `/v1/get/reels/users/:identifier` | ✅ Mock; ⛔ Official; ◐/🔐 Public; ⛔ Authorized |
| GET | `/v1/get/reels/by-link?link=` | ✅ Mock; ⛔ Official; ◐/🔐 Public; ⛔ Authorized |
| GET | `/v1/get/media/users/:identifier` | ✅ Mock; ⛔ Official; ◐/🔐 Public; ⛔ Authorized |
| GET | `/v1/get/media/by-link?link=` | ✅ Mock; ⛔ Official; ◐/🔐 Public; ⛔ Authorized |

## Aksi dan Publishing

<!-- Semua operasi write menggunakan dry-run yang aman pada mode mock. -->

Semua operasi write adalah dry-run yang aman pada `mock`. Provider selain mock tidak mengeksekusi write secara diam-diam: aksi yang tidak didukung gagal secara eksplisit kecuali implementasi provider yang direview menambahkan batasan live yang aman di masa depan.

| Method | Path | Body | Status provider |
|---|---|---|---|
| POST | `/v1/actions/follow/:identifier` | `{ "dryRun": true }` | 🧪 Mock; ⛔ Official/Public/Authorized |
| POST | `/v1/actions/unfollow/:identifier` | `{ "dryRun": true }` | 🧪 Mock; ⛔ Official/Public/Authorized |
| POST | `/v1/publish/media` | `{ "mediaUrl", "mediaType", "caption", "dryRun" }` | 🧪 Mock; ⛔ Official/Public/Authorized |
| POST | `/v1/publish/reels` | `{ "mediaUrl", "mediaType", "caption", "dryRun" }` | 🧪 Mock; ⛔ Official/Public/Authorized |
| POST | `/v1/publish/photos` | `{ "mediaUrl", "mediaType", "caption", "dryRun" }` | 🧪 Mock; ⛔ Official/Public/Authorized |
| POST | `/v1/publish/feeds` | `{ "mediaUrl", "mediaType", "caption", "dryRun" }` | 🧪 Mock; ⛔ Official/Public/Authorized |
| POST | `/v1/publish/statuses` | `{ "mediaUrl", "mediaType", "caption", "dryRun" }` | 🧪 Mock; ⛔ Official/Public/Authorized |

## Komentar, Discovery, Insights, Messaging

<!-- Endpoint untuk komentar, discovery, insights, dan messaging. -->

| Method | Path | Query/body | Status provider |
|---|---|---|---|
| GET | `/v1/comments` | opsional `link`, pagination. | ✅ Mock; ⛔ Official; ◐/🔐 Public; ⛔ Authorized |
| POST | `/v1/comments/:id/reply` | `{ "text", "dryRun" }` | 🧪 Mock; ⛔ Official/Public/Authorized |
| POST | `/v1/comments/reply` | `{ "id" atau "link", "text", "dryRun" }` | 🧪 Mock; ⛔ Official/Public/Authorized |
| GET | `/v1/mentions` | pagination. | ✅ Mock; ⛔ Official; ◐/🔐 Public; ⛔ Authorized |
| GET | `/v1/hashtags/media` | `hashtag` atau `tag`, pagination. | ✅ Mock; ⛔ Official; ◐/🔐 Public; ⛔ Authorized |
| GET | `/v1/insights` | tergantung provider. | ✅ Mock; ◐/🔐 Official; ⛔ Public/Authorized |
| GET | `/v1/conversations` | pagination. | ✅ Mock; ⛔ Official/Public/Authorized |
| GET | `/v1/messages` | pagination. | ✅ Mock; ⛔ Official/Public/Authorized |
| GET | `/v1/messages/:id` | thread pesan. | ✅ Mock; ⛔ Official/Public/Authorized |
| POST | `/v1/messages/:id/send` | `{ "recipientId" atau "username", "text", "dryRun" }` | 🧪 Mock; ⛔ Official/Public/Authorized |

## Validasi

<!-- Aturan validasi input yang diterapkan pada seluruh endpoint. -->

- `username`: huruf, angka, titik, underscore; tidak boleh titik berurutan/trailing; maks 30 karakter.
- `id`: wajib, hanya karakter aman, maks 128 karakter.
- `link`: harus menggunakan host Instagram dan path yang didukung (`p`, `reel`, `tv`, `stories`, atau profil yang didukung).
- `limit`: integer, dibatasi oleh `MAX_LIMIT`.
- `dryRun`: default `true` untuk aksi write.

`POST /v1/comments/reply` menerima `id` atau `link`. Jika keduanya ada, `id` yang diprioritaskan karena merupakan target eksplisit dan menghindari ambiguitas URL.