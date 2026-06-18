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

## 3. Sentry (optional — not yet wired)
Sentry is optional in V1 and currently **not integrated** (no DSN provided).
When you have a DSN:

### Backend (NestJS)
```bash
npm i @sentry/node --workspace @kawkaw/api
```
- Initialize `Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV, tracesSampleRate: 0.1 })` at the top of `main.ts`.
- Add a Nest exception filter (or `Sentry.setupExpressErrorHandler`) so the
  existing `AllExceptionsFilter` also reports 5xx to Sentry.
- Set `SENTRY_DSN` as a Render env var (secret).

### Admin (Next.js)
```bash
npx @sentry/wizard@latest -i nextjs   # in apps/admin_dashboard
```
- Add `NEXT_PUBLIC_SENTRY_DSN` to Vercel env; report errors from the
  `ErrorBoundary.componentDidCatch`.

### Mobile (Flutter)
- `sentry_flutter` in each app; init in `bootstrap.dart`; pass the DSN via
  `--dart-define=SENTRY_DSN=...` at build time.

Until then, Render logs + health checks + Firebase Crashlytics (if enabled on the
apps) provide baseline observability.

## 4. Recommended alerts
- Uptime monitor on `/health/ready` (DB/Redis down).
- Render deploy-failure notifications (dashboard → Settings → Notifications).
- Vercel deployment notifications.
- Aiven (Postgres) + Upstash (Redis) dashboards for resource/connection limits.
