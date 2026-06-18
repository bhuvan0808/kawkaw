# CI/CD workflows

The canonical, runnable workflows live in [`.github/workflows`](../../.github/workflows)
(GitHub only executes workflows from that path). This folder documents them.

| Workflow | File | Trigger | Does |
|----------|------|---------|------|
| API CI | `.github/workflows/api-ci.yml` | push/PR touching `services/api` or `packages/shared_types` | install → build shared types → prisma generate/validate → lint → typecheck → migrate → build → unit tests → Docker build |

Phases 2–5 will add:
- `customer-app-ci.yml` / `rider-app-ci.yml` — Flutter analyze + test + build (Phases 2/3)
- `admin-ci.yml` — Next.js lint/build + Vercel deploy (Phase 4)
- `api-deploy.yml` — deploy to Render on `main` (Phase 5)

## Required repository secrets (Phase 1)

These are only needed for deploy workflows (added in Phase 5); CI uses ephemeral service containers.

- `RENDER_API_KEY`, `RENDER_SERVICE_ID` — Render deploy hook
- Production env values are configured in the Render dashboard (see `infra/deployment/render.yaml`).
