<div align="center">

# CMSx

### The Blazing-Fast Headless CMS

A self-hosted headless CMS built with Rust and Next.js.<br>
10-40x faster than Node.js alternatives. Deploy in 60 seconds.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-ready-2496ED?logo=docker&logoColor=white)](docker-compose.yml)
[![Rust](https://img.shields.io/badge/backend-Rust-DEA584?logo=rust&logoColor=white)](#tech-stack)
[![Next.js](https://img.shields.io/badge/frontend-Next.js_16-000000?logo=next.js&logoColor=white)](#tech-stack)
[![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL-4169E1?logo=postgresql&logoColor=white)](#tech-stack)
[![TypeScript](https://img.shields.io/badge/lang-TypeScript-3178C6?logo=typescript&logoColor=white)](#tech-stack)

<br>

[Quick Start](#quick-start) &bull; [Features](#features) &bull; [Benchmarks](#benchmarks) &bull; [Deployment](#deployment) &bull; [API Reference](#api-reference)

<br>

<img src="https://img.shields.io/badge/Content_Reads-12,600_req/s-22c55e?style=for-the-badge" alt="12,600 req/s reads">
<img src="https://img.shields.io/badge/Content_Writes-3,400_req/s-22c55e?style=for-the-badge" alt="3,400 req/s writes">
<img src="https://img.shields.io/badge/Avg_Latency-~8ms-22c55e?style=for-the-badge" alt="~8ms latency">
<img src="https://img.shields.io/badge/Memory-~30MB-22c55e?style=for-the-badge" alt="~30MB RAM">

</div>

---

## Quick Start

```bash
git clone https://github.com/jorgedevai/cmsx.git && cd cmsx

# Create .env with secure defaults
cp .env.example .env
sed -i "s/^JWT_SECRET=.*/JWT_SECRET=$(openssl rand -hex 32)/" .env
sed -i "s/^ENCRYPTION_KEY=.*/ENCRYPTION_KEY=$(openssl rand -hex 32)/" .env
sed -i "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$(openssl rand -hex 16)/" .env

# Launch
docker compose up -d
```

Open **http://localhost:3000** and register the first admin user.

> The first registered user automatically becomes the admin. Registration closes after that -- new users must be invited.

---

## Features

<table>
<tr>
<td width="50%">

### Content Management
- Dynamic schema builder (Text, RichText, Number, Boolean, Date, Image, Reference)
- Content versioning with full history and rollback
- Draft / Published / Archived / Scheduled states
- Scheduled publishing (`publish_at`)
- HTML sanitization (XSS protection via ammonia)
- Pagination, sorting, and JSON query filters

</td>
<td width="50%">

### Media & Assets
- Drag-and-drop uploads (up to 50MB)
- Hierarchical folder organization
- Gallery views (list, grid, stack)
- Magic bytes validation (prevents disguised uploads)
- EXIF stripping and image re-encoding
- Local filesystem or Cloudflare R2

</td>
</tr>
<tr>
<td>

### Security
- JWT + refresh token rotation (httpOnly cookies)
- Argon2id password hashing
- AES-256-GCM field-level encryption
- RBAC: Admin > Editor > Viewer
- Rate limiting (per-endpoint + login lockout)
- HMAC-SHA256 webhook signatures
- Audit log for all operations
- HSTS, CSP, X-Frame-Options headers

</td>
<td>

### Developer Experience
- 30+ REST API endpoints
- OpenAPI/Swagger auto-generated docs
- Scoped API keys with usage tracking
- Webhooks (content.created, updated, deleted)
- Public read API (no auth required)
- Import/Export system
- Automatic DB migrations on startup

</td>
</tr>
<tr>
<td>

### Dashboard
- Modern UI with shadcn/ui + Tailwind CSS
- Rich text editor (Tiptap/ProseMirror)
- Real-time analytics and usage charts
- Session management with revocation
- i18n (English + Spanish)
- Dark mode

</td>
<td>

### AI Content Generation
- Claude integration for content generation
- Real-time streaming (Server-Sent Events)
- Built into the content editor
- Optional -- activate with your API key

</td>
</tr>
</table>

---

## Benchmarks

All benchmarks measured with `hey` (HTTP load generator), 10,000 concurrent requests, release build.

### Throughput

| Operation | req/s | Avg Latency | p50 | p95 | p99 |
|-----------|------:|------------:|----:|----:|----:|
| Health Check | **54,985** | 3.5ms | 0.9ms | 4.9ms | 32.6ms |
| List Schemas (auth + DB) | **12,231** | 8.1ms | 2.0ms | 10.6ms | 33.8ms |
| Get Schema (auth + DB) | **12,667** | 7.8ms | 7.2ms | 8.9ms | 35.2ms |
| Create Content (auth + validate + sanitize + DB write) | **3,397** | 14.7ms | 14.4ms | 16.1ms | 21.4ms |
| List Content paginated (~10k rows) | **1,570** | 31.7ms | 30.3ms | 35.9ms | 40.5ms |
| Login (Argon2id + JWT + DB) | **47,331** | 0.4ms | - | - | - |

### vs. Node.js Alternatives

| Metric | CMSx (Rust) | Strapi | Directus | Ghost |
|--------|------------:|-------:|---------:|------:|
| Content Read (req/s) | **12,600+** | ~300-800 | ~400-1,000 | ~500-1,200 |
| Content Write (req/s) | **3,400+** | ~100-300 | ~150-400 | ~200-500 |
| Read Latency (avg) | **~8ms** | ~50-150ms | ~40-100ms | ~30-80ms |
| Write Latency (avg) | **~15ms** | ~100-300ms | ~80-200ms | ~60-150ms |
| Memory Footprint | **~30MB** | ~200-500MB | ~150-400MB | ~150-300MB |
| Cold Start | **<1s** | ~3-8s | ~2-5s | ~2-4s |

> CMSx is **10-40x faster** than Node.js-based headless CMS alternatives in read and write operations.

---

## Deployment

### Option 1: All-in-One (Docker Compose)

Runs PostgreSQL + Backend + Frontend together. Best for VPS, dedicated servers, or local development.

```bash
docker compose up -d
```

### Option 2: Backend + DB Only

Use when deploying the frontend separately (Vercel, Netlify, Cloudflare Pages, etc.):

```bash
docker compose -f docker-compose.backend.yml up -d
```

Then deploy the `frontend/` directory with these environment variables:

| Variable | Value |
|----------|-------|
| `BACKEND_URL` | `https://api.yourdomain.com/api/v1` |
| `NEXT_PUBLIC_ASSET_URL` | `https://api.yourdomain.com` or your R2 public URL |
| `COOKIE_DOMAIN` | `.yourdomain.com` (for cross-subdomain auth) |
| `SECURE_COOKIES` | `true` |

### Frontend Development

```bash
cd frontend
bun install
BACKEND_URL=http://localhost:8080/api/v1 bun dev
```

---

## Configuration

All settings via environment variables in `.env`. See [`.env.example`](.env.example) for the full list.

### Required

| Variable | Description |
|----------|-------------|
| `POSTGRES_PASSWORD` | Database password |
| `JWT_SECRET` | 64+ char random hex (`openssl rand -hex 32`) |
| `ENCRYPTION_KEY` | 64 hex chars / 32 bytes (`openssl rand -hex 32`) |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `STORAGE_TYPE` | `local` | `local` or `r2` (Cloudflare R2) |
| `AI_ENABLED` | `false` | Enable AI content generation |
| `ANTHROPIC_API_KEY` | - | Required when AI is enabled |
| `CORS_ORIGINS` | `http://localhost:3000` | Frontend URL(s), comma-separated |
| `COOKIE_DOMAIN` | - | Set for cross-subdomain auth |
| `SECURE_COOKIES` | - | `true` when using HTTPS |
| `RATE_LIMIT_AUTH` | `5` | Auth endpoint requests/minute |
| `RATE_LIMIT_GLOBAL` | `100` | Global requests/minute |

---

## API Reference

### Public API (no auth)

```
GET  /api/v1/public/schemas
GET  /api/v1/public/schemas/:slug
GET  /api/v1/public/content/:schema_slug
GET  /api/v1/public/content/:schema_slug/:slug
```

### Auth

```
POST /api/v1/auth/register          # First user only
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
POST /api/v1/auth/invite            # Admin only
POST /api/v1/auth/accept-invite
```

### Content (authenticated)

```
POST   /api/v1/content/:schema_slug           # Create (Editor+)
GET    /api/v1/content/:schema_slug           # List (Viewer+)
PUT    /api/v1/content/:schema_slug/:id       # Update (Editor+)
DELETE /api/v1/content/:schema_slug/:id       # Delete (Editor+)
GET    /api/v1/content/:schema_slug/:id/versions          # Version history
POST   /api/v1/content/:schema_slug/:id/versions/:v/restore  # Restore version
```

### Schemas, Assets, Users, Webhooks, API Keys, Analytics

Full OpenAPI documentation available at `/api-docs/openapi.json` when the backend is running.

For authenticated API access, create an API key in the dashboard and pass it via `X-Api-Key` header.

---

## Tech Stack

<table>
<tr>
<td align="center" width="96"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-original.svg" width="48" height="48" alt="Rust"><br><sub>Rust</sub></td>
<td align="center" width="96"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg" width="48" height="48" alt="Next.js"><br><sub>Next.js 16</sub></td>
<td align="center" width="96"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="48" height="48" alt="React"><br><sub>React 19</sub></td>
<td align="center" width="96"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="48" height="48" alt="TypeScript"><br><sub>TypeScript</sub></td>
<td align="center" width="96"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" width="48" height="48" alt="PostgreSQL"><br><sub>PostgreSQL</sub></td>
<td align="center" width="96"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" width="48" height="48" alt="Docker"><br><sub>Docker</sub></td>
<td align="center" width="96"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg" width="48" height="48" alt="Tailwind"><br><sub>Tailwind 4</sub></td>
</tr>
</table>

| Layer | Technologies |
|-------|-------------|
| **Backend** | Rust, Axum, SeaORM, PostgreSQL, Tower |
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui |
| **Auth** | JWT + httpOnly cookies, Argon2id, refresh token rotation |
| **Encryption** | AES-256-GCM field-level, HMAC-SHA256 webhooks |
| **Storage** | Local filesystem / Cloudflare R2 (S3-compatible) |
| **Editor** | Tiptap (ProseMirror) |
| **Architecture** | Hexagonal (Ports & Adapters) |

---

## License

[MIT](LICENSE) -- use it however you want.
