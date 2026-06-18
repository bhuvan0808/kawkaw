# Admin Dashboard — Vercel Deployment Guide

The dashboard is a standalone Next.js app at `apps/admin_dashboard` inside the npm
monorepo. It is deployed to **Vercel** at **admin.kawkaw.in** and talks to the
Render-hosted API at **https://api.kawkaw.in/api/v1**.

## 1. Project setup (Vercel dashboard)
1. **New Project → Import** the Kaw Kaw Git repository.
2. **Root Directory:** `apps/admin_dashboard`. Enable *"Include files outside the root directory"* (the build needs `packages/shared_types`).
3. **Framework Preset:** Next.js (auto-detected).
4. **Build command:** leave default (`next build`). Vercel runs `npm install` at the repo root first, which builds the workspace.
   - The `@kawkaw/shared-types` workspace ships compiled `dist/`. If a clean install lacks it, add a root build step or a `prepare` script; `transpilePackages` in `next.config.mjs` also lets Next consume the package source.
5. **Install command:** default (`npm install`) at the monorepo root.
6. **Node version:** 20.x (matches `engines`).

## 2. Environment variables (Vercel → Settings → Environment Variables)
Set these for **Production** (and Preview if you want a staging build):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `https://api.kawkaw.in/api/v1` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | (from the Firebase **web** app, project `kawkaw08`) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `kawkaw08.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `kawkaw08` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `kawkaw08.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | (from the web app config) |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | (from the web app config) |
| `NEXT_PUBLIC_FIREBASE_TEST_MODE` | `false` (**never** `true` in production) |

> Generate the web values with `node services/api/scripts/firebase-web-config.js`
> (writes `apps/admin_dashboard/.env.local`) or copy them from the Firebase console
> (Project settings → Your apps → Web app "Kaw Kaw Admin"). The web API key is a
> public client identifier — safe to expose — but it is **not** the same key as the
> Android apps.

## 3. Custom domain
1. Vercel → **Domains** → add `admin.kawkaw.in`.
2. Add the CNAME record Vercel shows at your DNS provider.
3. Wait for the certificate to provision (HTTPS auto).

## 4. Firebase authorized domains
In the Firebase console → **Authentication → Settings → Authorized domains**, add:
- `admin.kawkaw.in`
- your Vercel preview domain(s) (e.g. `*.vercel.app`) if you test on previews.
Phone-auth (reCAPTCHA) is rejected from non-authorized domains.

## 5. Backend CORS
The API already allows `https://admin.kawkaw.in` (and `http://localhost:3001`) via
`CORS_ORIGINS`. If the admin domain changes, update `CORS_ORIGINS` on Render.

## 6. Deploy & verify
1. Push to the production branch (or click **Deploy**).
2. After the build, open `https://admin.kawkaw.in/login` and sign in with a staff number.
3. Confirm the dashboard metrics load (proves API + CORS + auth are wired).

## 7. Notes
- The app sends `X-Robots-Tag`/`robots: noindex` — it must not be indexed.
- All data is fetched **client-side** with the staff JWT; there is no server-side
  secret in the dashboard. Only `NEXT_PUBLIC_*` vars are used.
- Rollbacks: use Vercel's **Instant Rollback** to a previous deployment.
