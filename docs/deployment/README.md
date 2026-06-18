# Kaw Kaw — Deployment (Phase 1: API)

The API is containerized and deployed to **Render** at `api.kawkaw.in`. PostgreSQL is on
**Aiven**, Redis on **Upstash**, auth/FCM on **Firebase (kawkaw08)**. The admin dashboard
(Phase 4) deploys to **Vercel** at `admin.kawkaw.in`.

## 1. Provision managed services

| Service | Provider | Output you need |
|---------|----------|-----------------|
| PostgreSQL | Aiven | `DATABASE_URL` (`postgres://…?sslmode=require`) |
| Redis | Upstash | `REDIS_URL` (`rediss://…`) |
| Auth + FCM | Firebase (`kawkaw08`) | service-account `client_email` + `private_key` |

## 2. Environment variables

Copy `services/api/.env.example` → `.env` for local; in production set them in the
**Render dashboard** (or via `infra/deployment/render.yaml` with `sync:false` secrets).

Required: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`,
`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.
Recommended: `NODE_ENV=production`, `API_URL`, `ADMIN_URL`, `CORS_ORIGINS`.

Generate JWT secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

`FIREBASE_PRIVATE_KEY`: paste the full key; escaped `\n` are converted to real newlines
at runtime. In Render, paste the multi-line key directly into the secret field.

> **Security:** never commit `.env`. Keep production secrets in the provider dashboards.
> If editing locally inside a cloud-synced folder (OneDrive/Dropbox), be aware the file syncs.

## 3. Database migrations

Migrations live in `services/api/prisma/migrations` and are applied automatically on
container start (`prisma migrate deploy` in the Dockerfile `CMD`). To run manually:

```bash
cd services/api
npm run prisma:migrate:deploy      # apply committed migrations to DATABASE_URL
npm run db:seed                    # settings + starter categories (reference data only)

# Bootstrap the first admin out-of-band (never seeded, never hardcoded):
ADMIN_PHONE=+919999999999 ADMIN_ROLE=SUPER_ADMIN ADMIN_NAME="Founder" npm run admin:create
```

Thereafter, super-admins create further admins via the API (`POST /api/v1/admin/admins`).

To create a new migration during development:

```bash
npm run prisma:migrate:dev -- --name <change>
```

## 4. Deploy to Render

**Option A — Blueprint:** commit `infra/deployment/render.yaml`, then in Render
"New → Blueprint" and point at the repo. Set the `sync:false` secrets in the dashboard.

**Option B — manual:** New → Web Service → Docker, repo root as context,
`services/api/Dockerfile` as the Dockerfile, health check `/api/v1/health/ready`.

Then map the custom domain `api.kawkaw.in` (CNAME to the Render service) and enable TLS.

## 5. Local Docker

```bash
docker compose -f infra/docker/docker-compose.yml up -d postgres redis
docker compose -f infra/docker/docker-compose.yml up --build api
# API → http://localhost:3000/api/v1 , docs → /api/docs
```

## 6. CI

`.github/workflows/api-ci.yml` runs on every push/PR touching the API: install →
build shared types → prisma generate/validate → lint → typecheck → migrate (ephemeral PG)
→ build → unit tests → Docker build. A deploy workflow is added in Phase 5.

## 7. Smoke test after deploy

```bash
curl https://api.kawkaw.in/api/v1/health/ready
curl https://api.kawkaw.in/api/v1/settings/public
# open https://api.kawkaw.in/api/docs
```

## DNS summary

| Host | Target |
|------|--------|
| `api.kawkaw.in` | Render web service (CNAME) |
| `admin.kawkaw.in` | Vercel (Phase 4) |
