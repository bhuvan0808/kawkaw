# Kaw Kaw — System Architecture

**Version:** 1.0 (Phase 1)
**Owner:** KawKawTech Pvt Ltd
**Launch market:** Bhadrachalam, Telangana, India

---

## 1. Overview

Kaw Kaw is a multi-service hyperlocal delivery platform offering **Grocery, Pharmacy,
Food, and Parcel** delivery. Version 1 is **Cash On Delivery only** (no payment gateway).

The system is a monorepo with four clients and one backend:

```
            ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐
            │ customer_app │   │  rider_app   │   │ admin_dashboard  │
            │  (Flutter)   │   │  (Flutter)   │   │   (Next.js)      │
            └──────┬───────┘   └──────┬───────┘   └────────┬─────────┘
                   │ HTTPS/WSS        │ HTTPS/WSS          │ HTTPS
                   └──────────────────┼────────────────────┘
                                      ▼
                        ┌──────────────────────────┐
                        │      NestJS API           │
                        │   /api/v1  + WebSocket     │
                        │  (Render — api.kawkaw.in) │
                        └───┬───────────┬────────┬──┘
                            │           │        │
                ┌───────────▼──┐  ┌─────▼────┐ ┌─▼──────────────┐
                │  PostgreSQL   │  │  Redis   │ │ Firebase       │
                │   (Avion)     │  │ (Upstash)│ │ Auth + FCM     │
                │ source of     │  │  cache / │ │ (kawkaw08)     │
                │ truth         │  │  queue   │ │                │
                └───────────────┘  └──────────┘ └────────────────┘
                                                  Maps: OSM / OSRM / Nominatim
```

## 2. Backend (NestJS)

Modular monolith. Each domain is a NestJS module with controller + service + DTOs.

```
src/
├── main.ts                 # bootstrap: helmet, CORS, versioning, Swagger, global pipes/filters
├── app.module.ts
├── common/                 # cross-cutting: config, guards, decorators, filters, interceptors, dto, enums
├── prisma/                 # PrismaService (PostgreSQL access — source of truth)
├── redis/                  # RedisService (cache, rate-limit, OTP, queue — never source of truth)
├── firebase/               # Firebase Admin (token verification, FCM)
├── health/                 # liveness/readiness probes
├── websocket/              # EventsGateway (order lifecycle, rider location)
└── modules/
    ├── auth/               # Firebase OTP exchange → JWT access/refresh, RBAC
    ├── users/              # customer profiles
    ├── addresses/          # saved addresses + geo
    ├── categories/         # catalogue categories
    ├── products/           # catalogue products
    ├── inventory/          # stock levels
    ├── orders/             # order lifecycle (grocery/pharmacy/food) + items
    ├── parcels/            # parcel delivery orders
    ├── prescriptions/      # pharmacy prescription uploads + verification
    ├── riders/             # rider profiles, online/offline, locations
    ├── notifications/      # in-app + FCM push
    ├── coupons/            # discount codes
    ├── admins/             # admin accounts, roles
    ├── settings/           # platform settings (delivery fee, hours, etc.)
    └── audit/              # audit log writes/reads
```

### Request pipeline

1. **Helmet** sets security headers.
2. **CORS** restricts origins to the customer/rider/admin apps.
3. **Rate limiting** (Redis-backed) throttles by IP + user.
4. **URI versioning** routes under `/api/v1`.
5. **Global `ValidationPipe`** (`whitelist`, `forbidNonWhitelisted`, `transform`) validates and sanitizes all DTOs.
6. **Guards**: `JwtAuthGuard` (default, opt-out with `@Public()`) → `RolesGuard` (RBAC via `@Roles()`).
7. **Interceptors**: request-id + structured logging; response transform → standard envelope.
8. **Exception filters**: normalize `HttpException` and Prisma errors to the standard error shape.

### AuthN / AuthZ

- Phone identity is established by **Firebase Authentication** (OTP) on the client.
- The client sends the **Firebase ID token** to `POST /api/v1/auth/firebase`.
- The API **verifies the token with Firebase Admin**, upserts the user, and issues a
  **short-lived JWT access token** + **long-lived refresh token** (rotated on use).
- Refresh-token state (jti) is tracked in Postgres (`RefreshToken`) and cached in Redis for fast revocation checks.
- **RBAC**: roles `CUSTOMER`, `RIDER`, `ADMIN`, `SUPER_ADMIN`, `SUPPORT` enforced by `RolesGuard`.

### Order lifecycle

`PENDING → ASSIGNED → ACCEPTED → PICKED_UP → OUT_FOR_DELIVERY → DELIVERED`
plus `CANCELLED` from any non-terminal state. Transitions are validated against a
state machine (`ORDER_STATUS_TRANSITIONS`) and every change is recorded in
`OrderStatusHistory` and broadcast over WebSocket (`order:status_changed`).

## 3. Data layer

- **PostgreSQL is the single source of truth.** Managed via Prisma (UUID PKs, `createdAt`,
  `updatedAt`, `deletedAt` soft-delete on every table).
- **Redis is ephemeral** — OTP attempt counters, rate-limit buckets, session/refresh cache,
  rider live-location cache, and the notification queue. Redis loss must never lose business data.

See [docs/api](../api) for the REST contract and [the database ERD](./database.md).

## 4. Realtime

- Socket.IO gateway namespaced `/realtime`, JWT-authenticated on handshake.
- Rooms: `order:{orderId}` (customer + assigned rider + admins), `rider:{riderId}`, `admins`.
- Rider location is throttled and cached in Redis, persisted periodically to `RiderLocation`.

## 5. Maps & geo

OpenStreetMap tiles in the apps via `flutter_map`. **Nominatim** for geocoding/reverse-geocoding,
**OSRM** for routing/ETA. Distances stored as lat/lng; great-circle helper used for assignment radius.

## 6. Deployment topology

| Component | Host | Domain |
|----------|------|--------|
| API + WebSocket | Render (Docker) | `api.kawkaw.in` |
| Admin dashboard | Vercel | `admin.kawkaw.in` |
| PostgreSQL | Avion | — |
| Redis | Upstash | — |
| Auth / FCM | Firebase (`kawkaw08`) | — |

CI/CD via GitHub Actions: lint → typecheck → test → build → migrate → deploy.

## 7. Security posture

Firebase token verification, JWT with rotation, RBAC, Redis rate limiting, Helmet, strict CORS,
global validation + sanitization, audit logging of sensitive actions, secure (validated, size-limited,
access-controlled) uploads for prescriptions. See [SECURITY.md](./security.md).
