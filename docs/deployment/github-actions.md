# CI/CD — GitHub Actions

Repo: **github.com/bhuvan0808/kawkaw** (public). Three path-filtered workflows run
on push/PR to `main`/`develop`; deployment itself is handled by Render and Vercel
auto-deploy (not by Actions), so CI is purely **validation**.

## Workflows
| File | Triggers on | Does |
|---|---|---|
| `.github/workflows/api-ci.yml` | `services/api/**`, `packages/shared_types/**` | spins up Postgres+Redis services, `npm ci`, build shared-types, prisma generate/validate, **lint, typecheck, migrate, build, unit tests**, then a **Docker image build** |
| `.github/workflows/admin-ci.yml` | `apps/admin_dashboard/**`, `packages/shared_types/**` | `npm ci`, build shared-types, **typecheck + `next build`** |
| `.github/workflows/flutter-ci.yml` | `apps/customer_app/**`, `apps/rider_app/**`, `packages/shared_ui/**` | matrix over both apps: `flutter pub get`, **`flutter analyze`, `flutter test`** (Flutter 3.27.x) |

All use `concurrency` to cancel superseded runs. CI uses dummy/CI secrets (e.g.
`JWT_SECRET` test value, ephemeral Postgres) — no production secrets in CI.

## How deployment happens
- **Backend (Render):** `autoDeploy: yes` on the service → every push to `main`
  that changes the build triggers a Render Docker build + deploy. Migrations run
  on container start.
- **Admin (Vercel):** the project is linked to the GitHub repo → every push to
  `main` triggers a Vercel production build; PRs get preview deployments.

So the pipeline is: **push → Actions validate → Render/Vercel build & deploy.**

## Required setup
- The push token used for `.github/workflows/**` needs the **`workflow`** scope
  (a `repo`-only PAT is rejected by GitHub when touching workflow files).
- No repo **secrets** are required for the current workflows. If you later add a
  deploy-from-Actions step, store tokens in **Settings → Secrets and variables →
  Actions** (e.g. `RENDER_API_KEY`, `VERCEL_TOKEN`) — never inline.
- Branch protection (recommended): require the three CI checks to pass before
  merging to `main`.

## Optional enhancements
- **Build release AABs in CI:** add a job using `subosito/flutter-action` +
  `flutter build appbundle --release --dart-define=API_BASE_URL=...`, with the
  keystore provided via base64 repo secrets (`KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`)
  decoded into `key.properties` at build time.
- **Deploy hooks:** Render exposes a Deploy Hook URL and Vercel a Deploy Hook —
  call them from a workflow if you want Actions to gate deploys.
- **E2E job:** run the API e2e suite against an isolated schema (see `api-ci`'s
  Postgres service pattern).
