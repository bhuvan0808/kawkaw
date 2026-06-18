# Admin Dashboard Deployment — Vercel

The admin console (Next.js) runs on **Vercel**, auto-deploying from
`bhuvan0808/kawkaw` (root directory `apps/admin_dashboard`).

## Live resource (provisioned)
| | |
|---|---|
| Project | `kawkaw-admin` (`prj_IVWAjQVWN6onbGZHzdoPh4BJKpoF`) |
| Production URL | https://kawkaw-admin-psi.vercel.app |
| Framework | Next.js 15 (App Router) |
| Root directory | `apps/admin_dashboard` (monorepo; installs at repo root) |
| Git | linked to GitHub `bhuvan0808/kawkaw` (auto-deploy on push to `main`) |

## Environment variables (set on the project, all `NEXT_PUBLIC_*`)
| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `https://kawkaw-api.onrender.com/api/v1` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | (Firebase web app, project kawkaw08) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `kawkaw08.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `kawkaw08` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `kawkaw08.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | (web app) |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | (web app) |
| `NEXT_PUBLIC_FIREBASE_TEST_MODE` | **`false`** (production — reCAPTCHA enforced) |

All are non-secret client identifiers. Generate the Firebase values with
`node services/api/scripts/firebase-web-config.js` (writes `.env.local` locally).

## Monorepo build notes
- The build needs `@kawkaw/shared-types`; its compiled `dist/` is committed so a
  fresh clone resolves it (`transpilePackages` also set in `next.config.mjs`).
- Vercel installs at the repo root (npm workspaces) and builds from the root dir.
- Build verified: 16 routes compiled; `/login` serves and renders.

## First-time setup (reproduce)
1. Vercel → **Add New → Project** → import `bhuvan0808/kawkaw`.
2. **Root Directory** = `apps/admin_dashboard`; enable *"Include files outside root"*.
3. Framework preset: Next.js (auto). Node 20.
4. Add the env vars above (Production + Preview).
5. Deploy. Open `/login` and sign in with a staff phone number.

API-driven equivalent (used here): `POST /v11/projects` with `rootDirectory` +
`gitRepository`, `POST /v10/projects/{id}/env` per var, `POST /v13/deployments`.

## Custom domain (admin.kawkaw.in)
Project → **Settings → Domains** → add `admin.kawkaw.in` → add the shown CNAME at
DNS → SSL auto-issues. Then:
- Add `admin.kawkaw.in` to **Firebase → Auth → authorized domains**
  (`node services/api/scripts/firebase-add-domain.js admin.kawkaw.in`).
- Add it to the API `CORS_ORIGINS` on Render.

## Firebase authorized domains (required for login)
Phone-auth reCAPTCHA only runs on authorized domains. Already added:
`kawkaw-admin-psi.vercel.app`, the project alias, and `admin.kawkaw.in`. Add any
new preview/prod domain the same way.

## Deployment protection
If Vercel "Deployment Protection" (Vercel Authentication) is on, the production
domain may require Vercel login to view. For a publicly reachable admin login
page, disable protection for Production (Settings → Deployment Protection) or
rely on the custom domain. The app itself is still gated by Firebase + RBAC.
