# Contributing

Terima kasih ingin berkontribusi pada TenRusl Instagram API Gateway.

## Prinsip

- Default aman: mock provider, dry-run action, tanpa secret hardcoded.
- Provider non-resmi harus terpisah dan tidak boleh melewati login, proteksi, rate-limit, atau kontrol akses.
- Semua endpoint harus memakai response envelope standar.
- Halaman statis di `public/` hanya boleh berisi informasi non-sensitif dan harus sinkron dengan versi `package.json`.
- Tambahkan test saat menambah endpoint atau provider.

## Workflow

```bash
npm install
npm run check
npm test
npm run doctor
npm run lint
```

Buat pull request dengan ringkasan perubahan, risiko, dan hasil test.
