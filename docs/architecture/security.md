# Kaw Kaw — Security Design

## Authentication

- **Identity**: Firebase Phone Auth (OTP) on clients. The API never sends SMS itself; it
  trusts only a verified Firebase **ID token**, checked server-side with the Firebase Admin SDK.
- **Sessions**: On successful Firebase verification the API issues a JWT **access token**
  (short TTL, default 15m) and an opaque-claimed **refresh token** (default 30d) carrying a `jti`.
- **Rotation**: Refresh tokens are single-use; using one rotates it and revokes the previous
  `jti`. State is persisted in `RefreshToken` (Postgres) and mirrored in Redis for O(1) revocation.
- **Logout / revoke**: deletes refresh state and blacklists the `jti` in Redis until expiry.

## Authorization (RBAC)

Roles: `CUSTOMER`, `RIDER`, `ADMIN`, `SUPER_ADMIN`, `SUPPORT`.
`@Roles(...)` + `RolesGuard` gate endpoints. `SUPER_ADMIN` ⊇ `ADMIN`. Admin role grants are
themselves audit-logged.

## Transport & headers

- HTTPS everywhere (TLS terminated at Render / Vercel).
- **Helmet** for security headers; HSTS in production.
- **CORS** allow-list driven by `CORS_ORIGINS` env (apps + admin domain only).

## Input handling

- Global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`,
  `transform: true` — unknown properties are rejected, types coerced.
- `class-validator` / `class-transformer` on every DTO. Additional sanitization for
  free-text (trim, strip control chars) and strict typing for numbers/enums.
- Prisma parameterizes all queries → no SQL injection.

## Rate limiting

- Redis fixed-window counters keyed by IP and (when authenticated) user id.
- Stricter buckets on auth endpoints (OTP exchange, refresh) to deter abuse.

## Uploads (prescriptions)

- Only image MIME types (`image/jpeg`, `image/png`, `image/webp`), max size enforced.
- Client compresses; server re-validates magic bytes and dimensions.
- Stored under access-controlled storage; URLs are not publicly guessable.
- Access limited to the owning customer, assigned rider (delivery only), and admins/pharmacists.

## Auditing

`AuditLog` records actor, action, entity, before/after diff, IP, and user agent for sensitive
operations (role changes, order cancellation, prescription verification, settings changes).

## Secrets

- All secrets via environment variables (never committed). See `.env.example`.
- `JWT_SECRET` / `JWT_REFRESH_SECRET` are independent high-entropy values.
- `FIREBASE_PRIVATE_KEY` stored with escaped newlines; decoded at runtime.
- Env is **validated on boot** (Joi schema); the process refuses to start if misconfigured.

## Data protection

- Soft deletes (`deletedAt`) preserve audit trail; hard deletion is an admin-only, logged action.
- PII (phone, address) access is role-restricted and logged.
- Redis holds only ephemeral data; PostgreSQL is the source of truth.
