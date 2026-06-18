# Kaw Kaw

> Need it delivered right away.

Multi-service hyperlocal delivery platform for **Bhadrachalam, Telangana, India**.
Built and operated by **KawKawTech Pvt Ltd**.

Services: **Grocery · Pharmacy · Food · Parcel Delivery**. Payments are **Cash On Delivery only** in Version 1.

---

## Monorepo layout

```
kawkaw/
├── apps/
│   ├── customer_app/        # Flutter — customer (Phase 2)
│   ├── rider_app/           # Flutter — rider (Phase 3)
│   └── admin_dashboard/     # Next.js + TS + Tailwind (Phase 4)
├── services/
│   └── api/                 # NestJS + Prisma + PostgreSQL + Redis (Phase 1)
├── packages/
│   ├── shared_types/        # Shared TypeScript types / OpenAPI contracts
│   ├── shared_ui/           # Shared Flutter UI kit
│   └── shared_utils/        # Shared Dart/TS utilities
├── infra/
│   ├── docker/              # Dockerfiles & compose
│   ├── github_actions/      # CI/CD workflow sources
│   └── deployment/          # Render / Vercel / Railway configs
└── docs/
    ├── architecture/
    ├── api/
    └── deployment/
```

## Phase status

| Phase | Scope | Status |
|------|-------|--------|
| 1 | Architecture, Database, Backend, Auth, Redis, Docker, Swagger | **Complete ✅** |
| 2 | Customer App (Flutter) | **Code complete ✅** (run `flutter analyze`/`test` locally) |
| 3 | Rider App (Flutter) | **Validated ✅** — built + run on emulator: login/OTP, register, verify-gate, online/offline, **background GPS (screen-locked)**, assignment modal, full delivery lifecycle, earnings |
| 4 | Admin Dashboard (Next.js) | **Build verified ✅** — 16 routes, all admin APIs 200; RBAC, orders/assign, catalog, users/riders, pharmacy, notifications, analytics, audit, settings |
| 5 | Testing, Deployment, CI/CD, Play Store | **Deployed ✅** — API on Render, admin on Vercel, CI/CD, signed AABs; launch score 76/100 (see [audit](docs/deployment/production-readiness-audit.md)) |

## Tech stack

| Concern | Choice |
|--------|--------|
| Mobile | Flutter · Riverpod · GoRouter · Dio |
| Backend | NestJS · Prisma · PostgreSQL (Avion) |
| Cache / queue | Redis (Upstash) |
| Auth | Firebase Authentication (project `kawkaw08`) + JWT |
| Notifications | Firebase Cloud Messaging |
| Maps | OpenStreetMap · flutter_map · OSRM · Nominatim |
| Admin | Next.js · TypeScript · TailwindCSS (Vercel) |
| Payments | Cash On Delivery only (V1) |
| Deploy | Docker · Render (`api.kawkaw.in`) · Vercel (`admin.kawkaw.in`) |

## Quick start (Phase 1 backend)

```bash
cd services/api
cp .env.example .env          # then fill in secrets
npm install
docker compose -f ../../infra/docker/docker-compose.yml up -d postgres redis
npm run prisma:generate
npm run prisma:migrate:dev
npm run start:dev             # http://localhost:3000/api/v1, docs at /api/docs
```

See [docs/deployment](docs/deployment) for full instructions.
