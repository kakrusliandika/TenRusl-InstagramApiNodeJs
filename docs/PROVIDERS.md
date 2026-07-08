<!-- Dokumen ini berisi penjelasan tentang adapter provider yang tersedia. -->
<!-- Nama provider, method, endpoint, dan key teknis tetap dalam bahasa Inggris. -->

# Adapter Provider

Pemilihan provider dikontrol oleh `IG_PROVIDER`.

Full API contract berjalan penuh pada mode mock. Perilaku live Instagram bergantung pada credential resmi, scope Meta, upstream yang compliant, dan implementasi provider yang aktif.

| Provider | Status production | Env yang diperlukan | Perilaku |
|---|---|---|---|
| `mock` | Default yang aman | tidak ada | Data lokal deterministik; contract write mengembalikan response dry-run. |
| `official` | Sebagian | `META_GRAPH_BASE_URL`, `META_API_VERSION`, `META_ACCESS_TOKEN`, `META_IG_USER_ID` | Menggunakan Meta/Instagram Graph API resmi hanya untuk operasi baca akun/profil/insight yang didukung; operasi yang tidak didukung gagal secara eksplisit. |
| `public` | Dinonaktifkan secara default | `PUBLIC_DATA_ENABLED=true`, `PUBLIC_DATA_UPSTREAM_URL` | Hanya proxy ke upstream public data yang kamu kontrol; operasi private/write gagal dengan `403`. |
| `authorized` | Dinonaktifkan / belum siap production | `AUTHORIZED_PROVIDER_ENABLED=true`, `AUTHORIZED_SESSION_TOKEN`, `AUTHORIZED_INTEGRATION_REVIEWED=true` plus implementasi kode yang sudah direview | Dicadangkan untuk data yang dimiliki atau yang sudah disetujui secara eksplisit setelah review integrasi; operasi live belum diimplementasikan. |

Semua provider mengekspos method contract gateway controller yang sama. Contract didokumentasikan di `src/providers/instagram/provider.contract.js` dan divalidasi saat instance provider dibuat. Perilaku live yang tidak didukung harus gagal dengan error provider eksplisit, bukan kembali ke data production palsu.

## Matriks Kemampuan

<!-- Tabel ini menunjukkan kemampuan setiap provider berdasarkan jenis operasi. -->

| Provider | Baca publik/profil | Baca media/komentar | Insights | Write/aksi privat | Flag batasan |
|---|---:|---:|---:|---:|---|
| `mock` | ya | ya | ya | hanya dry-run | data lokal deterministik |
| `official` | sebagian | tidak | sebagian | tidak | `officialApiOnly=true` |
| `public` | tergantung upstream | tergantung upstream | tidak | tidak | `requiresCompliantUpstream=true` |
| `authorized` | tidak | tidak | tidak | tidak | `requiresReviewedIntegration=true` |

Nilai kemampuan dikembalikan oleh `/capabilities` dan oleh setiap method `status()` provider. Nilai ini mendeskripsikan batasan gateway yang diimplementasikan, bukan setiap fitur yang mungkin disediakan oleh Instagram atau Meta.

## Matriks Kesiapan Production

<!-- Tabel ini menunjukkan status kesiapan production setiap area. -->

| Area | Status | Arti production |
|---|---|---|
| Skeleton API | Siap sebagai gateway skeleton yang bisa di-deploy | Express, validasi, envelope, middleware keamanan, probe, Docker, CI, dan docs dipelihara. |
| Provider mock | Siap untuk preview/demo production | Gateway deterministik yang aman, tidak ada state Instagram live, contract write selalu dry-run. |
| Provider official | Sebagian siap | Siap hanya untuk operasi baca Meta Graph API akun/profil/insight yang sudah diimplementasikan dan hanya ketika env Meta sudah lengkap. |
| Provider public | Bersyarat | Siap hanya jika upstream yang dikonfigurasi legal, compliant, reliable, dan dimiliki/dikontrol oleh yang deploy. |
| Provider authorized | Terblokir | Belum siap untuk traffic production sampai integrasi yang sudah direview ada di kode dan operasi yang tidak didukung diimplementasikan secara aman. |

## Mock

<!-- Penjelasan provider mock. -->

- Provider default.
- Tidak ada panggilan jaringan eksternal.
- Semua endpoint mengembalikan data mock deterministik.
- Endpoint write mengembalikan response dry-run yang diterima.
- Terbaik untuk CI/CD dan preview deployment.

## Official

<!-- Penjelasan provider official. -->

- Batasan untuk Instagram Graph API / Meta API.
- Memerlukan `META_ACCESS_TOKEN` dan `META_IG_USER_ID`.
- Memerlukan `META_GRAPH_BASE_URL` dan `META_API_VERSION`.
- Mengirim access token sebagai header `Authorization: Bearer`, bukan sebagai query parameter.
- Memvalidasi `META_GRAPH_BASE_URL`, `META_API_VERSION`, dan `META_IG_USER_ID` sebelum melaporkan ready.
- Menangani timeout upstream, response non-JSON, dan response error Graph API sebagai error upstream provider.
- Gunakan hanya scope yang disetujui untuk app kamu dan akun Business/Creator yang terautentikasi.
- Automasi follow/unfollow tidak diekspos oleh adapter aman ini.

## Public

<!-- Penjelasan provider public. -->

- Batasan hanya-baca untuk data publik yang diizinkan oleh hukum dan ketentuan platform.
- Memerlukan `PUBLIC_DATA_ENABLED=true` dan `PUBLIC_DATA_UPSTREAM_URL` yang valid.
- `PUBLIC_DATA_UPSTREAM_URL` harus berupa URL HTTP/HTTPS tanpa credential yang tertanam.
- Tidak melewati login, kontrol anti-bot, rate limit, atau kontrol akses.
- Operasi write dan private dinonaktifkan dengan `403`.

## Authorized

<!-- Penjelasan provider authorized. -->

- Batasan lanjutan untuk data yang dimiliki atau data dengan izin eksplisit.
- Dinonaktifkan secara default melalui `AUTHORIZED_PROVIDER_ENABLED=false`.
- Memerlukan `AUTHORIZED_PROVIDER_ENABLED=true` dan `AUTHORIZED_SESSION_TOKEN` sebelum batasan ini bisa dipilih.
- Memerlukan `AUTHORIZED_INTEGRATION_REVIEWED=true` dan implementasi yang sudah direview di kode sebelum readiness bisa lolos.
- Tidak menyimpan password mentah.
- Operasi live mengembalikan `501` sampai kamu menambahkan consent yang sudah direview dan logika integrasi yang aman.

## Provider Contract

<!-- Penjelasan contract yang harus diimplementasikan setiap provider. -->

Setiap provider harus mengimplementasikan method berikut:

- `ready()`: memeriksa kesiapan provider dan mengembalikan status.
- `status()`: mengembalikan informasi status provider termasuk kemampuan.
- `capabilities()`: mengembalikan batasan operasi yang aman.
- Semua method operasi baca: `getProfile()`, `getPosts()`, `getFollowers()`, dll.
- Semua method operasi write: `follow()`, `unfollow()`, `publishMedia()`, `replyComment()`, `sendMessage()`, dll.

Method operasi write pada mode mock selalu mengembalikan response dry-run. Method operasi write pada provider non-mock harus gagal secara eksplisit jika tidak diimplementasikan.

## Catatan Kepatuhan dan Penggunaan yang Bertanggung Jawab

<!-- Catatan penting tentang penggunaan yang sesuai aturan. -->

Project ini **tidak boleh** digunakan untuk:

- Scraping data Instagram.
- Melewati kontrol anti-bot atau login.
- Spam atau bulk messaging.
- Automasi yang melanggar ketentuan platform Instagram/Meta.
- Mengakses data tanpa izin dari pemiliknya.

Gunakan project ini hanya untuk:

- Integrasi resmi yang disetujui oleh Meta.
- Data yang kamu miliki atau yang sudah disetujui secara eksplisit.
- Testing dan development dengan mode mock.
- Upstream public data yang legal, compliant, dan kamu kontrol.