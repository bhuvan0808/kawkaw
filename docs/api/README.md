# Kaw Kaw API — Reference

- **Base URL:** `https://api.kawkaw.in/api/v1` (local: `http://localhost:3000/api/v1`)
- **Interactive docs (Swagger/OpenAPI):** `/api/docs`
- **Auth:** Bearer JWT access token in `Authorization: Bearer <token>`
- **Versioning:** URI — everything is under `/api/v1`.
- **Postman:** import [`kawkaw.postman_collection.json`](./kawkaw.postman_collection.json).

## Response envelope

Successful responses are wrapped:

```json
{ "success": true, "data": { /* payload */ }, "timestamp": "2026-06-16T08:00:00.000Z" }
```

Paginated payloads:

```json
{ "items": [], "total": 0, "page": 1, "pageSize": 20, "totalPages": 1 }
```

## Error standard

Every error returns a consistent shape (HTTP status mirrors `statusCode`):

```json
{
  "statusCode": 400,
  "errorCode": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": ["phone must be a valid phone number"],
  "timestamp": "2026-06-16T08:00:00.000Z",
  "path": "/api/v1/auth/firebase",
  "requestId": "..."
}
```

| HTTP | errorCode | When |
|-----|-----------|------|
| 400 | `VALIDATION_ERROR` | DTO validation failed (`details` lists messages) |
| 400 | `BAD_REQUEST` | domain rule violation (e.g. invalid lifecycle transition) |
| 401 | `UNAUTHORIZED` | missing/invalid/expired token |
| 403 | `FORBIDDEN` | authenticated but lacks the required role |
| 404 | `NOT_FOUND` | resource missing / not owned |
| 409 | `DUPLICATE_RECORD` | unique constraint (e.g. phone, slug, SKU) |
| 409 | `CONFLICT` | e.g. insufficient stock at checkout |
| 429 | `TOO_MANY_REQUESTS` | rate limit exceeded |
| 500 | `INTERNAL_ERROR` | unexpected (details never leaked) |

## Authentication flow

1. Client performs **Firebase Phone OTP** and obtains a Firebase **ID token**.
2. `POST /auth/firebase { idToken }` → API verifies it, upserts the user, returns
   `{ user, tokens: { accessToken, refreshToken, expiresIn } }`.
3. Send `Authorization: Bearer <accessToken>` on subsequent calls.
4. `POST /auth/refresh { refreshToken }` rotates tokens (old refresh is revoked).
5. `POST /auth/logout { refreshToken }` revokes a session; `POST /auth/logout-all` revokes all.

## Endpoint catalogue (v1)

| Area | Method & path | Role |
|------|---------------|------|
| Auth | `POST /auth/firebase`, `POST /auth/refresh`, `POST /auth/logout` | public |
| Auth | `GET /auth/me`, `POST /auth/logout-all` | any |
| Users | `GET/PATCH /users/me` | any |
| Users | `GET /users`, `GET /users/:id`, `PATCH /users/:id/active`, `PATCH /users/:id/role` | admin / super-admin |
| Addresses | `GET/POST /addresses`, `GET/PATCH/DELETE /addresses/:id`, `PATCH /addresses/:id/default` | customer |
| Categories | `GET /categories`, `GET /categories/:id` | public |
| Categories | `POST/PATCH/DELETE /categories[/:id]` | admin |
| Products | `GET /products`, `GET /products/featured`, `GET /products/:id` | public |
| Products | `POST/PATCH/DELETE /products[/:id]` | admin |
| Inventory | `GET /inventory/low-stock`, `GET /inventory/:productId`, `PATCH /inventory/:productId`, `POST /inventory/:productId/adjust` | admin |
| Orders | `POST /orders`, `GET /orders`, `GET /orders/:id`, `POST /orders/:id/cancel` | customer |
| Orders | `GET /orders/rider/queue`, `POST /orders/:id/{accept,reject,pickup,out-for-delivery,deliver}` | rider |
| Orders | `GET /orders/admin/all`, `POST /orders/:id/assign` | admin |
| Parcels | `POST /parcels/quote`, `POST /parcels`, `GET /parcels`, `GET /parcels/:id`, `POST /parcels/:id/cancel` | customer |
| Parcels | `GET /parcels/rider/queue`, `POST /parcels/:id/{accept,pickup,out-for-delivery,deliver}` | rider |
| Parcels | `GET /parcels/admin/all`, `POST /parcels/:id/assign` | admin |
| Prescriptions | `POST /prescriptions/upload`, `GET /prescriptions/mine`, `GET /prescriptions/:fileId/file` | customer/owner |
| Prescriptions | `GET /prescriptions/pending`, `PATCH /prescriptions/:id/verify` | admin/support |
| Riders | `POST /riders/register`, `GET /riders/me`, `PATCH /riders/me/status`, `POST /riders/me/location`, `GET /riders/me/earnings` | rider |
| Riders | `GET /riders`, `GET /riders/:id/location`, `PATCH /riders/:id/verify` | admin |
| Notifications | `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` | any |
| Notifications | `POST /notifications/send`, `POST /notifications/broadcast` | admin |
| Coupons | `POST /coupons/validate` | customer |
| Coupons | `GET/POST/PATCH/DELETE /coupons[/:id]` | admin |
| Settings | `GET /settings/public` | public |
| Settings | `GET /settings`, `POST /settings` | admin |
| Admin | `GET /admin/dashboard`, `GET /admin/analytics`, `GET/POST /admin/admins` | admin / super-admin |
| Audit | `GET /audit-logs` | admin |
| Health | `GET /health/live`, `GET /health/ready` | public |

## Realtime (Socket.IO)

- Namespace `/realtime`, authenticate on handshake with `{ auth: { token: <accessToken> } }`.
- Emit `order:subscribe { orderId }` to join an order room.
- Server events: `order:status_changed`, `order:assigned`, `rider:location`, `notification`.
