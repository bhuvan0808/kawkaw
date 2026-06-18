# Production Readiness Audit — Kaw Kaw

**Date:** 2026-06-18 · **Verdict:** Deployed & verified; **not yet publicly launchable**.
**Launch score: 76 / 100.**

The platform is fully deployed to production infrastructure and the technical
foundation is verified live. The remaining 24 points are **go-live gates** —
legal hosting, Play Store submission, a paid hosting tier, token rotation, and
real operational data — which are intentionally incomplete at this "stop before
release" checkpoint.

## Score by category
| # | Category | Score | Notes |
|---|---|---|---|
| 1 | Backend infra (Render) | 12.5/15 | Live; DB+Redis up; health/SSL/structured-logging; fresh JWT; migrations ran. **Free tier hibernates** (≈50s cold start). |
| 2 | Admin (Vercel) | 9/10 | Live; env wired to API; build verified (16 routes); GitHub auto-deploy. |
| 3 | Mobile release | 8/12 | **Both AABs built & signed** at prod URL; keystore created. Not uploaded; release-SHA not yet on Firebase. |
| 4 | CI/CD | 7.5/8 | 3 GitHub Actions workflows + Render/Vercel auto-deploy. |
| 5 | Security | 12.5/15 | No secrets committed (scanned every push); CORS restricted; rate-limit 429; server-side RBAC; SMS region=IN. **Rotate shared tokens.** |
| 6 | Auth & core flows | 10/12 | All 7 flows validated (Phases 2–4 + prod checks). Full prod-URL E2E + FCM-on-device pending. |
| 7 | Legal/compliance | 5/10 | 5 solid drafts; need **counsel review + fill placeholders + host live + link**. |
| 8 | Play Store submission | 5/8 | Listings/data-safety/permissions/assets-checklist drafted; need screenshots/feature-graphic + console setup + bg-location declaration & demo video. |
| 9 | Monitoring | 3.5/5 | Structured logs + health checks live. Sentry optional/not wired; uptime monitor + alerts pending. |
| 10 | Operational data | 1.5/5 | No SUPER_ADMIN bootstrapped; no real catalog/settings/riders; custom domains not set. |
| | **Total** | **76/100** | |

## What's LIVE & verified ✅
- **API:** https://kawkaw-api.onrender.com — `/health/ready` → DB+Redis up, HTTPS, pino logs, 27 env vars (fresh prod JWT). Auto-deploys from `main`.
- **Admin:** https://kawkaw-admin-psi.vercel.app — `/login` renders; env → Render API; Firebase web auth + authorized domains set; auto-deploys.
- **Security (against deployed API):** CORS reflects only the admin origin (evil.com blocked); auth endpoint rate-limited to 10/min (429 verified); RBAC enforced server-side.
- **Repo:** github.com/bhuvan0808/kawkaw (public) — no secrets committed; `.env`/`.env.local`/keystores/`.claude` gitignored; staged content scanned before each push.
- **Release builds:** signed rider (53.9 MB) + customer (55.5 MB) AABs, pointing at the prod API.
- **Docs:** legal (5), Play Store (5), deployment guides (Render/Vercel/Actions/monitoring/launch-checklist/E2E report).

## 🔴 Blockers (must clear before public launch)
1. **Rotate the three tokens** shared during setup (GitHub PAT, Vercel token, Render API key) — they were transmitted in chat.
2. **Upgrade Render free → Starter** (add a card). Free-tier hibernation = ~50s first-request delay → unacceptable for live customers/riders.
3. **Legal:** lawyer-review the 5 policies, fill `[placeholders]` (retention periods, refund windows, jurisdiction, CIN/address/grievance officer), **host at kawkaw.in/** and link in apps + listings. Google Play requires a **live privacy-policy URL**.
4. **Play Console:** create both apps, complete **Data safety**, **background-location permissions declaration + demo video** (rider), foreground-service-type declaration, content rating; upload the AABs to **Internal Testing**.
5. **Add the release keystore SHA-1** (`CE:75:1D:6E:74:6D:BC:CE:21:73:6F:06:FE:05:33:E5:6E:8F:9A:74`) to Firebase for real-SMS phone auth on signed builds.
6. **Bootstrap operations:** create the first SUPER_ADMIN (`npm --workspace @kawkaw/api run admin:create`), seed real Bhadrachalam catalog/categories/inventory + Settings (store-open, fees), verify a real rider.
7. **Back up the upload keystore** (`C:\kawkaw\_keystore\kawkaw-upload.jks` + password) off-machine — losing it blocks updates (Play App Signing mitigates but don't rely on it).

## 🟡 Recommendations (soon after / hardening)
- Custom domains: `api.kawkaw.in` (Render) + `admin.kawkaw.in` (Vercel) + matching Firebase authorized domain + CORS; rebuild apps with `--dart-define=API_BASE_URL=https://api.kawkaw.in`.
- Move production secrets fully into platform dashboards; the OneDrive-synced `services/api/.env` is dev-only (cloud-sync exposure).
- Full E2E on production URLs with release builds (customer order → admin assign → rider deliver → COD); FCM push on a physical device.
- Uptime monitor on `/health/ready`; deploy-failure alerts (Render/Vercel); Aiven/Upstash quota alerts.
- (Optional) Sentry — DSN pending; integration documented in `monitoring.md`.
- Branch protection on `main` requiring the 3 CI checks.
- Reconcile the stale `in.kawkaw.customer` references in older docs (the app correctly uses `in.kawkaw.kawkaw_customer`).

## 🟢 Strengths
Clean modular monolith API with graceful degradation; design-system-consistent apps; server-side RBAC + audit trail; production-real (no mocks); secret hygiene held through a public push; both apps validated live on-device in earlier phases.
