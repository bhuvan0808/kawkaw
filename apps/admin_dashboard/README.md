# Kaw Kaw Admin Dashboard

Operations console for the Kaw Kaw delivery platform — **Next.js 15 (App Router) ·
TypeScript · Tailwind CSS · TanStack Query · Firebase Auth**. Talks to the NestJS
API (`@kawkaw/shared-types` is the shared contract).

## Sections
Dashboard metrics · Orders (filter/search/assign-rider/lifecycle) · Products ·
Categories · Inventory · Users & Riders (verify/suspend) · Pharmacy
(prescription review) · Notifications (broadcast + history) · Analytics ·
Audit log · Admins (super-admin) · Settings.

## Roles (RBAC)
`SUPER_ADMIN` (everything incl. Admins), `ADMIN` (everything except Admins),
`SUPPORT` (Dashboard, Orders, Users, Pharmacy). Enforced server-side by the API;
the nav and route guards mirror it in the UI.

## Local development
```bash
# 1. backend running on :3000 (from repo root)
npm --workspace @kawkaw/api run start:prod

# 2. Firebase web config + .env.local (once)
cd services/api && ADMIN_TEST_MODE=true node scripts/firebase-web-config.js && cd ../..

# 3. dashboard (served on http://localhost:3001)
npm install                                   # from repo root (workspaces)
npm run dev --workspace @kawkaw/admin-dashboard
```
Sign in with a staff phone number. With `NEXT_PUBLIC_FIREBASE_TEST_MODE=true`, a
configured Firebase **test** number signs in without a real SMS / reCAPTCHA.

## Scripts
- `dev` — Next dev server on port 3001
- `build` — production build
- `start` — serve the production build on 3001
- `typecheck` — `tsc --noEmit`
- `lint` — `next lint`

## Configuration
Copy `.env.local.example` → `.env.local` (or generate via the script above). All
config is `NEXT_PUBLIC_*` (API base URL + Firebase web app). No server secrets.

## Deploy
Vercel → `admin.kawkaw.in`. See [docs/admin_dashboard/vercel-deployment.md](../../docs/admin_dashboard/vercel-deployment.md),
[testing-checklist.md](../../docs/admin_dashboard/testing-checklist.md), and
[production-readiness.md](../../docs/admin_dashboard/production-readiness.md).
