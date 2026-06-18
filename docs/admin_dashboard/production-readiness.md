# Admin Dashboard — Production Readiness Checklist

## Build & types
- [x] `npm run typecheck --workspace @kawkaw/admin-dashboard` passes (strict TS).
- [x] `npm run build --workspace @kawkaw/admin-dashboard` succeeds — 16 routes compiled.
- [ ] `npm run lint --workspace @kawkaw/admin-dashboard` reviewed (lint is skipped during build via `ignoreDuringBuilds`; run it in CI).
- [x] Next.js pinned to a CVE-patched 15.x (`15.5.19`).

## Security
- [x] Only `NEXT_PUBLIC_*` env vars are used — no server secrets in the bundle.
- [x] Firebase web API key is a public client id (safe); Android keys are not reused.
- [x] RBAC enforced **server-side** by the API (`@Roles` guards) — the UI nav/guards are convenience only; a SUPPORT user cannot call ADMIN endpoints even by URL.
- [x] Auth tokens: access token in memory/localStorage, refresh rotates via `/auth/refresh`; 401 → one silent refresh → else forced re-login.
- [ ] `NEXT_PUBLIC_FIREBASE_TEST_MODE=false` in production (test mode disables reCAPTCHA — dev only).
- [x] `robots: noindex` set; the console must not be indexed.
- [ ] Firebase **authorized domains** include `admin.kawkaw.in`.
- [ ] API `CORS_ORIGINS` includes `https://admin.kawkaw.in` only (no wildcards in prod).

## Functionality (verified against the live API)
- [x] All admin endpoints return 200/201 with expected shapes (dashboard, analytics incl. service breakdown + rider performance, orders + filters, users by role, riders by status, products, categories, inventory, prescriptions, broadcast + history, audit + entityType filter, admins, settings).
- [x] Backend query DTOs accept the dashboard's filters (`users?role`, `riders?status`, `audit-logs?entityType`) — fixed during Phase 4.
- [x] Broadcasts and sensitive admin actions are written to the **audit trail**.
- [ ] End-to-end smoke on the deployed URL: login → dashboard metrics → assign a rider → review a prescription → broadcast (per `testing-checklist.md`).

## UX / resilience
- [x] Every list has loading / empty / error states; tables paginate and scroll on small screens.
- [x] App-wide **error boundary** + per-mutation toasts (no silent failures).
- [x] Responsive desktop (fixed sidebar) and tablet (drawer) layouts.
- [ ] Verified on a real tablet width (768–1024px) and a 1280px+ desktop.

## Operations
- [ ] Bootstrap the first SUPER_ADMIN via `ADMIN_PHONE=+91… npm --workspace @kawkaw/api run admin:create` before go-live.
- [ ] Confirm at least one verified rider exists so order assignment is testable.
- [ ] Decide on error monitoring (the error boundary currently logs to console; wire Sentry/etc. if desired).
- [ ] Vercel **Instant Rollback** understood for incident response.

## Known limitations (V1)
- Product **images are URLs** (no file-upload endpoint for products in V1; the prescription upload is the only file pipeline). Admins paste hosted image URLs.
- "Active customers" on the dashboard shows **total** registered customers (the API exposes a total count, not an active-today metric).
- Analytics charts are dependency-free (CSS bars), not an interactive charting library — sufficient for V1 operational insight.
