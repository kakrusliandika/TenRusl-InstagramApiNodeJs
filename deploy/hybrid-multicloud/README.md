# Hybrid Multi-Cloud

Cocok saat API gateway harus tetap hidup lintas region atau lintas penyedia cloud. Gunakan satu image container yang sama, health check `/ready`, DNS failover, dan secret manager per platform.

Flow ringkas:

```mermaid
flowchart LR
  DNS[DNS / Traffic Manager] --> CF[Cloudflare Edge]
  CF --> K8S[Kubernetes Primary]
  CF --> RUN[Cloud Run Secondary]
  CF --> VPS[VPS Fallback]
  K8S --> M[(Metrics / Logs)]
  RUN --> M
  VPS --> M
```
