# End-to-End Test Report — Kaw Kaw

This consolidates the functional validation performed across the build phases and
the verification run against the **deployed production stack** (Render API +
Vercel admin + Aiven/Upstash + Firebase kawkaw08).

Legend: ✅ verified · 🔁 verified earlier phase · ⬜ recommended on production URLs before public launch.

## 1. Firebase auth flow ✅
- Phone OTP → Firebase ID token → `POST /auth/firebase` → Kaw Kaw JWT (access + rotating refresh).
- Verified live on the rider app emulator (Phase 3): test number `+919000000002`, OTP, reCAPTCHA auto-pass for test numbers, backend issued JWT, role resolved (RIDER/admin).
- Admin web uses the same exchange (Phase 4); deployed admin login page serves at the Vercel URL with the Firebase web app + authorized domains configured.
- Production endpoint check: `POST /api/v1/auth/firebase` reachable; rejects invalid tokens (401) and is rate-limited (see §8).

## 2. Token refresh flow ✅
- Access token (15m) + rotating refresh token (30d, single-use, hashed in DB + Redis revocation cache).
- Rider/customer apps + admin: 401 → silent `POST /auth/refresh` → retry; failure → forced re-login.
- Verified during Phase 3 live session (rider token rotated for the new RIDER role) and Phase 4 (admin refresh wired in the api-client). Refresh-token rotation + reuse-revocation covered by the Phase 1 e2e suite.

## 3. Customer order flow 🔁 (Phase 2, validated on emulator)
- Browse → cart (client-side, single-service) → COD checkout → `POST /orders` → order PENDING.
- Validated end-to-end on the emulator in Phase 2 (login, place COD order, live tracking). Order lifecycle + COD confirmed.
- ⬜ Re-run on production URLs once a customer release build points at the Render API.

## 4. Admin assignment flow ✅ (Phase 4) + deployed checks
- Admin lists orders → assigns a verified rider → order ASSIGNED → audit logged.
- Validated in Phase 4 (assign via the dashboard + API). Deployed API: `/orders/admin/all`, `/orders/:id/assign`, `/riders` all return 200 with the admin JWT (Phase 5 smoke check).

## 5. Rider delivery flow ✅ (Phase 3, validated on emulator)
- Assignment alert (WebSocket `order:assigned` + FCM + modal/sound/vibration) → Accept → Confirm pickup → Out for delivery → Delivered (COD) → earnings update.
- Fully validated on the emulator in Phase 3, including the modal-accept→delivery-screen fix. Full lifecycle reached DELIVERED; earnings summary updated.

## 6. Realtime tracking flow 🔁 (Phase 2/3)
- Rider foreground-service posts GPS (~12s) → `POST /riders/me/location` → Redis cache + DB → WebSocket to the order room → customer live map.
- Background location while screen-locked validated in Phase 3 (posts continued during a locked window). Customer live-tracking map validated in Phase 2.
- Production: Redis reachable from Render (`/health/ready` → redis up), WebSocket gateway mounted.

## 7. Notification flow ✅
- Order/assignment notifications dispatched (FCM where a device token exists) + persisted; admin **broadcast** + history.
- Phase 4: broadcast endpoint + history (via audit). Phase 5 deployed check: `POST /notifications/broadcast` → 201; appears in `/audit-logs?entityType=Notification`.
- Note: FCM push to a backgrounded/killed device requires the app to register its FCM token (validated path; the rider emulator lacked a real FCM token — verify on a physical device).

## 8. Production security checks (Phase 5, against the deployed API) ✅
| Check | Result |
|---|---|
| Health | `/health/ready` → `{database: up, redis: up}`, `/health/live` → 200 |
| TLS/SSL | HTTPS enforced (Render-managed cert) |
| CORS (allowed origin) | preflight 204 + `Access-Control-Allow-Origin: <vercel>` + credentials |
| CORS (evil.com) | no `Access-Control-Allow-Origin` → browser-blocked |
| Rate limit (auth) | 10 requests then **429** (`x-ratelimit-limit-auth: 10`) |
| RBAC | `@Roles` guards enforced server-side; SUPPORT cannot call ADMIN routes |
| Admin endpoints | dashboard / analytics / orders / users?role / riders?status / products / categories / inventory / prescriptions / admins / settings → all 200 with admin JWT |

## Outstanding before public launch
- ⬜ Full E2E **on production URLs** with a release build of each app (customer order → admin assign → rider deliver → COD collect).
- ⬜ FCM push on a physical device (background/killed app).
- ⬜ Load/cost check under the free Render tier (or upgrade to Starter).
