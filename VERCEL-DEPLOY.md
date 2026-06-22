# Deploy the frontend to Vercel (backend on Railway)

This app is one codebase with two halves:

- **Frontend** (React + Vite)  -> Vercel (fast global CDN)
- **Backend** (Express API + image uploads) -> Railway (see `RAILWAY-DEPLOY.md`)
- **Database** -> Neon Postgres (set as `DATABASE_URL` on Railway)

The frontend calls the API at the relative path `/api`. `vercel.json` rewrites
`/api/*` to your Railway backend, so the browser sees a single origin — no CORS to
configure, and uploaded images at `/api/media/*` keep working with zero code changes.

## Do this first
Deploy the backend to Railway and copy its public URL, e.g.
`https://al-rafiq-production.up.railway.app` (see `RAILWAY-DEPLOY.md`).

## Steps
1. Open **`vercel.json`** in the project root and replace
   `https://YOUR-RAILWAY-APP.up.railway.app` with your real Railway URL.
   Commit and push to GitHub.

2. Go to https://vercel.com -> **Add New -> Project** -> import your GitHub repo.

3. Vercel auto-detects **Vite**. The build is already pinned in `vercel.json`:
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. *(Only if you use Firebase features)* add build-time variables under
   **Settings -> Environment Variables**: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`,
   etc. The API needs **no** env vars on Vercel — those live on Railway.

5. Click **Deploy**. You get a `*.vercel.app` URL. The storefront loads from Vercel
   and every `/api` call is forwarded to Railway. Admin panel: `.../admin/login`.

6. *(Optional)* **Settings -> Domains** to attach your own domain.

## How a request flows
```
Browser  ->  your-site.vercel.app/api/orders
         ->  (vercel.json rewrite)
         ->  your-railway-app.up.railway.app/api/orders  ->  Express  ->  Neon
```

## Good to know
- **Deploy the backend first.** If the Railway URL in `vercel.json` is wrong or the
  backend is asleep/down, all `/api` calls and images fail.
- **Every push to GitHub** redeploys both: Vercel (frontend) and Railway (backend).
- **Large admin uploads** pass through the Vercel proxy. If a big image upload ever
  fails, open the admin panel directly on the Railway URL — same features, and the
  upload hits the server without the proxy.
- **Simpler alternative:** you don't strictly need Vercel. Railway already serves the
  whole app (website + API) as one service — just use the Railway domain. Vercel only
  adds a CDN-hosted storefront in front of it.
