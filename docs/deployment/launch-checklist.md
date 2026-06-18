# Production Launch Checklist — Kaw Kaw

Status legend: ✅ done · ⚠️ needs action · ⬜ before go-live

## Backend (Render)
- ✅ API deployed (Docker) at https://kawkaw-api.onrender.com, auto-deploy from `main`.
- ✅ `/health/ready` → DB **up** + Redis **up**; `/health/live` is the restart probe.
- ✅ HTTPS/SSL active; structured (pino) logging streaming.
- ✅ Production JWT secrets (freshly generated, set in Render, not committed).
- ⚠️ **Upgrade Render free → Starter** (add a card) to remove hibernation/cold-starts before real users.
- ⬜ Add custom domain `api.kawkaw.in` (CNAME) + update `API_URL` and apps' `--dart-define`.
- ⬜ Set up an uptime monitor on `/health/ready`.

## Admin (Vercel)
- ✅ Deployed at https://kawkaw-admin-psi.vercel.app, GitHub auto-deploy, env wired to the Render API.
- ✅ `NEXT_PUBLIC_FIREBASE_TEST_MODE=false` in production.
- ✅ Vercel domain added to Firebase authorized domains.
- ⬜ Add custom domain `admin.kawkaw.in` (+ Firebase authorized domain + API CORS).
- ⬜ Confirm Vercel Deployment Protection setting matches intent (public login page vs. gated).

## Security
- ✅ No secrets in the repo (`.env`/`.env.local`/keystore/`.claude` gitignored; staged content scanned before each push).
- ✅ CORS restricted to the admin origin (verified: allowed origin reflected, evil.com blocked).
- ✅ Rate limiting enforced (auth: 10/min → 429 verified; global 120/min).
- ✅ RBAC enforced server-side (`@Roles` guards) — SUPPORT cannot hit ADMIN endpoints.
- ✅ Firebase: SMS region allow-list = [IN]; authorized domains set; service account in env only.
- ⚠️ **Rotate** the GitHub PAT, Vercel token, and Render API key shared during setup.
- ⬜ Rotate JWT secrets again post-launch if they were ever exposed; confirm Aiven/Upstash creds are dashboard-managed.
- ⬜ Move production secrets fully into platform dashboards (the OneDrive-synced `.env` is dev-only).

## Mobile apps
- ✅ Upload keystore generated (`kawkaw-upload.jks`, alias `kawkaw`) — **BACK IT UP** (off-machine) with its password; loss blocks updates (mitigated by Play App Signing).
- ✅/⚠️ Rider release AAB built & signed, pointing at the prod API (`--dart-define=API_BASE_URL=https://kawkaw-api.onrender.com`). Customer AAB: signing configured — build per the apps' build steps.
- ⬜ Reconcile customer `applicationId` (`in.kawkaw.kawkaw_customer` vs older docs) **before first upload** (immutable after).
- ⬜ Create Play Console apps + Internal Testing tracks; complete Data safety + permissions declarations (see `docs/play_store/`).
- ⬜ Background-location permissions declaration + demo video (rider).
- ⬜ Add release-keystore SHA-1 to Firebase (for real-SMS phone auth on signed builds).

## Legal / content (before store submission & real users)
- ⬜ Host Privacy Policy, ToS, Delivery, Refund, Data Retention at kawkaw.in/* (drafts in `docs/legal/` — **legal review required**; fill bracketed placeholders).
- ⬜ Privacy policy URL live + linked in both app listings and in-app.
- ⬜ Confirm support mailboxes (support@, rider-support@, privacy@, grievance officer).

## Data / operations
- ⬜ Bootstrap the first SUPER_ADMIN: `ADMIN_PHONE=+91… npm --workspace @kawkaw/api run admin:create`.
- ⬜ Seed real products/categories/inventory for Bhadrachalam; set `STORE_OPEN`, delivery fee, free-above threshold in Settings.
- ⬜ Onboard + verify at least one real rider.
- ⬜ Configure a real Firebase phone-auth flow (remove test numbers before public launch, or keep separate).

## Monitoring
- ✅ Health checks + structured logs.
- ⬜ (Optional) Sentry — see `monitoring.md`; DSN pending.
- ⬜ Render/Vercel/Aiven/Upstash alerts configured.

## Final gates
- ⬜ End-to-end smoke on production URLs (customer order → admin assign → rider deliver → COD).
- ⬜ Load/cost review (free-tier limits; Aiven/Upstash quotas).
- ⬜ Go/no-go sign-off.
