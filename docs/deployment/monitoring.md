# Monitoring & Observability

## 1. Structured logging (in place)
The API uses **pino** structured JSON logging (nestjs-pino). Each request is
logged with method, path, status, response time, and a request id; secrets are
not logged (auth headers redacted). On Render, logs are visible in the dashboard
**Logs** tab and via the logs API. `LOG_LEVEL` env controls verbosity
(`info` in production).

The admin dashboard has an app-wide **error boundary** that logs render faults to
the browser console (wire to Sentry when a DSN is available — see below).

## 2. Health checks (in place)
| Endpoint | Purpose | Notes |
|---|---|---|
| `GET /api/v1/health/live` | liveness (process up) | Render restart probe; never depends on Redis |
| `GET /api/v1/health/ready` | readiness | checks **Postgres + Redis**; returns 503 if either down |

Use `/health/ready` for an external uptime monitor (e.g. UptimeRobot / BetterStack)
to alert on DB/Redis loss. On the free Render plan the service hibernates — a
1–5 min uptime ping also keeps it warm (or upgrade to Starter).

## 3. Sentry (WIRED ✅)
Sentry error monitoring is integrated and deployed on the backend and admin
(env-gated, so it's a no-op without a DSN).

### Backend (NestJS) — done
- `@sentry/node` initialised at the top of `main.ts` via `src/common/observability/sentry.ts`
  (`initSentry()`), guarded by `SENTRY_DSN`.
- `AllExceptionsFilter` calls `captureException()` for every **5xx** (with path/method/requestId).
- `SENTRY_DSN` is set on Render (project `kawkaw08`'s DSN). Redeploy applied.

### Admin (Next.js) — done
- `@sentry/react` initialised in `Providers` via `src/lib/sentry.ts` (`initSentry()`),
  guarded by `NEXT_PUBLIC_SENTRY_DSN` (enabled only in production builds).
- `ErrorBoundary.componentDidCatch` reports via `captureError()`.
- `NEXT_PUBLIC_SENTRY_DSN` set on Vercel.

### Mobile (Flutter) — optional follow-up
- Add `sentry_flutter` to each app, init in `bootstrap.dart`, pass the DSN via
  `--dart-define=SENTRY_DSN=...` at build time (requires rebuilding the AABs).
  Firebase Crashlytics is an alternative already available via Firebase.

**Verify:** trigger any error (a 5xx on the API or a render fault in the admin) →
it appears in the Sentry **Issues** dashboard (region `de`, project `4511585249919056`).
Plus Render logs + health checks for baseline observability.

## 4. Recommended alerts
- Uptime monitor on `/health/ready` (DB/Redis down).
- Render deploy-failure notifications (dashboard → Settings → Notifications).
- Vercel deployment notifications.
- Aiven (Postgres) + Upstash (Redis) dashboards for resource/connection limits.
