# Al Rafiq Shopping Centre - Deployment Guide (Go Live)

This guide takes the project from your computer to a public website, the easy way.

The app is set up to deploy as **ONE service on ONE web address** - the backend
serves the website and the API together. That avoids cross-domain and image
problems and is the simplest reliable setup.

We will use:
- **GitHub** - to store your code online (free).
- **Render.com** - to run the app and give you a public URL (free tier).

You do NOT need a domain to start - Render gives you a free address like
`al-rafiq.onrender.com`. You can add your own domain later.

---

## IMPORTANT: read this first (about a "real store")

You chose "real store for customers". One honest thing to know:

Right now the **storefront keeps its products/orders in each visitor's browser**
(that is how the demo runs without a database). So after deploying, the website
will be live and fully browsable, BUT a product you add in the admin shows only in
**your** browser - a customer on their phone would still see the original sample
products.

To make admin-added products visible to **every** customer, the products (and blog,
orders, reviews) must be moved to the **server** so everyone shares one source of
truth. That is a code change I can do for you - see **Step 6**. You can deploy now
to get the site online, and we do that migration as the next step.

Everything that already uses the backend (admin login, smart import, image uploads,
exports, AI tools, team/passwords, audit log) WILL be fully live and shared.

---

## Step 1 - Put your code on GitHub

1. Create a free account at https://github.com
2. Click the **+** (top right) -> **New repository**. Name it `al-rafiq`. Keep it
   Private. Click **Create repository**.
3. Install **GitHub Desktop** from https://desktop.github.com (easiest, no commands).
4. In GitHub Desktop: **File -> Add local repository**, choose your project folder
   `Documents\Claude\Projects\al rafiq shopping centre`. If it says it is not a git
   repo, click **create a repository** and then **Publish repository** to your
   `al-rafiq` repo.

> Make sure a `.gitignore` exists with `node_modules`, `dist`, and
> `server/data/db.json` in it so you do not upload junk. (The project already has
> `.gitignore` files.)

---

## Step 2 - Create the web service on Render

1. Create a free account at https://render.com (sign in with GitHub - easiest).
2. Click **New +** -> **Web Service**.
3. Connect your `al-rafiq` GitHub repo.
4. Fill in the settings:
   - **Name:** `al-rafiq` (this becomes `al-rafiq.onrender.com`)
   - **Region:** closest to Pakistan (e.g. Singapore)
   - **Branch:** `main`
   - **Runtime:** Node
   - **Build Command:**
     ```
     npm install && npm run build:all
     ```
   - **Start Command:**
     ```
     npm start
     ```
   - **Instance Type:** Free
5. Click **Create Web Service**. The first build takes a few minutes.

When it finishes, open the URL Render shows (e.g. `https://al-rafiq.onrender.com`) -
your website is live. The admin is at `https://al-rafiq.onrender.com/admin/login`.

---

## Step 3 - Add a persistent disk (so data is not lost)

The backend stores accounts, imported products and uploads in files. On the free
plan these reset when the service restarts unless you add a disk.

1. In your Render service -> **Disks** -> **Add Disk**.
   - **Name:** `data`
   - **Mount Path:** `/opt/render/project/src/server/data`
   - **Size:** 1 GB (free allowance)
2. Save. Render redeploys. Now `db.json` and uploaded images survive restarts.

> Note: the free Render plan "sleeps" after 15 minutes of no traffic and takes ~30s
> to wake on the next visit. Fine for launch; upgrade to a paid instance ($7/mo) to
> keep it always awake.

---

## Step 4 - Set your secrets (environment variables)

In your Render service -> **Environment** -> **Add Environment Variable**:

| Key | Value |
|-----|-------|
| `JWT_SECRET` | a long random string (e.g. mash your keyboard 40+ chars) |
| `SITE_URL` | your Render URL, e.g. `https://al-rafiq.onrender.com` |
| `NODE_VERSION` | `20` |

Optional (only if you want live AI instead of sample mode):

| Key | Value |
|-----|-------|
| `USE_REAL_AI` | `true` |
| `CLAUDE_API_KEY` | your Anthropic key (`sk-ant-...`) |

Save -> Render redeploys. **Change the default admin passwords** after first login
(Team -> the key icon), or edit `server/src/seed.js` before deploying.

---

## Step 5 - First-login checklist (live site)

1. Go to `/admin/login`, sign in as `Alrafiqshopping56@gmail.com` / `alrafiq123`.
2. Team -> set a new strong password for yourself (key icon).
3. Add your real products, banners, and a blog post (remember to **Publish** posts).
4. Test on your phone to confirm mobile layout.

---

## Step 6 - Make it a TRUE shared store (next step)

So that products/blog/orders you add are visible to ALL customers (not just your
browser), these need to move from browser storage to the server:

- Products: serve from the backend; admin writes to the backend.
- Blog posts: same.
- Orders: saved to the backend at checkout so you see real orders in admin.
- Reviews: stored on the backend so they show for everyone.

This is a code change (not a hosting setting). Ask me to "migrate the storefront
data to the backend" and I will do it; then push to GitHub and Render auto-redeploys.

---

## Step 7 - Add your own domain (optional, later)

1. Buy a domain (e.g. from GoDaddy, Namecheap, or a Pakistani registrar for `.pk`).
2. In Render -> your service -> **Settings -> Custom Domains -> Add**. Enter your
   domain.
3. Render shows a DNS record (CNAME). Add it in your domain registrar's DNS settings.
4. Wait for it to verify (minutes to a few hours). HTTPS is automatic.
5. Update the `SITE_URL` environment variable to your new domain.

---

## Alternative hosts (same idea)

- **Railway.app** - similar to Render; add a Volume for `server/data`. Build:
  `npm install && npm run build:all`, Start: `npm start`.
- **A VPS / cPanel with Node** - upload the project, run `npm install`,
  `npm run build:all`, then keep `npm start` running with PM2. Point your domain at it.

The build and start commands are the same everywhere because the app is one service.

---

## Going-live checklist (do not skip)

- [ ] Changed all default passwords and set a strong `JWT_SECRET`
- [ ] Added a persistent disk (Step 3)
- [ ] Set `SITE_URL` to your real address
- [ ] Published your real products and at least one blog post
- [ ] Tested checkout, login, and mobile view on the live URL
- [ ] (For a true shared store) completed Step 6 - the data migration
- [ ] Added a payment method beyond COD/bank transfer if you need online payments
- [ ] Connected Google Analytics / Search Console for traffic + SEO tracking

---

## Quick troubleshooting

**Build fails on Render** - check the build log. Usually a Node version issue: set
`NODE_VERSION=20`. The build command must be `npm install && npm run build:all`.

**Site loads but admin features say "sign in to the backend"** - the server is the
site itself now, so this should not happen in production; if it does, the build did
not include the server install - confirm the build command ran `npm run build:all`.

**Images uploaded in admin disappear after a while** - you skipped Step 3 (the disk).
Add it.

**Site is slow on first open** - free plan sleeping; upgrade to keep it awake.

---

*Deployment guide for Al Rafiq Shopping Centre. The app is configured to run as a
single Node service that serves both the website and the API.*

