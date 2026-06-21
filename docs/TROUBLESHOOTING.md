# 🧯 Troubleshooting

## `PUPPETEER_NOT_INSTALLED`

Penyebab:

- Anda menjalankan `npm install --omit=optional` tetapi APP_MODE memakai scraper.

Solusi:

```bash
npm install
```

Atau gunakan Docker scraper:

```bash
docker compose up --build
```

## Meta API error

Periksa:

- `META_ACCESS_TOKEN`
- `META_IG_USER_ID`
- Akun Instagram sudah Business/Creator
- Permission aplikasi Meta sudah benar
- Token belum expired

## Vercel deploy berat

Gunakan official mode saja:

```env
APP_MODE=official
SCRAPER_ENABLED=false
```

Lalu install tanpa optional dependency:

```bash
npm install --omit=optional
```

## Scraper kosong

Kemungkinan:

- Instagram mengubah markup halaman.
- Profil private.
- Profil memerlukan login.
- Request terkena rate limit.
- IP server dibatasi.

Gunakan cache, turunkan concurrency, dan pertimbangkan jalur official API.
