# Al Rafiq Shopping Centre - Complete A-to-Z Guide, Analysis & Diagnostics

This document explains the whole website in plain language: what it is, how every
feature works, how to run it, how the data flows, how SEO works, and a full
troubleshooting section. It also answers the question "why didn't my new product
or blog post show up?" (and what was fixed).

---

## 1. The big picture (architecture)

The project has two parts that run together:

1. **The website (frontend)** - what your customers and your team see in the
   browser. Built with React + Vite + Tailwind CSS. Runs on `http://localhost:5173`.
2. **The backend (API + database)** - a Node/Express server that handles secure
   login, the smart product import, image processing, exports, the AI/SEO tools,
   team management, and the tamper-proof audit log. Runs on `http://localhost:4000`
   and stores data in a simple file at `server/data/db.json`.

The website works on its own; the backend switches on the "power features" (import,
uploads, exports, AI, secure login, password management, impersonation).

Two kinds of data storage are used:

- **Browser storage (localStorage)** holds the storefront's live data - products,
  cart, wishlist, blog posts, reviews, complaints, team list, accounts, activity.
  This is how the demo runs with no database. It is per-browser.
- **Backend file (`db.json`)** holds the "server-truth" data the power features
  use - admin accounts with hashed passwords, imported products, the media
  library, the export log, and the audit trail.

> In a future production step these two can be merged onto one real database
> (Firebase/Supabase/Postgres). For now they are intentionally separate.

---

## 2. How to run it

First time only:

```
npm run setup
```

Every time:

```
npm run dev:all
```

Then open `http://localhost:5173` (store) and `http://localhost:5173/admin/login`
(admin). Default executive login: `Alrafiqshopping56@gmail.com` / `alrafiq123`.
Stop with Ctrl+C. Full details in HOW-TO-RUN.md.

---

## 3. The storefront (what customers see)

**Home page** - hero slider, category grid, and product rows: Featured, Trending,
New Arrivals, Best Sellers, plus a Flash Sale with a live countdown, promo banners,
testimonials, "why choose us", and a newsletter signup. The product rows are driven
by product **tags** (a product tagged `featured` appears in Featured, `flash-sale`
in the Flash Sale, etc.).

**Shop / Categories** - the full catalogue with search, category filter, brand
filter, price slider, and sorting (popular, newest, price, rating). `/category/<name>`
shows one category.

**Product detail page** - image gallery with zoom, price and discount, stock,
quantity selector, Add to Cart and Buy Now, specifications, customer reviews and a
review form, related products, delivery and return info, and share buttons.

**Cart & Checkout** - cart drawer and full cart page; checkout offers **Cash on
Delivery** and **Bank Transfer**, and two delivery options: free **Standard** and
**Allow-to-Open** (+Rs.300 so the customer can inspect before paying).

**Account** - register/login, profile dashboard, order history, wishlist, and order
tracking.

**Help & content** - Contact, File a Complaint (creates a ticket with an ID),
Track a Ticket, FAQ (with FAQ schema for Google/AI), Blog, Privacy Policy, Terms.

**Always-on** - sticky navbar with live search suggestions, dark/light mode,
WhatsApp floating button, and a mobile-first responsive layout.

---

## 4. The admin panel (your back office)

Open `/admin/login`. The left sidebar only shows the sections your role is allowed
to see. Sections:

- **Dashboard** - KPIs and charts. Revenue and profit are shown to Executives only;
  other roles see operational metrics instead.
- **Products** - add/edit/delete products, drag-and-drop image upload, and
  "Import from URL" (smart import). This is where you add products.
- **Orders** - order list with status filters; export to Excel/CSV/PDF.
- **Customers** - customer list; export.
- **Banners / Coupons** - homepage banners and discount codes.
- **Reviews** - moderate reviews, add manually, or bulk-import from CSV.
- **Complaints** - full ticket system with a per-ticket activity Timeline, Change
  History, Internal Notes, an executive-only Audit view, assignment/handler chain,
  escalation, and CSV audit export.
- **Accounts** - income/expense ledger, P&L, receivables, expense chart, CSV export.
- **Exports** - the Export Center: download Customers / Orders / Products as Excel,
  CSV, or watermarked PDF, with filters and an export audit log.
- **Blog & SEO** - the AI-assisted blog CMS (see section 7).
- **Email** - bulk email campaigns (import contacts, compose, send).
- **Team** - add members, set passwords, assign roles/permissions, and "enter"
  (impersonate) any account as super admin (see section 5).
- **Activity Log** - login/logout and action history across the team.

---

## 5. Roles, permissions & the Super Admin

The system uses Role-Based Access Control (RBAC). There are 14 permission "sections"
and each role is a set of those sections. Presets:

| Role | Can access |
|------|------------|
| Executive (Super Admin) | everything |
| Product Manager | dashboard, products |
| Order Manager | dashboard, orders, customers, exports |
| Support Agent | dashboard, complaints, reviews |
| Marketing Manager | dashboard, email, banners, coupons, blog |
| Accountant | dashboard, accounts, orders, exports |
| SEO Manager | dashboard, blog, exports |
| Content Writer | dashboard, blog |

You can also pick "Custom" and tick individual sections per user.

**Super Admin powers (Executive)** - in Team & Roles:

- **Enter (impersonate) any account** - the door icon switches you into that
  member's account so you see and use the site exactly as their role. An amber
  banner appears with "Exit to my account".
- **Set / change any user's password** - the key icon. The backend hashes it; the
  user can log in immediately with the new password.
- **Add a user with a password** so they can log in straight away.

All of these are recorded in the audit log. Passwords are never written to logs.
These three actions need the backend running.

---

## 6. The backend & where data lives

The backend (`server/`) provides:

- **Secure login** - email + password, checked against bcrypt-hashed passwords,
  returns a JWT session token (valid 12 hours).
- **RBAC enforcement** - every protected endpoint checks the caller's role/permission
  server-side, so the rules cannot be bypassed from the browser.
- **Smart import** - fetches a public product URL server-side, reads its structured
  data (JSON-LD/OpenGraph), and returns an editable draft. Protected against unsafe
  internal addresses.
- **Image processing** - validates JPG/PNG/WEBP, compresses, converts to WEBP, makes
  thumbnails, stores under `server/data/uploads/YYYY/MM/`.
- **Exports** - generates real Excel, CSV, and watermarked PDF files.
- **Team management** - add/update/delete users, set passwords, impersonate.
- **AI + SEO engine** - content scoring, schema generation, etc. (section 7).
- **Audit log** - an append-only record of who did what, when, from where.

To re-seed everything from scratch, stop the server, delete `server/data/db.json`,
and start again. Change the default passwords in `server/src/seed.js` before going
live.

---

## 7. SEO & the AI Blog module (how to rank)

Open admin -> **Blog & SEO**. Click "New post" to open the editor.

**Writing** - title, URL slug (auto from title), markdown content (use `##` for
headings, `-` for bullets, `|` for tables), excerpt, tags, category, featured image
(drag-and-drop), status (Draft / Scheduled / Published), and FAQ blocks.

**AI Assistant (right sidebar)** - one-click:
- Generate a full draft from the title + keywords
- Suggest 5 SEO titles
- Generate a meta description
- Generate FAQs
- Keyword ideas
- AI content score (6 categories)
- Semantic analysis (entities, keyword density)
- Internal link suggestions

By default the AI runs in **sample mode** (realistic placeholder generation + REAL
analysis, no API key needed). To use the live Claude API: copy `server/.env.example`
to `server/.env`, set `USE_REAL_AI=true`, paste your Anthropic key into
`CLAUDE_API_KEY`, and restart the backend.

**SEO panel (right sidebar)** - SEO title and meta-description fields with character
counters, focus keyword, canonical URL, Open Graph image, a **live SEO score** (title,
meta, keyword, headings, readability, AI-search optimisation) with fix-it tips, and a
**schema generator** (Article / FAQ / Breadcrumb JSON-LD you can copy).

**Why this helps ranking** - the site already outputs structured data (Article, FAQ,
Product, Store schema), a sitemap.xml, robots.txt, clean URLs, lazy-loaded images,
and fast Vite builds. Writing posts with a concise opening answer, clear headings,
bullet points, a comparison table, and an FAQ block is exactly what Google AI
Overview, ChatGPT, Perplexity and Bing favour - and the content score nudges you
toward all of those.

---

## 8. "I added a product / blog post - why didn't it show?" (IMPORTANT)

There were two separate reasons. Both are now handled:

### Products (this was a real bug - now FIXED)
The storefront pages (Home, Shop, product detail, search) used to read products from
a fixed built-in list, while the admin "Add Product" saved into the live store. They
were two different data sources, so newly added products never reached the storefront.

**Fixed:** the storefront now reads products from the same live store the admin
writes to, and the product list is now saved in your browser so it survives a page
refresh. After you pull this update: add a product in admin -> Products, and it
appears in Shop, its category page, and search right away.

Two things to know:
- A new product shows in **Shop / its category / search** immediately. It only shows
  in the **Featured / Trending / New Arrivals / Best Sellers** rows on the home page
  if you give it the matching **tag** (`featured`, `trending`, `new-arrival`,
  `best-seller`, `flash-sale`).
- Smart-imported products are saved as **draft** on the backend but are added to the
  storefront list so you can see and edit them.

### Blog posts (by design - not a bug)
The public `/blog` page only shows posts whose status is **Published**. If you click
**"Save draft"**, the post is saved but stays hidden from the public site. Click
**"Publish"** (or set Status = Published) and it appears immediately on `/blog` and as
a related article. Drafts are still visible in admin -> Blog & SEO.

---

## 9. Diagnostic / troubleshooting guide

**A product I added is not on the storefront**
- Make sure you saved it (you should see a "Product added" confirmation).
- Check it appears in Shop / its category / search (home-page rows need the right tag).
- If it vanished after refresh, you are on an older build - this is fixed now; pull
  the latest code and restart.

**A blog post is not on /blog**
- Its status is almost certainly **Draft**. Open it and click **Publish**.

**Login says "No admin account found" or wrong password**
- With the backend running, use the real passwords (default exec: `alrafiq123`).
- Without the backend, login falls back to demo mode (matches email only).

**Smart import / image upload / export / AI buttons do nothing or say "sign in to
the backend"**
- The backend is not running. Start it with `npm run dev:all`.
- For image uploads, the first `npm install` must have downloaded the image library
  (sharp). Re-run `npm run setup` if it failed.

**"Port already in use" (5173 or 4000) when starting**
- An old copy is still running. Run `npx kill-port 5173 4000`, then `npm run dev:all`.

**`npm` is not recognised**
- Install Node.js (LTS) from nodejs.org and reopen the terminal.

**Everything looks broken / I want a clean slate**
- Storefront data: clear the site's browser storage (DevTools -> Application ->
  Local Storage -> delete the `alrafiq-*` keys), then refresh.
- Backend data: stop the server, delete `server/data/db.json`, restart.

**Changes to code don't appear**
- The website hot-reloads automatically. The **backend** must be restarted after
  editing files in `server/`.

---

## 10. Going to production (checklist)

1. Change all default passwords (`server/src/seed.js`) and set a strong `JWT_SECRET`.
2. Move data from `db.json` + browser storage to a real database (Firebase/Supabase/
   Postgres) so all devices share one source of truth.
3. Host the API behind HTTPS; point the website's `/api` at it.
4. Add your real Anthropic key and set `USE_REAL_AI=true` for live AI.
5. Add real analytics (Google Analytics / Search Console) and a payment gateway if
   you move beyond COD/bank transfer.
6. Run the included audit checks before each release.

---

## 11. Known limitations (honest list)

- Storefront product/blog/cart data lives in the browser (per-device) until you
  connect a shared database. Two different browsers will not see each other's
  admin-added products yet.
- The dashboard analytics and SEO "rankings" use representative sample data, not a
  live Search Console feed.
- The blueprint's Next.js/Postgres/Docker/Redis stack is not used; this is the
  React/Vite + Express/JSON build by design.
- Smart import reads sites that publish standard product structured data; sites that
  block bots or render entirely in JavaScript may return little.

---

*Guide generated for Al Rafiq Shopping Centre. Keep this file with the project.*

