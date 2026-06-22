# Al Rafiq - Path to live (checklist)

Tick each item as you finish it. Items marked **You** are clicks you do; items
marked **Me** are code I do for you - just reply "do step Bx" when ready.

---

## A. Database - get Supabase running (Phase 1)

- [x] **A1. Supabase project created** (you've done this - project ID `fzjykcxrsyuhrgxsqlat`).
- [ ] **A2. (You) Run `supabase/schema.sql`** in Supabase -> SQL Editor -> + New query -> paste -> Run. Should say *"Success. No rows returned"*.
- [ ] **A3. (You) Run `supabase/seed.sql`** the same way. Adds 4 admins, 10 categories, 3 sample products, settings.
- [ ] **A4. (You) Verify in Table Editor** that `admin_users` has 4 rows, `categories` has 10, `products` has 3.
- [ ] **A5. (You) Create `server\.env`** using `notepad server\.env` in cmd. Contents: `JWT_SECRET`, `SITE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (sb_secret_... key).
- [ ] **A6. (You) Create root `.env`** using `notepad .env`. Contents: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (sb_publishable_... key).
- [ ] **A7. (You) Verify both .env files** with `type .env` (should print, not "file not found").
- [ ] **A8. (You) Sanity check** the backend reads the env: `cd server && node -e "import('dotenv').then(d=>{d.config(); console.log('URL:',process.env.SUPABASE_URL); console.log('Key length:',(process.env.SUPABASE_SERVICE_ROLE_KEY||'').length);})"` should print your URL and a positive number.

> When A1-A8 are all ticked, say **"Phase 1 done"** and I start section B.

---

## B. Backend - make the app actually use Supabase (Phase 2)

- [ ] **B1. (Me) Install `@supabase/supabase-js`** in the backend (`server/`).
- [ ] **B2. (Me) Add `server/src/db/supabase.js`** - a small client wrapper using the service-role key.
- [ ] **B3. (Me) Migrate `admin_users`** - login now reads from Supabase. Verify by signing in.
- [ ] **B4. (Me) Migrate `products` + `categories`** - admin Products + storefront read from Supabase.
- [ ] **B5. (Me) Migrate `customers` + `orders` + `order_items`**.
- [ ] **B6. (Me) Migrate `reviews` + `blog_posts`**.
- [ ] **B7. (Me) Migrate `complaints` + `complaint_events` + `complaint_notes`**.
- [ ] **B8. (Me) Migrate `accounts_txn` + `settings`**.
- [ ] **B9. (Me) Migrate `audit_log` + `export_log` + `import_log`**.
- [ ] **B10. (Me) Migrate `media_library` + Supabase Storage** (uploads land in the `media` bucket).
- [ ] **B11. (You) Restart `npm run dev:all`** and smoke-test: log in, add a product, see it in Supabase Table Editor.

---

## C. Storefront - customers see shared data (Phase 3)

- [ ] **C1. (Me) Storefront fetches products from the backend** (not from browser localStorage).
- [ ] **C2. (Me) Storefront fetches blog posts** the same way.
- [ ] **C3. (Me) Checkout saves orders** to the backend at "Place Order".
- [ ] **C4. (Me) Reviews read/write through the backend**.
- [ ] **C5. (You) Verify in a private/incognito window** that products you added in admin show up on the storefront.

---

## D. Push the code to GitHub (private repo)

- [ ] **D1. (You) Install GitHub Desktop** from https://desktop.github.com.
- [ ] **D2. (You) File -> Add local repository** -> choose `al-rafiq-github`. When it says "not a git repository", click **"create a repository"** -> name `al-rafiq` -> **Create repository**.
- [ ] **D3. (You) First commit:** summary `Initial commit - Al Rafiq Shopping Centre` -> **Commit to main**.
- [ ] **D4. (You) Publish repository** (top right) -> tick **Private** -> **Publish**.
- [ ] **D5. (You) Confirm** the repo is visible at `https://github.com/<your-username>/al-rafiq`.

---

## E. Deploy live (Railway recommended)

- [ ] **E1. (You) Sign in at https://railway.app** with your GitHub account.
- [ ] **E2. (You) New Project -> Deploy from GitHub repo** -> pick `al-rafiq`.
- [ ] **E3. (You) Add a Volume**: Settings -> Volumes -> mount path `/app/server/data`. (Optional once Supabase is live, but keep it for uploads if you stay on the local filesystem.)
- [ ] **E4. (You) Add env vars** in Railway: `JWT_SECRET`, `NIXPACKS_NODE_VERSION=20`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, plus the frontend ones if served from the same service: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. (Vite needs them at build time.)
- [ ] **E5. (You) Settings -> Networking -> Generate Domain** to get `al-rafiq.up.railway.app`.
- [ ] **E6. (You) Set `SITE_URL`** env var to that domain, redeploy.
- [ ] **E7. (You) Open the live URL** -> log in as Executive -> Team -> change your password (key icon) -> first task done.
- [ ] **E8. (You) Smoke-test live**: add a product, open the public site in a private window, confirm it appears.

---

## F. Production hardening (recommended before announcing)

- [ ] **F1. (Me) Security hardening pass** - add `helmet`, `express-rate-limit`, tighten CORS, refuse-boot on default JWT secret, raise bcrypt cost. (Moves readiness 58 -> ~72.)
- [ ] **F2. (You) Set up Sentry** for error tracking (free tier).
- [ ] **F3. (You) Connect a real domain** (optional now).
- [ ] **F4. (You) Wire a payment gateway** (JazzCash / Easypaisa / Stripe) - replaces COD-only.
- [ ] **F5. (You) Add a transactional email provider** (SendGrid / Resend) - replaces mailto:.

---

## Where you are right now

You're between **A1** and **A2**. The very next thing to do is run `supabase/schema.sql` in the Supabase SQL Editor, then `supabase/seed.sql`. After that, create the two .env files (A5-A8). Then ping me and I start section B.
