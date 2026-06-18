# Kaw Kaw API (NestJS)

Backend for the Kaw Kaw delivery platform. NestJS + Prisma + PostgreSQL + Redis,
Firebase auth, Socket.IO realtime, Swagger docs. Cash-On-Delivery only (V1).

## Prerequisites

- Node.js ≥ 20, npm ≥ 10
- PostgreSQL (local via Docker, or Aiven) and Redis (local via Docker, or Upstash)
- A Firebase service account for project `kawkaw08` (for OTP token verification + FCM)

## Setup

```bash
# from repo root
npm install
npm run build --workspace @kawkaw/shared-types

cd services/api
cp .env.example .env          # fill in DATABASE_URL, REDIS_URL, JWT secrets, Firebase creds
npm run prisma:generate
npm run prisma:migrate:deploy # apply migrations (or prisma:migrate:dev to create new ones)
npm run db:seed               # settings + starter categories (reference data only)
ADMIN_PHONE=+9199... npm run admin:create   # bootstrap the first SUPER_ADMIN (out-of-band)
```

### Local infra with Docker

```bash
# from repo root — Postgres + Redis only
docker compose -f infra/docker/docker-compose.yml up -d postgres redis
# or the full stack incl. the API container
docker compose -f infra/docker/docker-compose.yml up --build
```

## Run

```bash
npm run start:dev     # watch mode
npm run start:prod    # from built dist/
```

- Base URL: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/api/docs`
- Health: `GET /api/v1/health/live`, `GET /api/v1/health/ready`

## Scripts

| Script | Purpose |
|--------|---------|
| `start:dev` / `start:prod` | run (watch / built) |
| `build` | `nest build` |
| `typecheck` | `tsc --noEmit` |
| `lint` / `lint:check` | ESLint (fix / check) |
| `test` / `test:cov` | Jest unit tests / coverage |
| `prisma:generate` | generate Prisma client |
| `prisma:migrate:dev` | create + apply a migration locally |
| `prisma:migrate:deploy` | apply pending migrations (prod) |
| `prisma:validate` | validate the schema |
| `db:seed` | seed settings + categories (reference data only) |
| `admin:create` | create/promote an admin (`ADMIN_PHONE`, `ADMIN_ROLE`, `ADMIN_NAME`) |
| `test:e2e` | integration/e2e tests (needs an isolated DB schema) |

## Layout

```
src/
├── main.ts            bootstrap (helmet, CORS, versioning, validation, Swagger)
├── app.module.ts      wiring + global guards/filters/interceptors/throttler
├── common/            config, enums, decorators, guards, filters, interceptors, dto, utils
├── prisma/            PrismaService (source of truth)
├── redis/             RedisService + throttler storage (ephemeral cache/queue)
├── firebase/          Firebase Admin (token verify + FCM)
├── health/            liveness/readiness
├── websocket/         Socket.IO gateway (order lifecycle, rider location)
└── modules/           auth, users, addresses, categories, products, inventory,
                       orders, parcels, prescriptions, riders, notifications,
                       coupons, settings, admins, audit
```

See [docs/api](../../docs/api) for the REST contract, error standards, and the Postman collection.
