# Deploy on cPanel hosting (no GitHub needed)

cPanel works for this site ONLY if your hosting supports **Node.js**. You upload the
files directly - no GitHub required.

## STEP 0 - Check Node.js support (make or break)

Log in to cPanel and look under the **Software** section for **"Setup Node.js App"**.

- See it? Good - continue below. The whole site (website + admin + all features) will work.
- Don't see it? Your plan is static/PHP-only and **cannot run the backend**. Ask your
  host if they offer a Node.js plan, or use Railway/Render (free) instead.

---

## STEP 1 - Build the website on YOUR computer (once)

The server needs the built website (`dist` folder). On your PC, in the project folder,
run:

```
npm run build
```

This creates a `dist` folder. (You only need to repeat this when you change the
website's design/code.)

---

## STEP 2 - Make a zip to upload

1. In your project folder, **delete the `node_modules` folder** (and `server\node_modules`
   if present) - they are huge and the host rebuilds them. Do NOT delete anything else.
2. Select the remaining files/folders (including `dist`, `src`, `server`, `public`,
   `package.json`, `app.cjs`, `vite.config.js`, etc.) and **zip them** into `alrafiq.zip`.

---

## STEP 3 - Upload and extract in cPanel

1. cPanel -> **File Manager**.
2. Go to your home folder and create a folder named `alrafiq` (keep it OUTSIDE
   `public_html`; the Node app maps its own URL).
3. Open `alrafiq`, click **Upload**, choose `alrafiq.zip`.
4. Back in File Manager, right-click the zip -> **Extract** into the `alrafiq` folder.

---

## STEP 4 - Create the Node.js app

1. cPanel -> **Setup Node.js App** -> **Create Application**.
2. Settings:
   - **Node.js version:** 20 (or 18 if 20 is not listed)
   - **Application mode:** Production
   - **Application root:** `alrafiq`
   - **Application URL:** pick your domain, or a subdomain (e.g. create
     `test.yourdomain` under cPanel -> **Subdomains** first, then choose it here).
   - **Application startup file:** `app.cjs`
3. Click **Create**.

---

## STEP 5 - Install dependencies

On the Node.js App page for your app, click **"Run NPM Install"**. This installs the
website AND the backend in one go (the project is set up so one install does both).

> If the button errors, open cPanel -> **Terminal**, paste the "Enter to the virtual
> environment" command shown on the Node.js App page, then run:
> `npm install` and then `cd server && npm install`

---

## STEP 6 - Add your settings (environment variables)

On the Node.js App page -> **Environment variables** -> add:

- `JWT_SECRET` = a long random string (40+ characters)
- `SITE_URL` = your site address (e.g. `https://test.yourdomain.com`)
- (Optional live AI) `USE_REAL_AI` = `true`, `CLAUDE_API_KEY` = `sk-ant-...`

Then click **Restart** (top of the Node.js App page).

---

## STEP 7 - Open your site

Visit your Application URL. The admin panel is at `.../admin/login`
(default: Alrafiqshopping56@gmail.com / alrafiq123 - change it right away under
Team -> the key icon).

---

## Good news about cPanel

- **Your data is safe by default.** Accounts, products, and uploaded images live in
  `alrafiq/server/data` on the host disk, which persists - no special "volume" needed
  (unlike the free cloud hosts).
- No GitHub required - you uploaded files directly.

## Things to remember

- **After changing the website code**, re-run `npm run build` on your PC, re-zip, and
  re-upload the new `dist` folder (then Restart the app). Backend-only changes just
  need the server files re-uploaded + Restart.
- If `sharp` (image processing) fails to install on your host, ask support to enable
  it, or set image uploads aside - everything else still works.
- You need at least one domain or subdomain for the app URL. If your hosting gave you
  a temporary address, you can use that to test.

## Still the "real store" reminder

Once live, the site is fully browsable and all backend features are shared. But the
storefront's products/orders are stored per-visitor-browser until we move them to the
server. So products you add in admin show only in your browser until that migration is
done. Ask me to "migrate storefront data to the backend" when you want a true shared store.

---

## If cPanel is too fiddly

cPanel Node setup varies a lot between hosts and has no auto-build. If you get stuck,
Railway or Render (free, in DEPLOYMENT-GUIDE.md / RAILWAY-DEPLOY.md) are usually
smoother because they build and run automatically. I can also walk you through any
single step.
