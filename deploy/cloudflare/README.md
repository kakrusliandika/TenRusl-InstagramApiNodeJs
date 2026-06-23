# Cloudflare Deployment Template

This folder is optional. It contains a Worker proxy template, not the Express runtime.

Cocok untuk edge proxy atau API facade ringan. Express server penuh lebih cocok di container; Cloudflare Worker dapat dipakai sebagai reverse proxy ke origin.

Environment: `ORIGIN_BASE_URL`, optional `API_KEY`.
