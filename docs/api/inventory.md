# Kaw Kaw API — Endpoint Inventory (Phase 1)

Generated from the live OpenAPI spec (`/api/docs-json`). **73 paths · 91 operations.**
All routes are under `/api/v1`. Auth = Bearer JWT unless marked Public.

Legend: 🟢 customer · 🛵 rider · 🛠️ admin/super-admin/support · 🌐 public

---

## 🌐 Public / shared

| Method | Path | Notes |
|--------|------|-------|
| GET | `/health/live` | liveness |
| GET | `/health/ready` | readiness (PG + Redis) |
| GET | `/settings/public` | client config (delivery fee, store_open, …) |
| GET | `/categories`, `/categories/{id}` | browse categories |
| GET | `/products`, `/products/{id}`, `/products/featured` | browse / search products |
| POST | `/auth/firebase` | exchange Firebase ID token → JWTs |
| POST | `/auth/refresh` | rotate refresh token |
| POST | `/auth/logout` | revoke a refresh token |

## 🟢 Customer

| Area | Endpoints |
|------|-----------|
| Account | `GET/PATCH /users/me`, `GET /auth/me`, `POST /auth/logout-all` |
| Addresses | `GET/POST /addresses`, `GET/PATCH/DELETE /addresses/{id}`, `PATCH /addresses/{id}/default` |
| Catalog | (public products/categories above) |
| Coupons | `POST /coupons/validate` |
| Orders | `POST /orders`, `GET /orders`, `GET /orders/{id}`, `POST /orders/{id}/cancel` |
| Parcels | `POST /parcels/quote`, `POST /parcels`, `GET /parcels`, `GET /parcels/{id}`, `POST /parcels/{id}/cancel` |
| Prescriptions | `POST /prescriptions/upload`, `GET /prescriptions/mine`, `GET /prescriptions/{fileId}/file` |
| Notifications | `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/{id}/read`, `PATCH /notifications/read-all` |

## 🛵 Rider

| Area | Endpoints |
|------|-----------|
| Profile | `POST /riders/register`, `GET /riders/me`, `PATCH /riders/me/status`, `GET /riders/me/earnings` |
| Location | `POST /riders/me/location` |
| Order queue | `GET /orders/rider/queue`, `POST /orders/{id}/accept`, `/reject`, `/pickup`, `/out-for-delivery`, `/deliver` |
| Parcel queue | `GET /parcels/rider/queue`, `POST /parcels/{id}/accept`, `/pickup`, `/out-for-delivery`, `/deliver` |
| Notifications | (shared customer notification endpoints) |

## 🛠️ Admin / Super-admin / Support

| Area | Endpoints |
|------|-----------|
| Dashboard | `GET /admin/dashboard`, `GET /admin/analytics` |
| Admin mgmt | `GET/POST /admin/admins` (super-admin) |
| Users | `GET /users`, `GET /users/{id}`, `PATCH /users/{id}/active`, `PATCH /users/{id}/role` |
| Categories | `POST /categories`, `PATCH/DELETE /categories/{id}` |
| Products | `POST /products`, `PATCH/DELETE /products/{id}` |
| Inventory | `GET /inventory/low-stock`, `GET /inventory/{productId}`, `PATCH /inventory/{productId}`, `POST /inventory/{productId}/adjust` |
| Orders | `GET /orders/admin/all`, `POST /orders/{id}/assign`, `POST /orders/{id}/cancel` |
| Parcels | `GET /parcels/admin/all`, `POST /parcels/{id}/assign` |
| Prescriptions | `GET /prescriptions/pending`, `PATCH /prescriptions/{id}/verify` |
| Riders | `GET /riders`, `GET /riders/{id}/location`, `PATCH /riders/{id}/verify` |
| Coupons | `GET/POST /coupons`, `GET/PATCH/DELETE /coupons/{id}` |
| Notifications | `POST /notifications/send`, `POST /notifications/broadcast` |
| Settings | `GET /settings`, `POST /settings` |
| Audit | `GET /audit-logs` |

---

## Coverage vs. required surface (pre-Flutter checklist)

| Required for apps | Status |
|-------------------|--------|
| Login (phone/Firebase OTP) | ✅ `POST /auth/firebase` (+ refresh/logout/me) |
| Products | ✅ list/detail/featured/search |
| Categories | ✅ list/detail (+ admin CRUD) |
| **Cart** | ⚠️ **Intentionally client-side** — see note below |
| Orders | ✅ create/list/detail/cancel + full lifecycle |
| Rider assignment | ✅ `POST /orders/{id}/assign`, `/parcels/{id}/assign` |
| Rider location updates | ✅ `POST /riders/me/location` (+ admin read) |
| Notifications | ✅ list/unread/read + admin send/broadcast + FCM + WS |

### ⚠️ Note on Cart (deliberate design)

There is **no server-side cart resource** in V1. The cart lives in the client (Riverpod
state + local persistence); prices and stock are authoritatively (re)validated **server-side
at checkout** in `POST /orders` (products loaded fresh, prices taken from DB, stock
decremented transactionally). This is the standard quick-commerce pattern and avoids
cart-sync complexity for a single-device launch.

**If you want a persistent, cross-device cart** (e.g. start on phone, finish on web), I can add
a `Cart`/`CartItem` model + `GET/POST/PATCH/DELETE /cart` endpoints. Recommendation: keep
client-side for V1; revisit only if analytics show multi-device usage. Your call before Phase 2.

### Other observations
- No customer-facing "reorder" shortcut yet (can be derived from order history client-side; add `POST /orders/{id}/reorder` later if desired).
- Rider parcel lifecycle has no explicit `reject` (orders do). Add for parity if rider parcel rejection is needed.
- Search is via `GET /products?search=` (no dedicated `/search` endpoint) — sufficient for V1.
