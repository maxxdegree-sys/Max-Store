# Deploy to Railway (free test site with a public subdomain)

The project is set up to run as ONE Node service (the server also serves the
website), and it includes a `nixpacks.toml` so Railway builds it automatically -
you do not need to type any build settings.

## Before you start
Put the code on GitHub once (see DEPLOYMENT-GUIDE.md, Step 1 - use GitHub Desktop,
no commands needed). Then:

## Steps

1. Go to https://railway.app and **Login with GitHub** (free).

2. Click **New Project** -> **Deploy from GitHub repo** -> choose your `al-rafiq`
   repository. Railway detects `nixpacks.toml`, installs the website + backend,
   builds, and starts the single Node service automatically.

3. **Add a data volume** so uploaded images are NOT lost when the app restarts.
   (Your accounts, products and orders live in **Neon Postgres**; only the uploaded
   image *files* are stored on the server's disk.)
   - Open your service -> **Settings -> Volumes -> New Volume**
   - **Mount path:** `/app/server/data`
   - Save. It redeploys.

4. **Add environment variables** -> service -> **Variables -> New Variable**:
   - `DATABASE_URL` = your **Neon** Postgres connection string (Neon dashboard ->
     your project -> **Connection string**; keep the `?sslmode=require` on the end).
     This is required — the app will not start without it.
   - `JWT_SECRET` = a long random string (40+ characters)
   - `NIXPACKS_NODE_VERSION` = `20`
   - `SITE_URL` = your Railway URL (fill in after step 5)
   - (Optional, for live AI instead of sample mode)
     `USE_REAL_AI` = `true` and `CLAUDE_API_KEY` = `sk-ant-...`

5. **Get your public address:** service -> **Settings -> Networking ->
   Generate Domain**. Railway gives you something like
   `al-rafiq-production.up.railway.app`. Open it - your site is live for testing.
   The admin panel is at `.../admin/login`
   (default login: Alrafiqshopping56@gmail.com / alrafiq123 - change it immediately).

6. Copy that URL into the `SITE_URL` variable from step 4 and let it redeploy, so the
   SEO links and schema use your real address.

## Good to know (free plan)
- The service may "sleep" when nobody is visiting; the first visit after a pause
  takes a few extra seconds to wake. Perfectly fine for testing.
- Railway's free usage runs on trial credit; if it runs low the test URL pauses
  until the next cycle (or add a small top-up). Render's free tier is a no-credit
  alternative (steps in DEPLOYMENT-GUIDE.md).
- Every time you push new code to GitHub, Railway rebuilds and redeploys by itself.

## If a build fails
Open the **Deploy logs** in Railway. The most common fix is the Node version - make
sure `NIXPACKS_NODE_VERSION=20` is set. The build runs `npm run build` (via
`nixpacks.toml`) to create the `dist/` folder that the server serves.

## Does Railway suit this build?
Yes. Railway runs Node.js, so the FULL app works - website, admin, login, smart
import, image uploads, exports, AI tools, team/passwords and the audit log.

(Plain static or PHP-only "shared hosting" would NOT run the backend - it can only
host the website by itself, which loses all the admin/backend features. Use a
Node-capable host like Railway, Render, Fly.io, Koyeb, or a VPS / cPanel with
"Setup Node.js App".)

## One reminder about a "real store"
The site will be fully live and browsable, and all backend features are shared. But
the storefront's products/orders are still stored per-visitor-browser until we move
them to the server. So products you add in admin show only in your browser until
that migration is done (ask me to "migrate storefront data to the backend").
