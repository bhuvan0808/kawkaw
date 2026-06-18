# Backend Deployment — Render

The Kaw Kaw API (NestJS) runs on **Render** as a Docker web service, deploying
automatically from the GitHub repo `bhuvan0808/kawkaw` (branch `main`).

## Live resource (provisioned)
| | |
|---|---|
| Service | `kawkaw-api` (`srv-d8pq2c28qa3s73c3htlg`) |
| URL | https://kawkaw-api.onrender.com (API base: `/api/v1`) |
| Runtime | Docker (`services/api/Dockerfile`, context `.`) |
| Region | Singapore |
| Plan | **free** (⚠️ hibernates after ~15 min idle → ~50s cold start) |
| Health check | `/api/v1/health/live` (liveness — does not depend on Redis) |
| Auto-deploy | ⚠️ **not active** — see caveat below |
| Dashboard | https://dashboard.render.com/web/srv-d8pq2c28qa3s73c3htlg |

> **Production recommendation:** upgrade to the **Starter** plan ($7/mo) to remove
> hibernation/cold-starts. Starter requires a card on the Render account
> (Billing → add card), then change the service's Instance Type to Starter.

## ⚠️ Auto-deploy caveat (action needed)
The service was created via the Render API pointing at the **public** repo URL,
so Render has **no GitHub webhook** — pushes to `main` do **not** auto-deploy, and
env-var changes via the API do **not** auto-redeploy. Until fixed, apply changes
with a manual deploy:
```bash
curl -X POST https://api.render.com/v1/services/srv-d8pq2c28qa3s73c3htlg/deploys \
  -H "Authorization: Bearer $RENDER_API_KEY" -H "Content-Type: application/json" \
  -d '{"clearCache":"do_not_clear"}'
```
To enable true auto-deploy: in the Render dashboard, connect the **GitHub app** to
`bhuvan0808/kawkaw` (Settings → Build & Deploy → connect repo), or add a **Deploy
Hook** and call it from a GitHub Actions step. *(Vercel, by contrast, is
GitHub-linked and auto-deploys on push.)*

## Why liveness (not readiness) for the health check
`/health/ready` returns **503** if Postgres *or* Redis is briefly unreachable
(by design). Using it as Render's restart probe caused a restart loop on
transient blips. `/health/live` returns 200 whenever the process is up — correct
for a platform restart trigger. `/health/ready` remains available for monitoring.

## Environment variables (set on the service)
Non-secret config + the following **secrets** are set in Render (never committed):
`DATABASE_URL` (Aiven Postgres), `REDIS_URL` (Upstash, `rediss://`), `JWT_SECRET`,
`JWT_REFRESH_SECRET` (freshly generated for production), `FIREBASE_CLIENT_EMAIL`,
`FIREBASE_PRIVATE_KEY`. Plus `NODE_ENV=production`, `PORT=3000`, `API_GLOBAL_PREFIX=api`,
`FIREBASE_PROJECT_ID=kawkaw08`, `CORS_ORIGINS` (includes the Vercel admin origin),
`ADMIN_URL`, throttle/OTP/upload/maps config.

To update a secret: Render dashboard → service → **Environment** → edit → save
(auto-redeploys). Or via API:
```bash
curl -X PUT https://api.render.com/v1/services/srv-.../env-vars/JWT_SECRET \
  -H "Authorization: Bearer $RENDER_API_KEY" -H "Content-Type: application/json" \
  -d '{"value":"<new>"}'
```

## First-time setup (reproduce from scratch)
1. Render account → connect GitHub (or use a public repo URL).
2. **New → Blueprint** and pick the repo — Render reads `infra/deployment/render.yaml`
   (Docker, region, health check, and the `sync:false` secret placeholders), **or**
   create a Web Service manually (Docker, Dockerfile `./services/api/Dockerfile`).
3. Fill the secret env vars (DB/Redis/JWT/Firebase) in the dashboard.
4. Deploy. Migrations run on boot (`prisma migrate deploy` in the Docker CMD).
5. Verify: `GET /api/v1/health/ready` → `{database:up, redis:up}`.

## SSL
Render provisions and renews TLS automatically for `*.onrender.com`. For the
custom domain `api.kawkaw.in`: dashboard → **Settings → Custom Domains** → add
`api.kawkaw.in` → create the shown CNAME at your DNS provider → SSL auto-issues.
Then update `API_URL` and the apps' `--dart-define=API_BASE_URL` accordingly.

## Logs & monitoring
Structured JSON logs (pino) stream in the Render dashboard **Logs** tab and via
`GET https://api.render.com/v1/logs?ownerId=...&resource=srv-...`. Health: `/health/live`
(liveness) and `/health/ready` (DB+Redis). See [monitoring](../monitoring.md).

## Migrations against Aiven
The Docker image runs `prisma migrate deploy` on start. Migrations are generated
with `prisma migrate diff` (Aiven shadow-DB perms are limited) — never `migrate dev`
against the cloud DB. Confirmed working on first deploy (settings seeded, DB `up`).
